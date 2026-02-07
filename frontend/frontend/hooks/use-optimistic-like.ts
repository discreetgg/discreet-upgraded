'use client';

import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { useLikesContext } from '@/context/likes-context';
import { likePostService, unlikePostService } from '@/lib/services';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseOptimisticLikeProps {
  targetId: string;
  targetType: 'Post' | 'Comment';
  initialLiked: boolean;
  initialCount: number;
  onError?: (error: Error) => void;
}

interface OptimisticLikeState {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  isAnimating: boolean;
}

export const useOptimisticLike = ({
  targetId,
  targetType,
  initialLiked,
  initialCount,
  onError,
}: UseOptimisticLikeProps) => {
  const [state, setState] = useState<OptimisticLikeState>({
    isLiked: initialLiked,
    likeCount: initialCount,
    isLoading: false,
    isAnimating: false,
  });

  const { isAuthenticated } = useAuth();
  const { user } = useGlobal();

  // Try to use LikesContext, but work without it if not available
  let likesContext: ReturnType<typeof useLikesContext> | null = null;
  try {
    likesContext = useLikesContext();
  } catch {
    likesContext = null;
  }

  // Use ref to track pending operations and prevent race conditions
  const pendingOperationRef = useRef<Promise<unknown> | null>(null);
  // Use ref to access current state without adding it to dependencies
  const stateRef = useRef(state);
  stateRef.current = state;

  // Subscribe to like updates from other components
  useEffect(() => {
    if (!likesContext) {
      return;
    }

    const unsubscribe = likesContext.subscribeToLikeUpdates((update) => {
      if (update.targetId === targetId && update.targetType === targetType) {
        setState((prev) => ({
          ...prev,
          isLiked: update.isLiked,
          likeCount: update.likeCount,
        }));
      }
    });

    return unsubscribe;
  }, [targetId, targetType, likesContext]);

  const toggleLike = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    if (!user) {
      return;
    }

    // Get current state values from ref to avoid dependency issues
    const currentState = stateRef.current;
    const currentIsLiked = currentState.isLiked;
    const currentCount = currentState.likeCount;

    if (currentState.isLoading) {
      return;
    }

    // Don't wait for pending operations - just proceed with optimistic update
    // This makes the UI feel more responsive

    // Store current state for potential rollback
    const previousIsLiked = currentIsLiked;
    const previousCount = currentCount;
    const newIsLiked = !currentIsLiked;
    const newCount = currentIsLiked ? currentCount - 1 : currentCount + 1;

    // Immediate optimistic update - this should happen instantly
    setState({
      isLiked: newIsLiked,
      likeCount: newCount,
      isLoading: false, // Don't show loading state for better perceived performance
      isAnimating: true,
    });

    // Notify other components about the optimistic update
    likesContext?.updateLike({
      targetId,
      targetType,
      isLiked: newIsLiked,
      likeCount: newCount,
    });

    // Start the API call in the background
    const payload = {
      discordID: user.discordId,
      targetId,
      targetType,
    };

    const operation = previousIsLiked
      ? unlikePostService(payload)
      : likePostService(payload);

    pendingOperationRef.current = operation;

    try {
      await operation;
      // Success - no need to update UI again, optimistic update was correct
    } catch (error) {
      console.error('Error toggling like:', error);

      // Rollback to previous state only on failure
      setState({
        isLiked: previousIsLiked,
        likeCount: previousCount,
        isLoading: false,
        isAnimating: true,
      });

      // Notify other components about the rollback
      likesContext?.updateLike({
        targetId,
        targetType,
        isLiked: previousIsLiked,
        likeCount: previousCount,
      });

      if (error instanceof Error) {
        onError?.(error);
      } else {
        onError?.(new Error('Failed to toggle like'));
      }
    } finally {
      // Clear pending operation
      pendingOperationRef.current = null;

      // Stop animation after a shorter delay for snappier feel
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          isAnimating: false,
        }));
      }, 150); // Reduced from 300ms to 150ms
    }
  }, [isAuthenticated, user, targetId, targetType, onError, likesContext]); // Removed 'state' dependency

  const updateFromExternal = useCallback((liked: boolean, count: number) => {
    setState((prev) => ({
      ...prev,
      isLiked: liked,
      likeCount: count,
    }));
  }, []);

  return {
    ...state,
    toggleLike,
    updateFromExternal,
  };
};

'use client';

import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { useLikesContext } from '@/context/likes-context';
import { serverService } from '@/lib/server-service';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseServerOptimisticLikeProps {
  serverId: string;
  initialLiked: boolean;
  initialCount: number;
  fetchInitialLikedOnMount?: boolean;
  onError?: (error: Error) => void;
}

interface OptimisticLikeState {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  isAnimating: boolean;
}

export const useServerOptimisticLike = ({
  serverId,
  initialLiked,
  initialCount,
  fetchInitialLikedOnMount = true,
  onError,
}: UseServerOptimisticLikeProps) => {
  const [state, setState] = useState<OptimisticLikeState>({
    isLiked: initialLiked,
    likeCount: initialCount,
    isLoading: false,
    isAnimating: false,
  });

  const { isAuthenticated } = useAuth();
  const { user } = useGlobal();

  let likesContext: ReturnType<typeof useLikesContext> | null = null;
  try {
    likesContext = useLikesContext();
  } catch {
    likesContext = null;
  }

  const pendingOperationRef = useRef<Promise<unknown> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!isAuthenticated || !fetchInitialLikedOnMount) {
      return;
    }

    const fetchHasLiked = async () => {
      try {
        const res = await serverService.hasLikedServer(serverId);
        const liked = res?.liked ?? res?.data?.liked ?? false;
        setState((prev) => ({
          ...prev,
          isLiked: liked,
          likeCount: initialCount,
        }));
        likesContext?.updateLike({
          targetId: serverId,
          targetType: 'Server',
          isLiked: liked,
          likeCount: initialCount,
        });
      } catch {
        // ignore silently
      }
    };

    fetchHasLiked();
  }, [isAuthenticated, serverId, initialCount, likesContext, fetchInitialLikedOnMount]);

  useEffect(() => {
    if (!likesContext) return;
    const unsubscribe = likesContext.subscribeToLikeUpdates((update) => {
      if (update.targetId === serverId && update.targetType === 'Server') {
        setState((prev) => ({
          ...prev,
          isLiked: update.isLiked,
          likeCount: update.likeCount,
        }));
      }
    });
    return unsubscribe;
  }, [serverId, likesContext]);

  const toggleLike = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    const currentState = stateRef.current;
    const currentIsLiked = currentState.isLiked;
    const currentCount = currentState.likeCount;

    if (currentState.isLoading) {
      return;
    }

    const previousIsLiked = currentIsLiked;
    const previousCount = currentCount;
    const newIsLiked = !currentIsLiked;
    const newCount = currentIsLiked ? currentCount - 1 : currentCount + 1;

    setState({
      isLiked: newIsLiked,
      likeCount: newCount,
      isLoading: false,
      isAnimating: true,
    });

    likesContext?.updateLike({
      targetId: serverId,
      targetType: 'Server',
      isLiked: newIsLiked,
      likeCount: newCount,
    });

    const payload = { userDiscordID: user.discordId, serverId };
    const operation = previousIsLiked
      ? serverService.unlikeServer(payload)
      : serverService.likeServer(payload);

    pendingOperationRef.current = operation;

    try {
      await operation;
    } catch (error) {
      setState({
        isLiked: previousIsLiked,
        likeCount: previousCount,
        isLoading: false,
        isAnimating: true,
      });

      likesContext?.updateLike({
        targetId: serverId,
        targetType: 'Server',
        isLiked: previousIsLiked,
        likeCount: previousCount,
      });

      if (error instanceof Error) {
        onError?.(error);
      } else {
        onError?.(new Error('Failed to toggle like'));
      }
    } finally {
      pendingOperationRef.current = null;

      setTimeout(() => {
        setState((prev) => ({ ...prev, isAnimating: false }));
      }, 150);
    }
  }, [isAuthenticated, user, serverId, onError, likesContext]);

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


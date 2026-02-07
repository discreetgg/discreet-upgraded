'use client';

import type React from 'react';
import { createContext, useCallback, useContext, useRef } from 'react';

interface LikeUpdate {
  targetId: string;
  targetType: 'Post' | 'Comment' | 'Server';
  isLiked: boolean;
  likeCount: number;
}

interface LikesContextType {
  updateLike: (update: LikeUpdate) => void;
  subscribeToLikeUpdates: (
    callback: (update: LikeUpdate) => void
  ) => () => void;
}

const LikesContext = createContext<LikesContextType | null>(null);

export const useLikesContext = () => {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error('useLikesContext must be used within LikesProvider');
  }
  return context;
};

interface LikesProviderProps {
  children: React.ReactNode;
}

export const LikesProvider = ({ children }: LikesProviderProps) => {
  const listenersRef = useRef<Set<(update: LikeUpdate) => void>>(new Set());

  const updateLike = useCallback((update: LikeUpdate) => {
    // Notify all subscribers about the like update
    for (const callback of listenersRef.current) {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in like update listener:', error);
      }
    }
  }, []);

  const subscribeToLikeUpdates = useCallback(
    (callback: (update: LikeUpdate) => void) => {
      listenersRef.current.add(callback);

      // Return unsubscribe function
      return () => {
        listenersRef.current.delete(callback);
      };
    },
    []
  );

  const contextValue = {
    updateLike,
    subscribeToLikeUpdates,
  };

  return (
    <LikesContext.Provider value={contextValue}>
      {children}
    </LikesContext.Provider>
  );
};

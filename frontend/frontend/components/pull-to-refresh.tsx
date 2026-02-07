'use client';

import { cn } from '@/lib/utils';
import { useCallback, useRef, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

export const PullToRefresh = ({
  onRefresh,
  children,
  className,
  threshold = 80,
  refreshingText = 'Refreshing...',
  pullText = 'Pull down to refresh',
  releaseText = 'Release to refresh',
}: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const scrollElement = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollElement.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling || isRefreshing) {
        return;
      }

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);

      if (distance > 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    },
    [isPulling, isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) {
      return;
    }

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowRelease = pullDistance >= threshold;

  const getRefreshText = () => {
    if (isRefreshing) {
      return refreshingText;
    }
    if (shouldShowRelease) {
      return releaseText;
    }
    return pullText;
  };

  return (
    <div
      ref={scrollElement}
      className={cn('overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          'flex items-center justify-center transition-all duration-300 overflow-hidden',
          'text-sm text-[#8A8C95]'
        )}
        style={{
          height:
            isPulling || isRefreshing
              ? `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`
              : '0px',
        }}
      >
        <div className='flex items-center gap-2'>
          {isRefreshing ? (
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-[#FF007F]' />
          ) : (
            <div
              className='transform transition-transform duration-200'
              style={{
                transform: `rotate(${pullProgress * 180}deg)`,
              }}
            >
              ↓
            </div>
          )}
          <span>{getRefreshText()}</span>
        </div>
      </div>

      {children}
    </div>
  );
};

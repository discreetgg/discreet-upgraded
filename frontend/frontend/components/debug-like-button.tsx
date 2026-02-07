'use client';

import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { likePostService, unlikePostService } from '@/lib/services';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { AuthPromptDialog } from './auth-prompt-dialog';
import { Icon } from './ui/icons';

interface DebugLikeButtonProps {
  targetId: string;
  targetType: 'Post' | 'Comment';
  initialLiked?: boolean;
  initialCount: number;
  className?: string;
  setShowAllLikes: (show: boolean) => void;
}

export const DebugLikeButton = ({
  targetId,
  targetType,
  initialLiked = false,
  initialCount,
  className,
  setShowAllLikes,
}: DebugLikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);

  const { isAuthenticated } = useAuth();
  const { user } = useGlobal();

  const handleLike = () => {
    if (!isAuthenticated) {
      return;
    }

    if (!user) {
      return;
    }

    // Store current state for debugging
    const currentLiked = isLiked;
    const currentCount = likeCount;

    toast.info(
      `Debug: Current state - Liked: ${currentLiked}, Count: ${currentCount}`
    );

    // Instant UI update
    const newLiked = !currentLiked;
    const newCount = currentLiked ? currentCount - 1 : currentCount + 1;

    setIsLiked(newLiked);
    setLikeCount(newCount);

    toast.info(`Debug: New state - Liked: ${newLiked}, Count: ${newCount}`);

    // API call
    const payload = {
      discordID: user.discordId,
      targetId,
      targetType,
    };

    const apiCall = currentLiked ? unlikePostService : likePostService;
    const actionName = currentLiked ? 'unlike' : 'like';

    toast.info(`Debug: Making ${actionName} API call`);

    apiCall(payload)
      .then(() => {
        toast.success(`Debug: ${actionName} successful`);
      })
      .catch((error) => {
        toast.error(
          `Debug: ${actionName} failed - ${error.response?.status} - ${error.response?.data?.message}`
        );

        // Check if it's a conflict error
        if (error.response?.status === 409) {
          toast.warning('Debug: 409 Conflict - keeping optimistic state');
          return;
        }

        // Other errors - rollback
        toast.warning('Debug: Rolling back to original state');
        setIsLiked(currentLiked);
        setLikeCount(currentCount);
      });
  };

  const LikeButton = () => (
    <button
      type='button'
      className={cn('transition-colors duration-75', isLiked && 'text-red-500')}
      onClick={handleLike}
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      {isLiked ? <Icon.likeFilled /> : <Icon.like />}
    </button>
  );

  return (
    <div>
      {!isAuthenticated ? (
        <AuthPromptDialog>
          <div className={cn('flex items-center gap-2', className)}>
            <LikeButton />
            <button
              type='button'
              onClick={() => setShowAllLikes(true)}
              className='text-[15px] text-[#8A8C95] hover:text-[#D4D4D8]'
            >
              {likeCount}
            </button>
          </div>
        </AuthPromptDialog>
      ) : (
        <div className={cn('flex items-center gap-2', className)}>
          <LikeButton />
          <button
            type='button'
            onClick={() => setShowAllLikes(true)}
            className='text-[15px] text-[#8A8C95] hover:text-[#D4D4D8]'
          >
            {likeCount}
          </button>
          <div className='text-xs text-gray-500 ml-2'>
            State: {isLiked ? 'Liked' : 'Not Liked'}
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import { PROFILE_MENU_ADS } from '@/constants/mock-data';
import { useAuth } from '@/context/auth-context-provider';
import Image from 'next/image';
import { AuthPromptDialog } from '../auth-prompt-dialog';
import { PostCommentButton } from '../post-comment-button';
import { PostLikeButton } from '../post-like-button';
import { PostViewMore } from '../post-view-more';
import { Icon } from '../ui/icons';
import ProfileSideAdCard from './profile-side-ad-card';

interface Props {
  id: number;
  quotedId?: number;
  displayName: string;
  username: string;
  content: string;
  // description: string;
  // price: number;
  // tag: string;
  profileImage: string;
}

export default function ProfilePostCard({
  displayName,
  username,
  content,
  profileImage,
  quotedId,
}: Props) {
  const { isAuthenticated } = useAuth();
  const qoutedMenu = PROFILE_MENU_ADS.find((ad) => ad.id === quotedId);
  return (
    <article className='border-[#1E1E21] bg-background border shadow-[2px_2px_0_0_#1E1E21] hover:shadow-[4px_4px_0_0_#1E1E21] hover:bg-[#1E1E21]/10 transition-all duration-200 delay-75  p-4 rounded-[8px] space-y-4 relative cursor-pointer'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-x-2'>
          <Image
            src={profileImage}
            alt={''}
            width={48}
            height={48}
            className='w-12 h-12 rounded-full object-cover'
          />
          <div className='flex flex-col '>
            <p className='text-sm  font-inter'>{displayName}</p>
            <p className='text-xs text-accent-text/80 line-clamp-2'>
              @{username}•2 hours ago
            </p>
          </div>
        </div>
        <PostViewMore />
      </div>
      <div className='flex flex-col gap-y-4'>
        <p className='max-w-[489.72px] text-[15px] text-[#F8F8F8]'>{content}</p>
        {qoutedMenu && (
          <ProfileSideAdCard
            censored
            isPost
            key={qoutedMenu.id}
            {...qoutedMenu}
          />
        )}
      </div>

      <div className='flex items-center justify-between'>
        <div className='flex gap-[17px] items-center pointer-events-none'>
          <PostLikeButton
            targetId={'postId'}
            targetType='Post'
            initialCount={222}
            setShowAllLikes={() => {}}
          />
          <PostCommentButton
            setShowAddComment={() => {}}
            initialCount={33}
            setShowAllComments={() => {}}
          />
          {!isAuthenticated ? (
            <AuthPromptDialog>
              <div>
                <BookmarkButton />
              </div>
            </AuthPromptDialog>
          ) : (
            <BookmarkButton />
          )}
        </div>
        <div className='flex gap-4 items-center relative'>
          {!isAuthenticated ? (
            <AuthPromptDialog>
              <TipButton />
            </AuthPromptDialog>
          ) : (
            <TipButton />
          )}

          <div className='w-px bg-[#8A8C95] h-[18px]' />
          <button
            type='button'
            className='flex items-center gap-2 cursor-pointer'
          >
            <span className='text-sm text-[#FF007F] font-light'>Subscribe</span>
          </button>
        </div>
      </div>
    </article>
  );
}

const BookmarkButton = () => (
  <button type='button' className='flex items-center gap-2 cursor-pointer'>
    <Icon.bookmark />
  </button>
);

const TipButton = () => (
  <button type='button' className='flex items-center gap-2 cursor-pointer'>
    <Icon.tip />
    <span className='text-[15px] text-[#8A8C95]'>send tip</span>
  </button>
);

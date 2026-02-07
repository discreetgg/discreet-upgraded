import Image from 'next/image';
import type { UserType } from '@/types/global';
import { UserAvatar } from './user-avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRef, useState } from 'react';
import { useUser } from '@/hooks/queries/use-user';
import UserHoverCardSkeleton from './skeleton/user-hover-card-skeleton';
import FollowButton from './shared/follow-button';
import { useGlobal } from '@/context/global-context-provider';
import Link from 'next/link';
import { UserAvatarWithStatus } from './user-avatar-with-status';

interface TopCreatorsCardProps {
  creator?: UserType;
}

export const TopCreatorsCard = ({ creator }: TopCreatorsCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { data: user, isLoading } = useUser(creator?.username || '');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user: currentUser } = useGlobal();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 700);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsHovered(false);
  };

  const isLoggedInUser = currentUser?.discordId === creator?.discordId;

  return (
    <div className="relative">
      <div className="rounded-2xl w-[90%] mx-auto bg-[#1E1E21] h-[50px] absolute -translate-x-1/2 left-1/2 -bottom-2" />
      <div className="rounded-2xl border-4 border-[#0A0A0A] w-full relative bg-[#0A0A0A]">
        <div className="relative w-full h-auto aspect-[40/10] rounded-2xl overflow-hidden">
          <Image
            src={creator?.profileBanner?.url || '/post-image.png'}
            alt="Creator banner"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 700px"
          />
        </div>
        <div className="py-[15px] px-[18px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UserAvatarWithStatus
              profileImage={creator?.profileImage?.url}
              discordId={creator?.discordId || ''}
              discordAvatar={creator?.discordAvatar || ''}
              width={48}
              height={48}
              showOnlineStatus={false}
            />
            <div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <p className="text-[15px] font-bold">
                {creator?.displayName || 'Creator'}
              </p>
              <span className="text-[15px] text-accent-text font-light">
                @{creator?.username || 'username'}
              </span>
            </div>
          </div>

          <FollowButton
            discordId={user?.discordId || creator?.discordId || ''}
            username={user?.username || creator?.username || ''}
          />
        </div>
      </div>
      <Popover open={isHovered} onOpenChange={setIsHovered}>
        <PopoverTrigger
          asChild
          className="absolute opacity-0 !pointer-events-none left-1/2 -translate-x-1/2"
        >
          <span>hidden</span>
        </PopoverTrigger>
        <PopoverContent
          onMouseEnter={() => setIsHovered(true)}
          sideOffset={-20}
          align="center"
          className="min-h-56 max-h-[300px] w-[300px] bg-primary shadow-[0px_10px_30px_rgba(0,0,0,0.9)] flex flex-col  gap-3"
        >
          {isLoading ? (
            <UserHoverCardSkeleton />
          ) : (
            <>
              <div className="flex justify-between w-full">
                <div className="flex flex-col gap-1">
                  <UserAvatar
                    profileImage={user?.profileImage?.url}
                    discordId={user?.discordId ?? (creator?.discordId || '')}
                    discordAvatar={
                      user?.discordAvatar ?? (creator?.discordAvatar || '')
                    }
                    height={70}
                    width={70}
                  />
                  <Link
                    href={`/${user?.username || creator?.username}`}
                    className=""
                  >
                    <p className="text-lg font-bold leading-[100%] hover:underline">
                      {user?.displayName || creator?.displayName}
                    </p>

                    <span className="text-[15px] truncate leading-[100%] text-[#8A8C95] font-light">
                      @{user?.username || creator?.username}{' '}
                    </span>
                  </Link>
                </div>
                {!isLoggedInUser && (user?.discordId || creator?.discordId) && (
                  <FollowButton
                    discordId={user?.discordId || creator?.discordId || ''}
                    username={user?.username || creator?.username || ''}
                  />
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-accent-text">
                  <b className="mr-1">
                    {user?.followingCount ?? creator?.followingCount ?? 0}
                  </b>
                  Following
                </p>
                <p className="text-accent-text">
                  <b className="mr-1">
                    {user?.followerCount ?? creator?.followerCount ?? 0}
                  </b>
                  Followers
                </p>
              </div>
              {(user?.bio || creator?.bio) && (
                <p className="text-accent-text text-sm">
                  {user?.bio || creator?.bio}
                </p>
              )}
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

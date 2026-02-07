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
import Link from 'next/link';
import { UserAvatarWithStatus } from './user-avatar-with-status';

interface TopCreatorsCardProps {
  creator?: UserType;
}

export const TopCreatorsCard = ({ creator }: TopCreatorsCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { data: user, isLoading } = useUser(creator?.username || '', {
    enabled: isHovered,
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const cardContent = (
    <div className="group relative w-full overflow-hidden rounded-2xl border border-[#2A2E37] bg-[#0A0A0A]">
      <div className="relative h-auto w-full aspect-[3/1] overflow-hidden">
        <Image
          src={creator?.profileBanner?.url || '/post-image.png'}
          alt="Creator banner"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 700px"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-black/35" />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4">
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex items-end gap-3"
        >
          <div className="relative shrink-0">
            <div className="overflow-hidden rounded-full border-2 border-white/90 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              <UserAvatarWithStatus
                profileImage={creator?.profileImage?.url}
                discordId={creator?.discordId || ''}
                discordAvatar={creator?.discordAvatar || ''}
                width={64}
                height={64}
                showOnlineStatus={false}
                className="!h-[56px] !w-[56px] md:!h-[68px] md:!w-[68px]"
              />
            </div>
          </div>
          <div className="min-w-0 pb-0.5">
            <p className="truncate text-[16px] md:text-[20px] font-semibold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
              {creator?.displayName || 'Creator'}
            </p>
            <span className="block truncate text-[13px] md:text-[15px] font-medium leading-tight text-white/85">
              @{creator?.username || 'username'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {creator?.username ? (
        <Link
          href={`/${creator.username}`}
          aria-label={`View ${creator.displayName || creator.username} profile`}
          className="block cursor-pointer"
        >
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
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

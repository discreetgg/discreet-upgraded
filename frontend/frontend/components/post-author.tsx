import { cn, formatTwitterDate } from '@/lib/utils';
import type { AuthorType, UserType } from '@/types/global';
import Link from 'next/link';
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
import { AuthPromptDialog } from './auth-prompt-dialog';
import { UserAvatarWithStatus } from './user-avatar-with-status';

export const PostAuthor = ({
  author,
  date,
  className,
  showUserName = true,
  avatarClassName,
  usernameClassName,
  isAuthenticated,
  isPreview,
}: {
  author: AuthorType | null;
  date?: string;
  className?: string;
  avatarClassName?: string;
  usernameClassName?: string;
  showUserName?: boolean;
  isAuthenticated?: boolean;
  isPreview?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { data: user, isLoading } = useUser(author?.username ?? '');
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

  const isLoggedInUser = currentUser?.discordId === author?.discordId;

  const ShowFollowButton = isAuthenticated ? FollowButton : AuthPromptDialog;

  return (
    <div
      className="relative w-fit"
      onMouseEnter={isPreview ? undefined : handleMouseEnter}
      onMouseLeave={isPreview ? undefined : handleMouseLeave}
    >
      {isPreview ? (
        <div className={cn('flex items-center gap-4  ', className)}>
          <UserAvatarWithStatus
            profileImage={author?.profileImage?.url ?? ''}
            discordId={author?.discordId ?? ''}
            discordAvatar={author?.discordAvatar ?? ''}
            className={cn('', avatarClassName)}
          />
          <div className={cn('', usernameClassName)}>
            <p className="text-[15px] font-bold leading-[100%] hover:underline">
              {author?.displayName}
            </p>
            <div className="flex items-center gap-1">
              {showUserName && (
                <>
                  <span className="text-[15px] leading-[100%] text-[#8A8C95] font-light">
                    @{author?.username}{' '}
                  </span>
                  <div className="rounded-full bg-[#8A8C95] size-1" />
                </>
              )}
              {date && (
                <span className="text-[15px] text-[#8A8C95] font-light">
                  {formatTwitterDate(date)}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Link
          href={`/${author?.username}`}
          className={cn('flex items-center gap-4  ', className)}
        >
          <UserAvatarWithStatus
            profileImage={author?.profileImage?.url}
            discordId={author?.discordId ?? ''}
            discordAvatar={author?.discordAvatar ?? ''}
            className={cn('', avatarClassName)}
          />
          <div className={cn('', usernameClassName)}>
            <p className="text-[15px] font-bold leading-[100%] hover:underline">
              {author?.displayName}
            </p>
            <div className="flex items-center gap-1">
              {showUserName && (
                <>
                  <span className="text-[15px] leading-[100%] text-[#8A8C95] font-light">
                    @{author?.username}{' '}
                  </span>
                  <div className="rounded-full bg-[#8A8C95] size-1" />
                </>
              )}
              {date && (
                <span className="text-[15px] text-[#8A8C95] font-light">
                  {formatTwitterDate(date)}
                </span>
              )}
            </div>
          </div>
        </Link>
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
                    profileImage={
                      user?.profileImage?.url ?? author?.profileImage?.url
                    }
                    discordId={user?.discordId ?? author?.discordId ?? ''}
                    discordAvatar={
                      user?.discordAvatar ?? author?.discordAvatar ?? ''
                    }
                    height={70}
                    width={70}
                  />
                  <Link href={`/${user?.username}`} className="">
                    <p className="text-lg font-bold leading-[100%] hover:underline">
                      {user?.displayName}
                    </p>

                    {showUserName && (
                      <span className="text-[15px] truncate leading-[100%] text-[#8A8C95] font-light">
                        @{user?.username}{' '}
                      </span>
                    )}
                  </Link>
                </div>
                {!isLoggedInUser && user?.discordId && (
                  <ShowFollowButton
                    discordId={user.discordId}
                    username={user.username}
                  />
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-accent-text">
                  <b className="mr-1">{user?.followingCount ?? 0}</b>
                  {/* {user?.role === "buyer" ? "Following" : "Subscribers"} */}
                  Following
                </p>
                <p className="text-accent-text">
                  <b className="mr-1">{user?.followerCount ?? 0}</b>Followers
                </p>
              </div>
              {user?.bio && (
                <p className="text-accent-text text-sm">{user.bio}</p>
              )}
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

'use client';

import { useSocket } from '@/context/socket-context';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Icon } from './ui/icons';

interface Props {
  profileImage?: string;
  discordId: string;
  discordAvatar: string;
  className?: string;
  width?: number;
  height?: number;
  showOnlineStatus?: boolean;
  onlineStatusClassname?: string;
}

export const UserAvatarWithStatus = ({
  profileImage,
  discordId,
  discordAvatar,
  className,
  width,
  height,
  showOnlineStatus = true,
  onlineStatusClassname,
}: Props) => {
  const { isUserOnline } = useSocket();
  const isOnline = isUserOnline(discordId);

  return (
    <div className="relative isolate w-max">
      <Avatar
        color="#1E1E21"
        className={cn(
          'relative group md:w-[48px] w-[32px] md:h-[48px] h-[32px]',
          className
        )}
      >
        <AvatarImage
          src={
            profileImage ??
            `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png`
          }
        />
        <AvatarFallback>
          <Image
            src="/user.svg"
            height={height ?? 48}
            width={width ?? 48}
            className="rounded-full"
            alt=""
          />
        </AvatarFallback>
      </Avatar>

      {showOnlineStatus && (
        <>
          {isOnline ? (
            <Icon.onlineIndicator
              className={cn(
                'absolute z-20 right-1 bottom-0',
                onlineStatusClassname
              )}
            />
          ) : (
            <Icon.offlineIndicator
              className={cn(
                'absolute z-20 right-1 bottom-0',
                onlineStatusClassname
              )}
            />
          )}
        </>
      )}
    </div>
  );
};

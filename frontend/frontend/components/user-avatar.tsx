'use client';

import { cn, getUserDiscordAvatar } from '@/lib/utils';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface Props {
  profileImage?: string;
  discordId: string;
  discordAvatar: string;
  className?: string;
  width?: number;
  height?: number;
}

export const UserAvatar = ({
  profileImage,
  discordId,
  discordAvatar,
  className,
  width,
  height,
}: Props) => {
  const avatarSrc =
    profileImage ??
    getUserDiscordAvatar({
      discordId,
      discordAvatar,
    });

  return (
    <div className="relative isolate">
      <Avatar
        color="#1E1E21"
        className={cn(' relative group', className)}
        style={{
          width: width ?? 48,
          height: height ?? 48,
        }}
      >
        <AvatarImage src={avatarSrc} />
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
    </div>
  );
};

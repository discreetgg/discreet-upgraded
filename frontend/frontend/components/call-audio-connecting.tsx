'use client';

import Image from 'next/image';
import { UserAvatar } from './user-avatar';
import { Icon } from './ui/icons';
import { useCall } from '@/context/call-context';
import { AuthorType } from '@/types/global';
import { cn } from '@/lib/utils';
import { useGlobal } from '@/context/global-context-provider';

export const CallAudioConnecting = ({
  remoteUser,
}: {
  remoteUser: AuthorType;
}) => {
  const { currentCallType, muted, toggleMute, endCall } = useCall();
  const { user } = useGlobal();

  return (
    <div
      className={cn(
        'h-[239px] relative w-full overflow-hidden',
        currentCallType === 'video' && 'hidden',
      )}
    >
      <div className="inset-0 absolute h-full w-full">
        <div className="absolute inset-0 bg-black opacity-75" />
        <Image
          src={
            remoteUser?.profileImage?.url ||
            `https://cdn.discordapp.com/avatars/${remoteUser?.discordId}/${remoteUser?.discordAvatar}.png`
          }
          height={605}
          width={605}
          alt="Background Image"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative">
        <div className="flex justify-center items-center mx-auto my-4 gap-2">
          {/* Display current user's profile (left side) */}
          <UserAvatar
            profileImage={user?.profileImage?.url}
            discordId={user?.discordId || ''}
            discordAvatar={user?.discordAvatar || ''}
            width={73.107}
            height={73.107}
            className="my-4 border-3 border-[#0F1114]"
          />
          {/* Display remote user's profile (right side, pulsing while connecting) */}
          <UserAvatar
            profileImage={remoteUser?.profileImage?.url}
            discordId={remoteUser?.discordId || ''}
            discordAvatar={remoteUser?.discordAvatar || ''}
            width={73.107}
            height={73.107}
            className={cn(
              'border-3 border-[#0F1114]',
              'opacity-30 animate-pulse',
            )}
          />
        </div>
        <p className="text-[11.25px] text-[#8A8C95] text-center font-medium">
          {currentCallType === 'video' ? 'Video' : 'Audio'} calling...
        </p>
        <div className="flex items-center gap-2 justify-center mt-[30px]">
          <button
            type="button"
            className={cn(
              'rounded-[6px] bg-[#0F1114] p-2.5',
              muted && 'bg-[#F0443842]',
            )}
            onClick={toggleMute}
          >
            {muted ? (
              <Icon.microphoneOff className="size-[17.859px]" />
            ) : (
              <Icon.microphone className="size-[17.859px]" />
            )}
          </button>
          <button
            type="button"
            className="rounded-[6px] bg-[#F04438] px-4 py-2.5"
            onClick={endCall}
          >
            <Icon.pickCall className="size-[17.859px]" />
          </button>
        </div>
      </div>
    </div>
  );
};

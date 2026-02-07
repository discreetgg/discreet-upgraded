'use client';

import Image from 'next/image';
import { useState } from 'react';
import { UserAvatar } from './user-avatar';
import { Icon } from './ui/icons';
import { useCall } from '@/context/call-context';
import { AuthorType } from '@/types/global';
import { cn } from '@/lib/utils';

export const CallAudioRinging = ({ caller }: { caller: AuthorType }) => {
  const { incomingCall, currentCallType, acceptCall, rejectCall, connecting } =
    useCall();
  const [isAccepting, setIsAccepting] = useState(false);

  const isDisabled = connecting || isAccepting;

  const handleAccept = () => {
    if (isDisabled) return;
    setIsAccepting(true);
    acceptCall();
  };

  const handleReject = () => {
    if (isDisabled) return;
    rejectCall();
  };

  return (
    <div className="h-[205px] relative w-full overflow-hidden">
      <div className="inset-0 absolute h-full w-full">
        <div className="absolute inset-0 bg-black opacity-75" />
        <Image
          src={
            caller?.profileImage?.url ||
            `https://cdn.discordapp.com/avatars/${caller?.discordId}/${caller?.discordAvatar}.png`
          }
          height={605}
          width={605}
          alt="Background Image"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative">
        {/* Display the person who is calling you */}
        <UserAvatar
          profileImage={caller?.profileImage?.url || undefined}
          discordId={caller?.discordId || ''}
          discordAvatar={caller?.discordAvatar || ''}
          width={73.107}
          height={73.107}
          className="mx-auto my-4"
        />
        <p className="text-[11.25px] text-[#8A8C95] text-center font-medium">
          Incoming{' '}
          {currentCallType === 'video' || incomingCall?.callType === 'video'
            ? 'Video'
            : 'Audio'}{' '}
          call...
        </p>
        <div className="flex items-center gap-2 justify-center mt-[30px]">
          <button
            type="button"
            className={cn(
              'rounded-[6px] bg-[#12B76A] px-4 py-2.5 transition-all duration-200',
              isDisabled && 'opacity-70 cursor-not-allowed',
            )}
            onClick={handleAccept}
            disabled={isDisabled}
          >
            {isDisabled ? (
              <div className="size-[17.859px] border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon.pickCall className="size-[17.859px]" />
            )}
          </button>
          <button
            type="button"
            className={cn(
              'rounded-[6px] bg-[#F04438] px-4 py-2.5 transition-all duration-200',
              isDisabled && 'opacity-70 cursor-not-allowed',
            )}
            onClick={handleReject}
            disabled={isDisabled}
          >
            <Icon.cancelCall className="size-[17.859px]" />
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { UserAvatar } from './user-avatar';
import { Icon } from './ui/icons';
import { useCall } from '@/context/call-context';
import { AuthorType } from '@/types/global';
import { cn } from '@/lib/utils';

export const CallVideoRinging = ({ caller }: { caller: AuthorType }) => {
  const { acceptCall, rejectCall, connecting } = useCall();
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
    <div className="relative w-full h-full md:w-[915px] md:h-[350px] mx-auto overflow-hidden flex flex-col">
      {/* Background image - blurred caller profile */}
      <div className="absolute inset-0 h-full w-full">
        <div className="absolute inset-0 bg-black opacity-75 z-10" />
        <Image
          src={
            caller?.profileImage?.url ||
            `https://cdn.discordapp.com/avatars/${caller?.discordId}/${caller?.discordAvatar}.png`
          }
          fill
          alt="Background Image"
          className="object-cover blur-sm"
        />
      </div>

      {/* Content - centered */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6">
        {/* Display the person who is calling you */}
        <UserAvatar
          profileImage={caller?.profileImage?.url || undefined}
          discordId={caller?.discordId || ''}
          discordAvatar={caller?.discordAvatar || ''}
          width={100}
          height={100}
          className="mb-6"
        />
        <p className="text-base text-white text-center font-medium mb-2">
          {caller?.displayName || 'Unknown User'}
        </p>
        <p className="text-sm text-[#8A8C95] text-center font-medium">
          Incoming Video call...
        </p>
      </div>

      {/* Call controls - fixed at bottom */}
      <div className="relative z-20 bg-[#0A0A0B]/90 border-t border-[#1E2227] px-6 py-6">
        <div className="flex items-center gap-4 justify-center">
          <button
            type="button"
            className={cn(
              'rounded-full bg-[#F04438] p-6 hover:bg-[#E03830] transition-all duration-200 active:scale-95',
              isDisabled && 'opacity-70 cursor-not-allowed',
            )}
            onClick={handleReject}
            disabled={isDisabled}
          >
            <Icon.cancelCall className="size-6" />
          </button>
          <button
            type="button"
            className={cn(
              'rounded-full bg-[#12B76A] p-6 hover:bg-[#10A35F] transition-all duration-200 active:scale-95',
              isDisabled && 'opacity-70 cursor-not-allowed',
            )}
            onClick={handleAccept}
            disabled={isDisabled}
          >
            {isDisabled ? (
              <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon.pickCall className="size-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import Image from 'next/image';
import { UserAvatar } from './user-avatar';
import { Icon } from './ui/icons';
import { useCall } from '@/context/call-context';
import { AuthorType } from '@/types/global';
import { cn, formatCallTime } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { useGlobal } from '@/context/global-context-provider';

export const CallAudioConnected = ({
  remoteUser,
}: {
  remoteUser: AuthorType;
}) => {
  const {
    currentCallType,
    muted,
    toggleMute,
    endCall,
    connected,
    localStream,
    remoteStream,
    callDuration, // Use global call duration from context
  } = useCall();
  const { user } = useGlobal();

  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);

  // Audio context refs for audio level monitoring
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);

  // Call duration is now tracked globally in context - no local timer needed

  // Monitor audio levels for speaking indicators using Web Audio API
  useEffect(() => {
    if (!localStream && !remoteStream) return;

    // Create audio context if needed
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const audioContext = audioContextRef.current;

    // Set up local stream analyser
    if (localStream && !localAnalyserRef.current) {
      const localSource = audioContext.createMediaStreamSource(localStream);
      localAnalyserRef.current = audioContext.createAnalyser();
      localAnalyserRef.current.fftSize = 256;
      localSource.connect(localAnalyserRef.current);
    }

    // Set up remote stream analyser
    if (remoteStream && !remoteAnalyserRef.current) {
      const remoteSource = audioContext.createMediaStreamSource(remoteStream);
      remoteAnalyserRef.current = audioContext.createAnalyser();
      remoteAnalyserRef.current.fftSize = 256;
      remoteSource.connect(remoteAnalyserRef.current);
    }

    const checkAudioLevels = setInterval(() => {
      // Get local audio level
      if (localAnalyserRef.current) {
        const dataArray = new Uint8Array(
          localAnalyserRef.current.frequencyBinCount,
        );
        localAnalyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = average / 255;
        const mappedLocalLevel =
          normalizedLevel > 0.05 ? Math.min(normalizedLevel * 10, 8) : 0;
        setLocalAudioLevel(mappedLocalLevel);
      }

      // Get remote audio level
      if (remoteAnalyserRef.current) {
        const dataArray = new Uint8Array(
          remoteAnalyserRef.current.frequencyBinCount,
        );
        remoteAnalyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = average / 255;
        const mappedRemoteLevel =
          normalizedLevel > 0.05 ? Math.min(normalizedLevel * 10, 8) : 0;
        setRemoteAudioLevel(mappedRemoteLevel);
      }
    }, 100);

    return () => {
      clearInterval(checkAudioLevels);
    };
  }, [localStream, remoteStream]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      localAnalyserRef.current = null;
      remoteAnalyserRef.current = null;
    };
  }, []);

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
          {/* Display current user's profile (left side) with dynamic speaking indicator */}
          <div
            className="transition-all duration-150 rounded-full"
            style={{
              boxShadow:
                localAudioLevel > 0
                  ? `0 0 0 ${localAudioLevel}px rgba(255, 0, 127, 0.6)`
                  : 'none',
            }}
          >
            <UserAvatar
              profileImage={user?.profileImage?.url}
              discordId={user?.discordId || ''}
              discordAvatar={user?.discordAvatar || ''}
              width={73.107}
              height={73.107}
              className="my-4"
            />
          </div>
          {/* Display remote user's profile (right side) with dynamic speaking indicator */}
          <div
            className="transition-all duration-150 rounded-full"
            style={{
              boxShadow:
                remoteAudioLevel > 0
                  ? `0 0 0 ${remoteAudioLevel}px rgba(255, 0, 127, 0.6)`
                  : 'none',
            }}
          >
            <UserAvatar
              profileImage={remoteUser?.profileImage?.url}
              discordId={remoteUser?.discordId || ''}
              discordAvatar={remoteUser?.discordAvatar || ''}
              width={73.107}
              height={73.107}
            />
          </div>
        </div>
        <p className="text-[11.25px] text-center font-medium">
          {formatCallTime(callDuration)}
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
              <Icon.microphoneOn className="size-[17.859px]" />
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

'use client';

import { Icon } from './ui/icons';
import { useCall } from '@/context/call-context';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

export const CallVideoConnecting = ({
  isFullScreen,
  setIsFullScreen,
}: {
  isFullScreen: boolean;
  setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {
    muted,
    toggleMute,
    mutedVideo,
    toggleVideo,
    endCall,
    localStream,
    remoteStream,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Set up video streams from context
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div
      className={cn(
        'relative w-full h-full md:w-[515px] md:h-[350px] mx-auto overflow-hidden flex flex-col',
        isFullScreen && 'md:w-full md:h-full',
      )}
    >
      {/* Video streams - stacked vertically, full width and height */}
      <div className="flex-1 flex md:flex-row flex-col">
        {/* Remote video stream (other person's camera) - TOP - 50% height */}
        <div className="bg-[#1D0E0D] relative overflow-hidden h-1/2 md:h-full w-full">
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover -scale-x-100"
            autoPlay
            playsInline
          >
            <track kind="captions" srcLang="en" label="English captions" />
          </video>
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-[#8A8C95] text-sm">
              Connecting...
            </div>
          )}
        </div>
        {/* Local video stream (current user's camera) - BOTTOM - 50% height */}
        <div className="bg-[#3C3C42] relative overflow-hidden h-1/2 md:h-full w-full">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover -scale-x-100"
            autoPlay
            playsInline
            muted
          >
            <track kind="captions" srcLang="en" label="English captions" />
          </video>
          {!localStream && (
            <div className="absolute inset-0 flex items-center justify-center text-[#8A8C95] text-sm">
              Your Camera
            </div>
          )}
        </div>
      </div>
      {/* Call controls - fixed at bottom */}
      <div className="bg-[#0A0A0B] border-t border-[#1E2227] px-6 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <p className="text-sm text-[#8A8C95] font-medium">Connecting...</p>
          <div className="flex items-center gap-3">
            {/* Microphone toggle */}
            <button
              type="button"
              className={cn(
                'rounded-lg bg-[#0F1114] p-3 hover:bg-[#1F2125] transition-colors',
                muted && 'bg-[#F0443842]',
              )}
              onClick={toggleMute}
            >
              {muted ? (
                <Icon.microphoneOff className="size-5" />
              ) : (
                <Icon.microphone className="size-5" />
              )}
            </button>
            {/* Video toggle */}
            <button
              type="button"
              className={cn(
                'rounded-lg bg-[#0F1114] p-3 hover:bg-[#1F2125] transition-colors',
                mutedVideo && 'bg-[#F0443842]',
              )}
              onClick={toggleVideo}
            >
              {mutedVideo ? (
                <Icon.videoOffIcon className="size-5" />
              ) : (
                <Icon.videoOnIcon className="size-5" />
              )}
            </button>
            {/* End call */}
            <button
              type="button"
              className="rounded-lg bg-[#F04438] px-6 py-3 hover:bg-[#E03830] transition-colors"
              onClick={endCall}
            >
              <Icon.cancelCall className="size-5" />
            </button>
          </div>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            type="button"
            className="hover:opacity-70 transition-opacity md:block hidden"
          >
            <Icon.fullScreen className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import { useCall } from '@/context/call-context';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Icon } from './ui/icons';
import { cn } from '@/lib/utils';

export const CallVideoConnected = ({
  isFullScreen,
  setIsFullScreen,
  isPiPMode,
  setIsPiPMode,
}: {
  isFullScreen: boolean;
  setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
  isPiPMode: boolean;
  setIsPiPMode: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {
    muted,
    toggleMute,
    mutedVideo,
    toggleVideo,
    endCall,
    connected,
    localStream,
    remoteStream,
    isRemoteMuted,
    callDuration, // Use global call duration from context
    attachStreamToVideo,
  } = useCall();

  const [isLocalUserSpeaking, setIsLocalUserSpeaking] = useState(false);
  const [isRemoteUserSpeaking, setIsRemoteUserSpeaking] = useState(false);
  const [pipPosition, setPipPosition] = useState({ x: 16, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const pipRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Audio context refs for audio level monitoring
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);

  // Handle drag start for PiP mode
  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      setIsDragging(true);
      dragStartRef.current = {
        x: clientX,
        y: clientY,
        startX: pipPosition.x,
        startY: pipPosition.y,
      };
    },
    [pipPosition],
  );

  // Handle drag move for PiP mode
  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;

      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      const newX = dragStartRef.current.startX + deltaX;
      const newY = dragStartRef.current.startY + deltaY;

      // Constrain within viewport
      const maxX = window.innerWidth - 160; // PiP width
      const maxY = window.innerHeight - 120; // PiP height

      setPipPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging],
  );

  // Handle drag end for PiP mode
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
    },
    [handleDragStart],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    },
    [handleDragMove],
  );

  // Mouse event handlers (for testing on desktop)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientX, e.clientY);
    },
    [handleDragStart],
  );

  // Global mouse/touch move and end handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };

    const handleGlobalEnd = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalTouchMove);
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Handle tap on PiP to restore full screen
  const handlePiPTap = useCallback(() => {
    if (!isDragging) {
      setIsPiPMode(false);
    }
  }, [isDragging]);

  // Toggle PiP mode on mobile
  const togglePiPMode = useCallback(() => {
    setIsPiPMode(!isPiPMode);
  }, [isPiPMode]);

  // Call duration is now tracked globally in context - no local timer needed

  // Set up video streams - use both local refs and global attachment for reliability
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    // Also attach to global video elements
    attachStreamToVideo('global_local_video', localStream);
  }, [localStream, attachStreamToVideo]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    // Also attach to global video elements
    attachStreamToVideo('global_remote_video', remoteStream);
  }, [remoteStream, attachStreamToVideo]);

  // Monitor audio levels to detect when users are speaking using Web Audio API
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
        setIsLocalUserSpeaking(normalizedLevel > 0.1);
      }

      // Get remote audio level
      if (remoteAnalyserRef.current) {
        const dataArray = new Uint8Array(
          remoteAnalyserRef.current.frequencyBinCount,
        );
        remoteAnalyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = average / 255;
        setIsRemoteUserSpeaking(normalizedLevel > 0.1);
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

  // Format call duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // PiP mode floating preview (mobile only)
  if (isPiPMode) {
    return (
      <div
        ref={pipRef}
        className="fixed z-[9999] md:hidden"
        style={{
          left: pipPosition.x,
          top: pipPosition.y,
          touchAction: 'none',
        }}
      >
        {/* Draggable PiP container */}
        <div
          className="w-44 h-32 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#2E2E32] bg-[#0A0A0B]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleMouseDown}
        >
          {/* Both videos in PiP */}
          <div className="relative w-full h-full flex">
            {/* Remote video - takes most of the space */}
            <div className="flex-1 h-full relative">
              <video
                ref={remoteVideoRef}
                className="w-full h-full object-cover -scale-x-100"
                autoPlay
                playsInline
              >
                <track kind="captions" srcLang="en" label="English captions" />
              </video>
            </div>

            {/* Local video - small overlay in corner */}
            <div className="absolute bottom-1 right-1 w-12 h-16 rounded-md overflow-hidden border border-[#2E2E32]">
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover -scale-x-100"
                autoPlay
                playsInline
                muted
              >
                <track kind="captions" srcLang="en" label="English captions" />
              </video>
            </div>

            {/* Call duration badge */}
            <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-0.5">
              <p className="text-xs text-white font-medium">
                {formatDuration(callDuration)}
              </p>
            </div>

            {/* Tap to expand overlay */}
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center bg-black/20 active:bg-black/40 transition-colors"
              onClick={handlePiPTap}
            >
              <div className="bg-black/50 rounded-full p-2">
                <Icon.fullScreen className="size-4 text-white" />
              </div>
            </button>

            {/* End call button in PiP */}
            <button
              type="button"
              className="absolute bottom-2 left-2 rounded-full bg-[#F04438] p-1.5 hover:bg-[#E03830] transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                endCall();
              }}
            >
              <Icon.cancelCall className="size-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div
          className={`bg-[#1D0E0D] relative overflow-hidden h-1/2 md:h-full w-full transition-all duration-200 ${
            isRemoteUserSpeaking ? 'ring-4 ring-purple-500' : ''
          }`}
        >
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover -scale-x-100"
            autoPlay
            playsInline
          >
            <track kind="captions" srcLang="en" label="English captions" />
          </video>
          <div className="rounded-lg bg-[#2E2E3270] z-50 absolute bottom-4 right-4 p-2">
            {!isRemoteMuted ? (
              <Icon.microphone className="size-5" />
            ) : (
              <Icon.microphoneOff className="size-5" />
            )}
          </div>
        </div>

        {/* Local video stream (current user's camera) - BOTTOM - 50% height */}
        <div
          className={`bg-[#3C3C42] relative overflow-hidden h-1/2 md:h-full w-full transition-all duration-200 ${
            isLocalUserSpeaking ? 'ring-4 ring-purple-500' : ''
          }`}
        >
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover -scale-x-100"
            autoPlay
            playsInline
            muted
          >
            <track kind="captions" srcLang="en" label="English captions" />
          </video>
          <div className="rounded-lg bg-[#2E2E3270] z-50 absolute bottom-4 right-4 p-2">
            {muted ? (
              <Icon.microphoneOff className="size-5" />
            ) : (
              <Icon.microphone className="size-5" />
            )}
          </div>
        </div>
      </div>

      {/* Call controls - fixed at bottom */}
      <div className="bg-[#0A0A0B] border-t border-[#1E2227] px-6 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <p className="text-sm text-[#8A8C95] font-medium">
            {formatDuration(callDuration)}
          </p>

          <div className="flex items-center gap-3">
            {/* Microphone toggle */}
            <button
              type="button"
              className={`rounded-lg bg-[#0F1114] p-3 hover:bg-[#1F2125] transition-colors ${
                muted ? 'bg-[#F0443842]' : ''
              }`}
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
              className={`rounded-lg bg-[#0F1114] p-3 hover:bg-[#1F2125] transition-colors ${
                mutedVideo ? 'bg-[#F0443842]' : ''
              }`}
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
          <button
            onClick={togglePiPMode}
            type="button"
            className="hover:opacity-70 transition-opacity md:hidden"
          >
            <Icon.newPage className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

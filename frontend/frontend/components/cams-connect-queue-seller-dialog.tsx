'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { UserType } from '@/types/global';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMessage } from '@/context/message-context';
import { useCall } from '@/context/call-context';
import { getConversationBetweenUsersService } from '@/lib/services';
import { useGlobal } from '@/context/global-context-provider';
import { Icon } from './ui/icons';
import { UserAvatar } from './user-avatar';

const CONFIRMATION_TIMEOUT = 1150; // 50 seconds to confirm (same as buyer)

export const CamsConnectQueueSellerDialog = ({
  open,
  onOpenChange,
  onConfirm,
  user,
  isLoadingUser = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  user: UserType | null; // The buyer/caller
  isLoadingUser?: boolean;
}) => {
  const router = useRouter();
  const { user: currentUser } = useGlobal();
  const { setReceiver, setConversationId } = useMessage();
  const {
    ringing,
    connected,
    connecting,
    callState,
    muted,
    toggleMute,
    mutedVideo,
    toggleVideo,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall,
    setIsCamsPreview,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [countdown, setCountdown] = useState(CONFIRMATION_TIMEOUT);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wasCallActiveRef = useRef(false);
  // Track if user confirmed the call (so we don't end it when dialog closes)
  const hasConfirmedCallRef = useRef(false);

  // Set cams preview mode to suppress the global Call component UI
  useEffect(() => {
    setIsCamsPreview(open);
    return () => setIsCamsPreview(false);
  }, [open, setIsCamsPreview]);

  // Set up video streams from context
  useEffect(() => {
    if (!open) return;

    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [open, localStream, remoteStream]);

  // Track when the call becomes active
  useEffect(() => {
    if (callState !== 'idle') {
      wasCallActiveRef.current = true;
    }
  }, [callState]);

  // Close dialog when call disconnects (only if call was previously active)
  useEffect(() => {
    if (open && wasCallActiveRef.current && callState === 'idle') {
      wasCallActiveRef.current = false;
      onOpenChange(false);
    }
  }, [open, callState, onOpenChange]);

  // Clean up call when dialog closes WITHOUT user confirming
  useEffect(() => {
    if (!open && hasAccepted && !hasConfirmedCallRef.current) {
      console.log(
        '[CamsQueueSeller] Dialog closed without confirm - ending call',
      );
      endCall();
    }
  }, [open, hasAccepted, endCall]);

  // Countdown timer - only starts when connected (after accepting)
  useEffect(() => {
    if (!open || !connected) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleDisconnect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, connected]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCountdown(CONFIRMATION_TIMEOUT);
      setHasAccepted(false);
      setIsAccepting(false);
      setError(null);
      wasCallActiveRef.current = false;
      hasConfirmedCallRef.current = false;
    }
  }, [open]);

  // Accept the incoming call - actually calls acceptCall from context
  const handleAcceptCall = useCallback(async () => {
    if (isAccepting) return;

    setIsAccepting(true);
    try {
      console.log('[CamsQueueSeller] Accepting incoming call...');
      await acceptCall();
      setHasAccepted(true);
      console.log('[CamsQueueSeller] Call accepted');
    } catch (err) {
      console.error('[CamsQueueSeller] Failed to accept call:', err);
      setError('Failed to accept call. Please try again.');
      setIsAccepting(false);
    }
  }, [acceptCall, isAccepting]);

  const handleDisconnect = useCallback(() => {
    // End the WebRTC call properly
    endCall();
    onOpenChange(false);
  }, [endCall, onOpenChange]);

  const handleConfirmAndStartCall = useCallback(async () => {
    if (!user?.discordId || !currentUser?.discordId) return;

    // Mark that user confirmed - so we don't end the call when dialog closes
    hasConfirmedCallRef.current = true;

    // Close this preview dialog and navigate to messages page
    try {
      const conversation = await getConversationBetweenUsersService([
        currentUser.discordId,
        user.discordId,
      ]);

      setReceiver(user);
      setConversationId(conversation._id);

      // Notify parent that user confirmed (so regular call UI can show)
      onConfirm?.();
      onOpenChange(false);
      router.push(`/messages?chat=${conversation._id}`);
    } catch (error) {
      console.error('[CamsQueueSeller] Failed to navigate:', error);
      setError('Failed to start call. Please try again.');
      // Reset confirmed flag on error so cleanup can happen
      hasConfirmedCallRef.current = false;
    }
  }, [
    currentUser?.discordId,
    user,
    setReceiver,
    setConversationId,
    onOpenChange,
    onConfirm,
    router,
  ]);

  const handleMicToggle = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  const handleVideoToggle = useCallback(() => {
    toggleVideo();
  }, [toggleVideo]);

  const togglePiPMode = useCallback(() => {
    // Toggle picture-in-picture mode (for mobile)
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else if (localVideoRef.current) {
      localVideoRef.current.requestPictureInPicture?.();
    }
  }, []);

  // Format countdown display
  const formatCountdown = (seconds: number) => {
    return `${seconds}`;
  };

  // Determine current state
  const isWaitingToAccept = ringing && !hasAccepted;
  const isConnectingState = connecting || (hasAccepted && !connected);
  const isPreviewReady = connected;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !hasConfirmedCallRef.current) {
          // Only disconnect if user did NOT confirm the call
          setTimeout(() => handleDisconnect(), 0);
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent
        className={cn(
          '!max-w-5xl w-full space-y-6',
          isFullScreen && '!max-w-none !w-screen !h-screen !rounded-none',
        )}
      >
        {error ? (
          <div className="text-center space-y-4">
            <p className="text-xl text-red-500 font-medium">{error}</p>
            <button
              onClick={() => onOpenChange(false)}
              className={cn(
                'rounded flex items-center justify-center border-2 hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-lg font-medium whitespace-nowrap border-[#8A8C95] shadow-[2px_2px_0_0_#8A8C95] bg-[#0A0A0B] text-[#F8F8F8] mx-auto',
              )}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="text-xl text-[#D4D4D8] font-medium text-center">
              {isPreviewReady ? (
                <>
                  Respond within{' '}
                  <span className="text-[#FF007F] font-bold">
                    {countdown} seconds
                  </span>{' '}
                  to avoid disconnection
                </>
              ) : (
                'Waiting for connection...'
              )}
            </p>

            {/* Video preview area */}
            <div className="flex max-w-[755px] items-center gap-5 mx-auto">
              {/* Remote video (buyer) */}
              <div className="relative w-[367.638px] h-[306.099px] bg-[#1D0E0D] rounded-lg overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover -scale-x-100"
                  autoPlay
                  playsInline
                >
                  <track
                    kind="captions"
                    srcLang="en"
                    label="English captions"
                  />
                </video>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {isLoadingUser ? 'Loading...' : user?.displayName || 'Buyer'}
                </div>
              </div>

              {/* Local video (seller - you) */}
              <div className="relative w-[367.638px] h-[306.099px] bg-[#1D0E0D] rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  className={cn(
                    'w-full h-full object-cover -scale-x-100',
                    mutedVideo && 'opacity-0',
                  )}
                  autoPlay
                  playsInline
                  muted
                >
                  <track
                    kind="captions"
                    srcLang="en"
                    label="English captions"
                  />
                </video>
                {mutedVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1D0E0D]">
                    <Icon.videoOffIcon className="size-12 text-[#8A8C95]" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  You
                </div>
              </div>
            </div>

            {/* Controls bar */}
            <div className="flex items-center justify-center gap-3">
              {/* Microphone toggle */}
              <button
                type="button"
                className={cn(
                  'rounded-lg bg-[#1E2227] p-3 hover:bg-[#2A2F36] transition-colors',
                  muted && 'bg-[#F0443842]',
                )}
                onClick={handleMicToggle}
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
                  'rounded-lg bg-[#1E2227] p-3 hover:bg-[#2A2F36] transition-colors',
                  mutedVideo && 'bg-[#F0443842]',
                )}
                onClick={handleVideoToggle}
              >
                {mutedVideo ? (
                  <Icon.videoOffIcon className="size-5" />
                ) : (
                  <Icon.videoOnIcon className="size-5" />
                )}
              </button>
            </div>

            <p className="text-[#D4D4D8] font-medium text-center max-w-[413px] mx-auto">
              Confirm you can hear each other before starting. Disconnect if
              audio or video is unclear.
            </p>
            <div className="flex items-center gap-[28px] max-w-[458px] mx-auto">
              <button
                type="button"
                className={cn(
                  'rounded flex items-center justify-center border-2 hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-lg font-medium whitespace-nowrap border-[#8A8C95] shadow-[2px_2px_0_0_#8A8C95] bg-[#0A0A0B] text-[#F8F8F8] w-full transition-colors hover:border-red-500 hover:shadow-[2px_2px_0_0_#EF4444]',
                )}
                onClick={handleDisconnect}
              >
                Disconnect Call
              </button>{' '}
              {/* Confirm & Start button - shown after accepting and connected */}
              {isPreviewReady && (
                <button
                  type="button"
                  className={cn(
                    'rounded flex items-center justify-center border-2 hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-lg font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full transition-opacity',
                    (!isPreviewReady || isAccepting) &&
                      'opacity-50 cursor-not-allowed',
                  )}
                  onClick={handleConfirmAndStartCall}
                  disabled={isLoadingUser}
                >
                  {isLoadingUser ? 'Loading...' : 'Looks Good, Accept Call'}
                </button>
              )}
              {/* End/Reject call - Red */}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

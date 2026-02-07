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

const CONFIRMATION_TIMEOUT = 1150; // 13 seconds to confirm

export const CamsConnectQueueBuyerDialog = ({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
}) => {
  const router = useRouter();
  const { user: currentUser } = useGlobal();
  const { setReceiver, setConversationId } = useMessage();
  const {
    initiateCall,
    endCall,
    callState,
    connected,
    connecting,
    ringing,
    setIsCamsPreview,
    muted,
    toggleMute,
    mutedVideo,
    toggleVideo,
    localStream,
    remoteStream,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [countdown, setCountdown] = useState(CONFIRMATION_TIMEOUT);
  const [hasInitiatedCall, setHasInitiatedCall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const wasCallActiveRef = useRef(false);
  // Track if user confirmed the call (so we don't end it when dialog closes)
  const hasConfirmedCallRef = useRef(false);

  // Set cams preview mode to suppress the global Call component UI
  useEffect(() => {
    setIsCamsPreview(open);
    return () => setIsCamsPreview(false);
  }, [open, setIsCamsPreview]);

  // Clean up call when dialog closes WITHOUT user confirming (error, disconnect, etc.)
  // Do NOT end call if user confirmed - they're navigating to the messages page
  useEffect(() => {
    if (!open && hasInitiatedCall && !hasConfirmedCallRef.current) {
      console.log(
        '[CamsQueue] Dialog closed without confirm - ending call and cleaning up',
      );
      endCall();
    }
  }, [open, hasInitiatedCall, endCall]);

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

  // Initiate the call when dialog opens
  useEffect(() => {
    if (
      !open ||
      hasInitiatedCall ||
      !user?.discordId ||
      !currentUser?.discordId
    )
      return;

    const startCall = async () => {
      try {
        console.log('[CamsQueue] Starting call to:', user.discordId);

        setReceiver(user);

        console.log('[CamsQueue] Calling initiateCall...');
        // Initiate the video call without conversation ID first
        // Conversation will be created when user confirms
        initiateCall({
          isVideoCall: true,
          receiverId: user.discordId,
        });

        setHasInitiatedCall(true);
        console.log('[CamsQueue] Call initiated');
      } catch (err) {
        console.error('[CamsQueue] Failed to initiate call:', err);
        setError('Failed to start call. Please try again.');
      }
    };

    startCall();
  }, [
    open,
    hasInitiatedCall,
    user,
    currentUser?.discordId,
    initiateCall,
    setReceiver,
  ]);

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

  // Countdown timer - only starts when connected
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
      setHasInitiatedCall(false);
      setError(null);
      wasCallActiveRef.current = false;
      hasConfirmedCallRef.current = false;
    }
  }, [open]);

  const handleDisconnect = useCallback(() => {
    // End the WebRTC call properly
    endCall();
    onOpenChange(false);
  }, [endCall, onOpenChange]);

  const handleConfirmAndStartCall = useCallback(async () => {
    if (!user?.discordId || !currentUser?.discordId || isStartingCall) return;

    setIsStartingCall(true);
    // Mark that user confirmed - so we don't end the call when dialog closes
    hasConfirmedCallRef.current = true;

    // Get or create conversation and navigate to messages page
    try {
      const conversation = await getConversationBetweenUsersService([
        currentUser.discordId,
        user.discordId,
      ]);

      setConversationId(conversation._id);
      onOpenChange(false);
      router.push(`/messages?chat=${conversation._id}`);
    } catch (error) {
      console.error('Failed to start call:', error);
      setError('Failed to start call. Please try again.');
      setIsStartingCall(false);
      // Reset confirmed flag on error so cleanup can happen
      hasConfirmedCallRef.current = false;
    }
  }, [
    currentUser?.discordId,
    user,
    onOpenChange,
    router,
    isStartingCall,
    setConversationId,
  ]);

  const handleMicToggle = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  const handleVideoToggle = useCallback(() => {
    toggleVideo();
  }, [toggleVideo]);

  // Determine current state
  const isWaitingForAnswer = ringing || connecting;
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
      <DialogContent className="!max-w-5xl w-full space-y-10">
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
            {isPreviewReady && (
              <div className="rounded-[69px] bg-[#FF007F] gap-3 p-2.5 w-max mx-auto flex items-center">
                <Icon.warning />
                <span className="text-sm font-medium text-black">
                  Billing will start only after both parties confirm.
                </span>
              </div>
            )}
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

            <div className="flex max-w-[755px] items-center gap-5 mx-auto">
              {/* Remote video (seller) */}
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
                {!isPreviewReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1D0E0D]">
                    <div className="text-center">
                      <img
                        src={
                          user?.profileImage?.url ||
                          `https://cdn.discordapp.com/avatars/${user?.discordId}/${user?.discordAvatar}.png`
                        }
                        alt={user?.displayName || 'Callee'}
                        className="w-16 h-16 rounded-full object-cover mx-auto mb-2 animate-pulse"
                      />
                      <p className="text-[#8A8C95] text-sm">
                        {isWaitingForAnswer ? 'Ringing...' : 'Connecting...'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {user?.displayName || 'Seller'}
                </div>
              </div>

              {/* Local video (buyer - you) */}
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

            {/* Media controls */}
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

            <div className="space-y-[25px]">
              <p className="text-[#D4D4D8] font-medium text-center max-w-[413px] mx-auto">
                Confirm you can hear each other before starting. Disconnect if
                audio or video is unclear.
              </p>

              <div className="flex items-center gap-[28px] max-w-[458px] mx-auto">
                <button
                  onClick={handleDisconnect}
                  className={cn(
                    'rounded flex items-center justify-center border-2 hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-lg font-medium whitespace-nowrap border-[#8A8C95] shadow-[2px_2px_0_0_#8A8C95] bg-[#0A0A0B] text-[#F8F8F8] w-full transition-colors hover:border-red-500 hover:shadow-[2px_2px_0_0_#EF4444]',
                  )}
                >
                  Disconnect Call
                </button>
                <button
                  onClick={handleConfirmAndStartCall}
                  disabled={!isPreviewReady || isStartingCall}
                  className={cn(
                    'rounded flex items-center justify-center border-2 hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-lg font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full transition-opacity',
                    (!isPreviewReady || isStartingCall) &&
                      'opacity-50 cursor-not-allowed',
                  )}
                >
                  {isStartingCall
                    ? 'Starting Call...'
                    : 'Looks Good, Start My Call'}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

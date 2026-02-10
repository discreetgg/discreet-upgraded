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
import { Button } from './ui/button';

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
      <DialogContent className="max-w-[900px] p-0 overflow-hidden border-[#2E2E32] bg-[#0A0A0B] rounded-[40px] shadow-2xl outline-none">
        <div className="relative p-8 md:p-12">
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
              <div className="size-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Icon.callEnded className="size-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Connection Failed</h2>
                <p className="text-[#8A8C95] max-w-[300px] mx-auto">{error}</p>
              </div>
              <Button
                onClick={() => onOpenChange(false)}
                className="h-12 px-8 bg-[#1A1A1E] text-white border border-[#2E2E32] rounded-xl hover:bg-[#2E2E32]"
              >
                Return to Sellers
              </Button>
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="flex flex-col items-center mb-10 space-y-6">
                {isPreviewReady ? (
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-accent-color/10 border border-accent-color/20 rounded-full animate-in fade-in zoom-in duration-500">
                    <div className="size-2 rounded-full bg-accent-color animate-pulse shadow-[0_0_8px_rgba(255,0,127,1)]" />
                    <span className="text-sm font-bold text-accent-color uppercase tracking-wider">Secure Preview Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-[#1A1A1E] border border-[#2E2E32] rounded-full animate-pulse">
                    <Icon.loadingIndicator className="size-4 text-[#8A8C95] animate-spin" />
                    <span className="text-sm font-bold text-[#8A8C95] uppercase tracking-wider">Establishing Connection...</span>
                  </div>
                )}

                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    {isPreviewReady ? "Ready to Start?" : "Connecting..."}
                  </h2>
                  <p className="text-base text-[#8A8C95]">
                    {isPreviewReady ? (
                      <>Respond within <span className="text-white font-bold tabular-nums">{countdown}s</span> or the session will expire</>
                    ) : (
                      <>Waiting for <span className="text-white font-bold">{user?.displayName}</span> to join the preview</>
                    )}
                  </p>
                </div>
              </div>

              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {/* Seller Preview */}
                <div className="relative aspect-[4/3] bg-[#0F1114] rounded-3xl overflow-hidden border border-[#2E2E32] shadow-inner group">
                  <video
                    ref={remoteVideoRef}
                    className="w-full h-full object-cover -scale-x-100"
                    autoPlay
                    playsInline
                  />
                  {!isPreviewReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F1114]/80 backdrop-blur-sm">
                      <img
                        src={user?.profileImage?.url || `https://cdn.discordapp.com/avatars/${user?.discordId}/${user?.discordAvatar}.png`}
                        alt=""
                        className="size-24 rounded-full border-4 border-[#1A1A1E] shadow-2xl mb-4 animate-pulse"
                      />
                      <p className="text-sm font-bold text-[#8A8C95] uppercase tracking-widest">
                        {isWaitingForAnswer ? 'Ringing...' : 'Initializing...'}
                      </p>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{user?.displayName}</span>
                  </div>
                </div>

                {/* Local Preview */}
                <div className="relative aspect-[4/3] bg-[#0F1114] rounded-3xl overflow-hidden border border-[#2E2E32] shadow-inner group">
                  <video
                    ref={localVideoRef}
                    className={cn(
                      'w-full h-full object-cover -scale-x-100 transition-opacity duration-300',
                      mutedVideo && 'opacity-0'
                    )}
                    autoPlay
                    playsInline
                    muted
                  />
                  {mutedVideo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F1114]/90">
                      <div className="size-20 rounded-full bg-[#1A1A1E] flex items-center justify-center border border-[#2E2E32]">
                        <Icon.videoOffIcon className="size-8 text-[#8A8C95]" />
                      </div>
                      <p className="mt-4 text-xs font-bold text-[#8A8C95] uppercase tracking-widest">Camera Disabled</p>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">You (Preview)</span>
                  </div>

                  {/* Local Controls Overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button
                      onClick={handleMicToggle}
                      className={cn(
                        "p-2.5 rounded-xl transition-all",
                        muted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "hover:bg-white/10 text-white"
                      )}
                    >
                      {muted ? <Icon.microphoneOff className="size-5" /> : <Icon.microphone className="size-5" />}
                    </button>
                    <button
                      onClick={handleVideoToggle}
                      className={cn(
                        "p-2.5 rounded-xl transition-all",
                        mutedVideo ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "hover:bg-white/10 text-white"
                      )}
                    >
                      {mutedVideo ? <Icon.videoOffIcon className="size-5" /> : <Icon.videoOnIcon className="size-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions and Actions */}
              <div className="max-w-[600px] mx-auto flex flex-col items-center space-y-10">
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex items-center gap-2 text-orange-500/80">
                    <Icon.warning className="size-4" />
                    <p className="text-sm font-medium">Billing will only begin after both users confirm.</p>
                  </div>
                  <p className="text-[13px] text-[#8A8C95] text-center leading-relaxed">
                    Check video and audio quality now. If anything looks or sounds off, you can disconnect before the session starts without any charge.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={handleDisconnect}
                    className="h-14 flex items-center justify-center gap-3 rounded-2xl bg-[#1A1A1E] text-white border border-[#2E2E32] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-all font-bold group"
                  >
                    <Icon.callEnded className="size-5 transition-transform group-hover:scale-110" />
                    <span>Disconnect</span>
                  </button>

                  <button
                    onClick={handleConfirmAndStartCall}
                    disabled={!isPreviewReady || isStartingCall}
                    className={cn(
                      "relative h-14 flex items-center justify-center gap-3 rounded-2xl transition-all font-bold overflow-hidden shadow-2xl",
                      isPreviewReady && !isStartingCall
                        ? "bg-accent-color text-white shadow-[0_0_30px_rgba(255,0,127,0.3)] hover:shadow-[0_0_40px_rgba(255,0,127,0.5)] active:scale-[0.98]"
                        : "bg-[#1A1A1E] text-[#8A8C95] border border-[#2E2E32] cursor-not-allowed"
                    )}
                  >
                    {isStartingCall ? (
                      <Icon.loadingIndicator className="size-6 animate-spin" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                        <Icon.videoOnIcon className="size-6" />
                        <span>Start Session</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

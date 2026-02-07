'use client';

import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { useGlobal } from './global-context-provider';
import { useSocket } from './socket-context';
import {
  startCallService,
  setOngoingCallService,
  endCallService,
} from '@/lib/services';
import {
  useCall as useCallHook,
  type CallType,
  type IncomingCallData,
} from '@/hooks/use-call';
import {
  CallEndSummaryDialog,
  type CallEndSummaryData,
} from '@/components/call-end-summary-dialog';

type CallContextValue = {
  // Call state
  callState: 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended';
  receiverId: string | null;
  ringing: boolean;
  connected: boolean;
  connecting: boolean;
  loading: boolean;
  muted: boolean;
  mutedVideo: boolean;
  isRemoteMuted: boolean;
  isRemoteVideoOff: boolean;
  showMicPermissionDialog: boolean;
  micPermissionDenied: boolean;
  incomingCall: IncomingCallData | null;
  currentCallType: CallType | null;
  authenticated: boolean;

  // Streams
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  // Refs for video elements
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;

  // Global call duration (in seconds) - tracked centrally to persist across view changes
  callDuration: number;

  // Helper to attach streams to video elements by ID
  attachStreamToVideo: (elementId: string, stream: MediaStream | null) => void;

  // Setters
  setMuted: React.Dispatch<React.SetStateAction<boolean>>;
  setMutedVideo: React.Dispatch<React.SetStateAction<boolean>>;
  setRinging: React.Dispatch<React.SetStateAction<boolean>>;
  setConnecting: React.Dispatch<React.SetStateAction<boolean>>;
  setReceiverId: React.Dispatch<React.SetStateAction<string | null>>;
  setShowMicPermissionDialog: React.Dispatch<React.SetStateAction<boolean>>;

  // Permission helpers
  checkMicrophonePermission: () => Promise<boolean>;
  requestMicrophonePermission: () => Promise<boolean>;
  handleMicPermissionCancel: () => void;

  // Call actions
  initiateCall: (params: {
    isVideoCall: boolean;
    receiverId: string;
    conversationId?: string;
  }) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;

  // Preview state
  isCamsPreview: boolean;
  setIsCamsPreview: React.Dispatch<React.SetStateAction<boolean>>;

  // Call end summary
  callEndSummaryData: CallEndSummaryData | null;
  showCallEndSummary: boolean;
  setShowCallEndSummary: React.Dispatch<React.SetStateAction<boolean>>;
  callEndSummaryLoading: boolean;
  callEndSummaryError: string | null;
};

const CallContext = createContext<CallContextValue | null>(null);

const CallContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useGlobal();
  const { socket } = useSocket();

  // Refs for tracking call metadata
  const callStartTimeRef = useRef<number | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const billingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callerIdRef = useRef<string | null>(null);
  const calleeIdRef = useRef<string | null>(null);
  // Guard against duplicate initiateCall invocations
  const isInitiatingCallRef = useRef<boolean>(false);
  // Track pending call-end operation to ensure it completes before starting a new call
  const pendingCallEndRef = useRef<Promise<void> | null>(null);

  // Local state
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMicPermissionDialog, setShowMicPermissionDialog] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [isCamsPreview, setIsCamsPreview] = useState(false);
  const [showCallEndSummary, setShowCallEndSummary] = useState(false);
  const [callEndSummaryData, setCallEndSummaryData] =
    useState<CallEndSummaryData | null>(null);
  const [callEndSummaryLoading, setCallEndSummaryLoading] = useState(false);
  const [callEndSummaryError, setCallEndSummaryError] = useState<string | null>(
    null,
  );

  // Video element refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Global call duration state - tracked centrally to persist across view changes
  const [callDuration, setCallDuration] = useState(0);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use the WebRTC call hook
  const {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isRemoteMuted,
    isRemoteVideoOff,
    remoteUserId,
    currentCallType,
    incomingCall,
    isConnected,
    isRinging,
    isConnecting,
    startCall,
    acceptCall: hookAcceptCall,
    rejectCall: hookRejectCall,
    endCall: hookEndCall,
    toggleMute,
    toggleVideo,
  } = useCallHook({
    onIncomingCall: (data) => {
      console.log('[CallContext] Incoming call:', data);
      setReceiverId(data.from);
      toast.info(`Incoming ${data.callType} call from ${data.from}`);
    },
    onCallConnected: async () => {
      console.log('[CallContext] Call connected');
      callStartTimeRef.current = Date.now();

      // Start global call duration timer
      setCallDuration(0);
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }
      callDurationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Update call status to ongoing
      if (currentCallIdRef.current) {
        try {
          await setOngoingCallService({
            callId: currentCallIdRef.current,
          });
        } catch (error) {
          console.error('[CallContext] Failed to set call as ongoing:', error);
        }
      }

      toast.success('Call connected');
    },
    onCallEnded: async (reason) => {
      console.log('[CallContext] Call ended:', reason);

      // Calculate call duration
      const duration = callStartTimeRef.current
        ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        : 0;

      // Stop and reset global call duration timer
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
        callDurationIntervalRef.current = null;
      }
      setCallDuration(0);

      // Store refs before clearing (for API call)
      const callId = currentCallIdRef.current;
      const callerId = callerIdRef.current;
      const calleeId = calleeIdRef.current;

      // Reset refs FIRST to prevent race conditions
      callStartTimeRef.current = null;
      currentCallIdRef.current = null;
      conversationIdRef.current = null;
      callerIdRef.current = null;
      calleeIdRef.current = null;

      // Clear billing interval
      if (billingIntervalRef.current) {
        clearInterval(billingIntervalRef.current);
        billingIntervalRef.current = null;
      }

      // Log call end to backend and track the promise so new calls wait for it
      if (callId) {
        // Show the dialog immediately in loading state
        setCallEndSummaryData(null);
        setCallEndSummaryError(null);
        setCallEndSummaryLoading(true);
        setShowCallEndSummary(true);

        const callEndPromise = endCallService({
          callerId: callerId ?? '',
          calleeId: calleeId ?? '',
          callId: callId,
          callStatus: 'ended',
          duration,
        })
          .then((response: CallEndSummaryData) => {
            // Store the call data
            if (response && response._id) {
              setCallEndSummaryData(response);
              setCallEndSummaryError(null);
            }
          })
          .catch((error: any) => {
            // Handle errors
            if (error?.response?.status === 400 || error?.status === 400) {
              console.log(
                '[CallContext] Call end API returned 400 - call may not have been fully established',
              );
              setCallEndSummaryError('Call details unavailable');
            } else {
              console.error('[CallContext] Failed to log call end:', error);
              setCallEndSummaryError('Failed to load call details');
            }
          })
          .finally(() => {
            // Clear the pending ref once the call-end completes
            pendingCallEndRef.current = null;
            setCallEndSummaryLoading(false);
            console.log('[CallContext] Call end API completed');
          });

        // Store the promise so initiateCall can wait for it
        pendingCallEndRef.current = callEndPromise;
      }

      setShowMicPermissionDialog(false);
      if (reason && reason.toLowerCase().includes('busy')) {
        toast.error('User is busy. Please try again later.');
      } else {
        toast.success(reason || 'Call ended');
      }
    },
    onCallFailed: (error) => {
      console.error('[CallContext] Call failed:', error);
      toast.error(error);
    },
    onLocalStream: (stream) => {
      console.log('[CallContext] Local stream received');
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    },
    onRemoteStream: (stream) => {
      console.log('[CallContext] Remote stream received');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    },
    onRinging: () => {
      console.log('[CallContext] Remote device is ringing');
    },
  });

  // Sync video refs with streams
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Warn user before reloading/closing page during active call
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isConnected || isConnecting || isRinging) {
        e.preventDefault();
        e.returnValue =
          'You have an active call. Are you sure you want to leave?';

        // Use Beacon API to notify server about unexpected disconnect
        try {
          const disconnectData = JSON.stringify({
            userId: user?.discordId,
            callId: currentCallIdRef.current,
            reason: 'page_unload',
            timestamp: Date.now(),
          });
          navigator.sendBeacon('/api/calls/disconnect', disconnectData);
        } catch (error) {
          console.error('Failed to send disconnect beacon:', error);
        }

        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isConnected, isConnecting, isRinging, user?.discordId]);

  // Persist active call state to localStorage
  useEffect(() => {
    if (isConnected || isConnecting || isRinging) {
      const callStateData = {
        connected: isConnected,
        connecting: isConnecting,
        ringing: isRinging,
        callId: currentCallIdRef.current,
        timestamp: Date.now(),
      };
      localStorage.setItem('root:active-call', JSON.stringify(callStateData));
    } else {
      localStorage.removeItem('root:active-call');
    }
  }, [isConnected, isConnecting, isRinging]);

  // Attempt to recover call state on mount
  useEffect(() => {
    const attemptCallRecovery = async () => {
      const storedCall = localStorage.getItem('root:active-call');

      if (storedCall && user) {
        try {
          const callStateData = JSON.parse(storedCall);
          const isRecent = Date.now() - callStateData.timestamp < 120000;

          if (isRecent) {
            toast.loading('Detected interrupted call...', {
              id: 'call-recovery',
            });

            setTimeout(() => {
              toast.error('Call was disconnected due to page reload', {
                id: 'call-recovery',
                description: 'Please call again to reconnect.',
              });

              fetch('/api/calls/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.discordId,
                  callId: callStateData.callId,
                  reason: 'page_reload_recovery',
                  timestamp: Date.now(),
                }),
              }).catch((err) =>
                console.error('Failed to notify disconnect:', err),
              );

              localStorage.removeItem('root:active-call');
            }, 1500);
          } else {
            localStorage.removeItem('root:active-call');
          }
        } catch (error) {
          console.error('Failed to recover call:', error);
          localStorage.removeItem('root:active-call');
        }
      }
    };

    if (user) {
      attemptCallRecovery();
    }
  }, [user]);

  // Emit call:session every minute while call is connected (for billing)
  useEffect(() => {
    if (!isConnected || !socket?.connected) {
      if (billingIntervalRef.current) {
        clearInterval(billingIntervalRef.current);
        billingIntervalRef.current = null;
      }
      return;
    }

    const emitCallSession = () => {
      if (socket?.connected && currentCallIdRef.current) {
        const sessionData = {
          callId: currentCallIdRef.current,
          callerId: callerIdRef.current,
          calleeId: calleeIdRef.current,
          callType: currentCallType || 'audio',
        };
        console.log('📞 Emitting call:session:', sessionData);
        socket.emit('call:session', sessionData);
      }
    };

    emitCallSession();
    billingIntervalRef.current = setInterval(emitCallSession, 60000);

    return () => {
      if (billingIntervalRef.current) {
        clearInterval(billingIntervalRef.current);
        billingIntervalRef.current = null;
      }
    };
  }, [isConnected, socket, currentCallType]);

  // Check microphone permission
  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      return result.state === 'granted';
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return true;
      } catch {
        return false;
      }
    }
  }, []);

  // Request microphone permission
  const requestMicrophonePermission =
    useCallback(async (): Promise<boolean> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        for (const track of stream.getTracks()) {
          track.stop();
        }
        setMicPermissionDenied(false);
        setShowMicPermissionDialog(false);
        return true;
      } catch (error) {
        console.error('Microphone permission denied:', error);
        setMicPermissionDenied(true);
        return false;
      }
    }, []);

  // Handle microphone permission cancel
  const handleMicPermissionCancel = useCallback(() => {
    setShowMicPermissionDialog(false);
    setMicPermissionDenied(true);
  }, []);

  // Initiate a call
  const initiateCall = useCallback(
    async ({
      isVideoCall,
      receiverId: targetId,
      conversationId,
    }: {
      isVideoCall: boolean;
      receiverId: string;
      conversationId?: string;
    }) => {
      // Guard against duplicate invocations
      if (isInitiatingCallRef.current) {
        console.log(
          '[CallContext] initiateCall already in progress, ignoring duplicate call',
        );
        return;
      }
      isInitiatingCallRef.current = true;

      try {
        // Wait for any pending call-end operation to complete before starting a new call
        if (pendingCallEndRef.current) {
          console.log('[CallContext] Waiting for previous call to end...');
          await pendingCallEndRef.current;
          console.log(
            '[CallContext] Previous call ended, proceeding with new call',
          );
        }

        // Store conversation ID
        if (conversationId) {
          conversationIdRef.current = conversationId;
        }

        // Check microphone permission
        const hasPermission = await checkMicrophonePermission();
        if (!hasPermission) {
          setShowMicPermissionDialog(true);
          setReceiverId(targetId);
          isInitiatingCallRef.current = false;
          return;
        }

        setLoading(true);
        setReceiverId(targetId);

        // Create call record in backend
        try {
          const response = await startCallService({
            callerId: user?.discordId ?? '',
            calleeId: targetId,
            callType: isVideoCall ? 'video' : 'audio',
          });

          currentCallIdRef.current = response._id;
          callerIdRef.current = user?.discordId ?? null;
          calleeIdRef.current = targetId;
        } catch (error) {
          console.error('[CallContext] Failed to start call service:', error);
          toast.error('Failed to initiate call. Please try again.');
          setLoading(false);
          return;
        }

        // Start the WebRTC call with the backend call ID
        const callType: CallType = isVideoCall ? 'video' : 'audio';
        await startCall(
          targetId,
          callType,
          conversationId || 'default',
          currentCallIdRef.current ?? undefined,
        );

        setLoading(false);
      } catch (err) {
        console.error('[CallContext] initiateCall error:', err);
        toast.error('Failed to start call.');
        setLoading(false);
      } finally {
        // Reset the guard after a short delay to allow for legitimate retries
        setTimeout(() => {
          isInitiatingCallRef.current = false;
        }, 1000);
      }
    },
    [checkMicrophonePermission, startCall, user?.discordId],
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    try {
      // Use the call ID from the incoming call (created by the caller)
      // Don't create a new call record - the caller already did that
      if (incomingCall) {
        // Use the callId passed from the caller through WebRTC signaling
        if (incomingCall.callId) {
          currentCallIdRef.current = incomingCall.callId;
        } else {
          console.warn(
            '[CallContext] No callId received from caller - call billing may not work correctly',
          );
        }
        callerIdRef.current = incomingCall.from;
        calleeIdRef.current = user?.discordId ?? null;
        conversationIdRef.current = incomingCall.conversationId;
      }

      await hookAcceptCall();
    } catch (error) {
      console.error('[CallContext] Failed to accept call:', error);
      toast.error('Failed to accept call');
    }
  }, [hookAcceptCall, incomingCall, user?.discordId]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    hookRejectCall();
    toast.info('Call declined');
  }, [hookRejectCall]);

  // End current call
  const endCall = useCallback(() => {
    hookEndCall();
  }, [hookEndCall]);

  // Helper to attach streams to video elements by ID - prevents issues when switching views
  const attachStreamToVideo = useCallback(
    (elementId: string, stream: MediaStream | null) => {
      if (typeof document === 'undefined') return;
      const videoElement = document.getElementById(
        elementId,
      ) as HTMLVideoElement | null;
      if (videoElement && stream) {
        // Only set srcObject if it's different to avoid unnecessary re-renders
        if (videoElement.srcObject !== stream) {
          videoElement.srcObject = stream;
        }
      }
    },
    [],
  );

  // Auto-attach streams to global video elements when they change
  useEffect(() => {
    if (localStream) {
      attachStreamToVideo('global_local_video', localStream);
    }
  }, [localStream, attachStreamToVideo]);

  useEffect(() => {
    if (remoteStream) {
      attachStreamToVideo('global_remote_video', remoteStream);
    }
  }, [remoteStream, attachStreamToVideo]);

  // Build context value
  const value = useMemo(
    () => ({
      // State
      callState,
      receiverId,
      ringing: isRinging,
      connected: isConnected,
      connecting: isConnecting,
      loading,
      muted: isMuted,
      mutedVideo: isVideoOff,
      isRemoteMuted,
      isRemoteVideoOff,
      showMicPermissionDialog,
      micPermissionDenied,
      incomingCall,
      currentCallType,
      authenticated: !!user && !!socket,

      // Streams
      localStream,
      remoteStream,

      // Refs
      localVideoRef,
      remoteVideoRef,

      // Global call duration
      callDuration,

      // Stream attachment helper
      attachStreamToVideo,

      // Setters (kept for backward compatibility)
      setMuted: () => toggleMute(),
      setMutedVideo: () => toggleVideo(),
      setRinging: () => {},
      setConnecting: () => {},
      setReceiverId,
      setShowMicPermissionDialog,

      // Permission helpers
      checkMicrophonePermission,
      requestMicrophonePermission,
      handleMicPermissionCancel,

      // Call actions
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMute,
      toggleVideo,

      // Preview state
      isCamsPreview,
      setIsCamsPreview,

      // Call end summary
      callEndSummaryData,
      showCallEndSummary,
      setShowCallEndSummary,
      callEndSummaryLoading,
      callEndSummaryError,
    }),
    [
      callState,
      receiverId,
      isRinging,
      isConnected,
      isConnecting,
      loading,
      isMuted,
      isVideoOff,
      isRemoteMuted,
      isRemoteVideoOff,
      showMicPermissionDialog,
      micPermissionDenied,
      incomingCall,
      currentCallType,
      user,
      socket,
      localStream,
      remoteStream,
      callDuration,
      attachStreamToVideo,
      checkMicrophonePermission,
      requestMicrophonePermission,
      handleMicPermissionCancel,
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
      toggleMute,
      toggleVideo,
      isCamsPreview,
      callEndSummaryData,
      showCallEndSummary,
      callEndSummaryLoading,
      callEndSummaryError,
    ],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      <CallEndSummaryDialog
        open={showCallEndSummary}
        onOpenChange={setShowCallEndSummary}
        callData={callEndSummaryData}
        loading={callEndSummaryLoading}
        error={callEndSummaryError}
      />
    </CallContext.Provider>
  );
};

export const useCallContext = () => {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error('useCallContext must be used within a CallContextProvider');
  }
  return ctx;
};

// Keep the old export for backward compatibility
export { useCallContext as useCall };

export default CallContextProvider;

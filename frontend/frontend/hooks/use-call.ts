'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useSocket } from '@/context/socket-context';
import { toast } from 'sonner';
import { getIceServersConfig } from '@/actions/ice-servers';

export type CallType = 'video' | 'audio';

export type CallState =
  | 'idle'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'ended';

export interface IncomingCallData {
  from: string;
  callType: CallType;
  conversationId: string;
  offer: RTCSessionDescriptionInit;
  callId?: string; // Backend call record ID (passed from caller)
}

export interface UseCallOptions {
  onIncomingCall?: (data: IncomingCallData) => void;
  onCallConnected?: () => void;
  onCallEnded?: (reason?: string) => void;
  onCallFailed?: (error: string) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onRinging?: () => void;
}

export function useCall(options: UseCallOptions = {}) {
  const { socket } = useSocket();

  // State
  const [callState, setCallState] = useState<CallState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [currentCallType, setCurrentCallType] = useState<CallType | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null,
  );

  // Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const activeConversationIdRef = useRef<string | null>(null);
  const iceServersConfigRef = useRef<RTCConfiguration | null>(null);
  // Track processed offers to prevent duplicate handling
  const processedOffersRef = useRef<Set<string>>(new Set());
  // Use ref to track call state for synchronous checks (avoids React state batching issues)
  const callStateRef = useRef<CallState>('idle');
  // Track if we received ringing signal from remote (to ignore stale 'User busy' messages)
  const receivedRingingRef = useRef<boolean>(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('[useCall] Cleaning up call resources');

    // Stop ALL tracks from local stream (both audio AND video)
    if (localStreamRef.current) {
      console.log('[useCall] Stopping local stream tracks:', localStreamRef.current.getTracks().length);
      localStreamRef.current.getTracks().forEach((track) => {
        console.log(`[useCall] Stopping track: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close peer connection (this also stops remote tracks)
    if (peerConnectionRef.current) {
      // Get all senders and stop their tracks
      peerConnectionRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          console.log(`[useCall] Stopping sender track: ${sender.track.kind}`);
          sender.track.stop();
        }
      });
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear pending candidates
    pendingCandidatesRef.current = [];

    // Reset state
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    callStateRef.current = 'idle';
    setRemoteUserId(null);
    setCurrentCallType(null);
    setIncomingCall(null);
    setIsRemoteMuted(false);
    setIsRemoteVideoOff(false);
    activeConversationIdRef.current = null;
    receivedRingingRef.current = false;
    // Clear processed offers after a delay to allow for legitimate retries
    setTimeout(() => {
      processedOffersRef.current.clear();
    }, 5000);
  }, []);

  // Fetch ICE servers config on mount
  useEffect(() => {
    const fetchIceServers = async () => {
      try {
        const config = await getIceServersConfig();
        iceServersConfigRef.current = config;
      } catch (error) {
        console.error('[useCall] Error fetching ICE servers config:', error);
      }
    };

    fetchIceServers();
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(
    (targetId: string) => {
      console.log('[useCall] Creating peer connection for:', targetId);

      const pc = new RTCPeerConnection(
        iceServersConfigRef.current || undefined,
      );

      pc.onicecandidate = (event) => {
        if (event.candidate && socket?.connected) {
          console.log('[useCall] Sending ICE candidate');
          socket.emit('call:ice', {
            to: targetId,
            candidate: event.candidate,
            conversationId: activeConversationIdRef.current,
          });
        }
      };

      pc.ontrack = (event) => {
        console.log('[useCall] Received remote track');
        const stream = event.streams[0];
        setRemoteStream(stream);
        options.onRemoteStream?.(stream);
      };

      pc.onconnectionstatechange = () => {
        console.log('[useCall] Connection state:', pc.connectionState);

        switch (pc.connectionState) {
          case 'connected':
            setCallState('connected');
            options.onCallConnected?.();
            break;
          case 'disconnected':
          case 'failed':
            options.onCallFailed?.('Connection failed');
            cleanup();
            break;
          case 'closed':
            cleanup();
            break;
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[useCall] ICE connection state:', pc.iceConnectionState);
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [socket, options, cleanup],
  );

  // Get user media
  const getUserMedia = useCallback(
    async (callType: CallType): Promise<MediaStream> => {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      options.onLocalStream?.(stream);

      return stream;
    },
    [options],
  );

  // Start a call
  const startCall = useCallback(
    async (targetId: string, callType: CallType, conversationId: string, callId?: string) => {
      if (!socket?.connected) {
        toast.error('Not connected to server');
        return;
      }

      console.log(`[useCall] Starting ${callType} call to ${targetId}`);

      // Clean up any existing call
      cleanup();

      try {
        setCallState('connecting');
        callStateRef.current = 'connecting';
        setRemoteUserId(targetId);
        setCurrentCallType(callType);
        activeConversationIdRef.current = conversationId;

        // Get local media
        const stream = await getUserMedia(callType);

        // Create peer connection
        const pc = createPeerConnection(targetId);

        // Add tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call:offer', {
          to: targetId,
          offer,
          conversationId,
          callType,
          callId, // Pass the backend call ID to the callee
        });

        console.log('[useCall] Offer sent, waiting for answer');
        // Caller stays in 'connecting' state while waiting for callee to answer
        // The 'ringing' state is only for the callee receiving the call
      } catch (error) {
        console.error('[useCall] Error starting call:', error);
        const message =
          error instanceof Error ? error.message : 'Failed to start call';
        toast.error(message);
        options.onCallFailed?.(message);
        cleanup();
      }
    },
    [socket, cleanup, getUserMedia, createPeerConnection, options],
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket?.connected) {
      console.error('[useCall] No incoming call to accept');
      return;
    }

    console.log('[useCall] Accepting call from:', incomingCall.from);

    try {
      setCallState('connecting');
      callStateRef.current = 'connecting';
      setRemoteUserId(incomingCall.from);
      setCurrentCallType(incomingCall.callType);
      activeConversationIdRef.current = incomingCall.conversationId;

      // Get local media
      const stream = await getUserMedia(incomingCall.callType);

      // Create peer connection
      const pc = createPeerConnection(incomingCall.from);

      // Add tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Set remote description (the offer)
      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer),
      );

      // Add any pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', {
        to: incomingCall.from,
        answer,
        conversationId: incomingCall.conversationId,
      });

      console.log('[useCall] Answer sent');
      setIncomingCall(null);
    } catch (error) {
      console.error('[useCall] Error accepting call:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to accept call';
      toast.error(message);
      options.onCallFailed?.(message);
      cleanup();
    }
  }, [
    incomingCall,
    socket,
    getUserMedia,
    createPeerConnection,
    options,
    cleanup,
  ]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!incomingCall || !socket?.connected) {
      return;
    }

    console.log('[useCall] Rejecting call from:', incomingCall.from);

    socket.emit('call:end', {
      to: incomingCall.from,
      reason: 'Call declined',
      conversationId: incomingCall.conversationId,
    });

    setIncomingCall(null);
    setCallState('idle');
  }, [incomingCall, socket]);

  // End call
  const endCall = useCallback(() => {
    if (socket?.connected && remoteUserId) {
      console.log('[useCall] Ending call with:', remoteUserId);

      socket.emit('call:end', {
        to: remoteUserId,
        reason: 'User ended call',
        conversationId: activeConversationIdRef.current,
      });
    }

    options.onCallEnded?.('User ended call');
    cleanup();
  }, [socket, remoteUserId, cleanup, options]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const newMutedState = !isMuted;
      audioTracks.forEach((track) => {
        track.enabled = !newMutedState;
      });
      setIsMuted(newMutedState);

      // Notify remote user of mute state change
      if (socket && remoteUserId) {
        socket.emit('call:mute', {
          to: remoteUserId,
          isMuted: newMutedState,
        });
      }
    }
  }, [isMuted, socket, remoteUserId]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const newVideoOffState = !isVideoOff;
      videoTracks.forEach((track) => {
        track.enabled = !newVideoOffState;
      });
      setIsVideoOff(newVideoOffState);

      // Notify remote user of video state change
      if (socket && remoteUserId) {
        socket.emit('call:video', {
          to: remoteUserId,
          isVideoOff: newVideoOffState,
        });
      }
    }
  }, [isVideoOff, socket, remoteUserId]);

  // Handle incoming offer
  const handleOffer = useCallback(
    (data: {
      from: string;
      offer: RTCSessionDescriptionInit;
      conversationId: string;
      callType: CallType;
      callId?: string;
    }) => {
      console.log(
        `[useCall] Received offer from ${data.from} (${data.callType})`,
      );

      // Create a unique key for this offer to prevent duplicate processing
      const offerKey = `${data.from}-${data.conversationId}`;
      
      // Check if we've already processed this offer (prevents duplicate handling)
      if (processedOffersRef.current.has(offerKey)) {
        console.log('[useCall] Duplicate offer detected, ignoring');
        return;
      }

      // Use ref for synchronous state check to avoid React batching issues
      // If already in a call, reject the new one
      if (callStateRef.current !== 'idle') {
        console.log('[useCall] Already in a call, rejecting new offer. Current state:', callStateRef.current);
        socket?.emit('call:end', {
          to: data.from,
          reason: 'User busy',
          conversationId: data.conversationId,
        });
        return;
      }

      // Mark this offer as processed BEFORE setting state to prevent race conditions
      processedOffersRef.current.add(offerKey);

      // Store incoming call data
      const incomingCallData: IncomingCallData = {
        from: data.from,
        callType: data.callType,
        conversationId: data.conversationId,
        offer: data.offer,
        callId: data.callId, // Include the caller's backend call ID
      };

      setIncomingCall(incomingCallData);
      setCallState('ringing');
      callStateRef.current = 'ringing';

      // Notify caller that we're ringing
      socket?.emit('call:ringing', {
        to: data.from,
        conversationId: data.conversationId,
      });

      // Notify via callback
      options.onIncomingCall?.(incomingCallData);
    },
    [socket, options],
  );

  // Handle answer
  const handleAnswer = useCallback(
    async (data: {
      from: string;
      answer: RTCSessionDescriptionInit;
      conversationId: string;
    }) => {
      console.log('[useCall] Received answer from:', data.from);

      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('[useCall] No peer connection for answer');
        return;
      }

      if (pc.signalingState === 'stable') {
        console.log('[useCall] Connection already stable, ignoring answer');
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

        // Add any pending ICE candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      } catch (error) {
        console.error('[useCall] Error setting remote description:', error);
      }
    },
    [],
  );

  // Handle ICE candidate
  const handleIceCandidate = useCallback(
    async (data: {
      from: string;
      candidate: RTCIceCandidateInit;
      conversationId: string;
    }) => {
      console.log('[useCall] Received ICE candidate');

      const pc = peerConnectionRef.current;

      if (pc?.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('[useCall] Error adding ICE candidate:', error);
        }
      } else {
        // Queue the candidate for later
        console.log(
          '[useCall] Queuing ICE candidate (no remote description yet)',
        );
        pendingCandidatesRef.current.push(data.candidate);
      }
    },
    [],
  );

  // Handle call end from remote
  const handleRemoteEnd = useCallback(
    (data: { from: string; reason: string; conversationId: string }) => {
      console.log(`[useCall] Call ended by ${data.from}: ${data.reason}`);

      // Ignore 'User busy' if we already received ringing signal from the same user
      // This prevents race conditions where a stale 'busy' message arrives after the call started
      if (
        data.reason?.toLowerCase().includes('busy') &&
        receivedRingingRef.current &&
        callStateRef.current === 'connecting'
      ) {
        console.log(
          '[useCall] Ignoring stale "User busy" message - already received ringing signal',
        );
        return;
      }

      // Clear incoming call if this was the caller
      if (incomingCall?.from === data.from) {
        setIncomingCall(null);
      }

      options.onCallEnded?.(data.reason);
      cleanup();
    },
    [cleanup, options, incomingCall],
  );

  // Handle ringing notification
  const handleRinging = useCallback(
    (data: { from: string }) => {
      console.log(`[useCall] Ringing on ${data.from}'s device`);
      // Mark that we received ringing signal - this means the remote user is aware of the call
      receivedRingingRef.current = true;
      options.onRinging?.();
    },
    [options],
  );

  // Handle remote mute notification
  const handleRemoteMute = useCallback(
    (data: { from: string; isMuted: boolean }) => {
      console.log(`[useCall] Remote user ${data.from} muted: ${data.isMuted}`);
      setIsRemoteMuted(data.isMuted);
    },
    [],
  );

  // Handle remote video notification
  const handleRemoteVideo = useCallback(
    (data: { from: string; isVideoOff: boolean }) => {
      console.log(
        `[useCall] Remote user ${data.from} video off: ${data.isVideoOff}`,
      );
      setIsRemoteVideoOff(data.isVideoOff);
    },
    [],
  );

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    console.log('[useCall] Setting up socket listeners');

    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice', handleIceCandidate);
    socket.on('call:end', handleRemoteEnd);
    socket.on('call:ringing', handleRinging);
    socket.on('call:mute', handleRemoteMute);
    socket.on('call:video', handleRemoteVideo);

    return () => {
      console.log('[useCall] Removing socket listeners');
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice', handleIceCandidate);
      socket.off('call:end', handleRemoteEnd);
      socket.off('call:ringing', handleRinging);
      socket.off('call:mute', handleRemoteMute);
      socket.off('call:video', handleRemoteVideo);
    };
  }, [
    socket,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleRemoteEnd,
    handleRinging,
    handleRemoteMute,
    handleRemoteVideo,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
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
    isConnected: callState === 'connected',
    isRinging: callState === 'ringing',
    isConnecting: callState === 'connecting',
    isIdle: callState === 'idle',

    // Actions
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    cleanup,
  };
}

export default useCall;

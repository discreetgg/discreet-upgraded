'use client';

import { useCall } from '@/context/call-context';
import { useGlobal } from '@/context/global-context-provider';
import { CallAudioRinging } from './call-audio-ringing';
import { CallVideoRinging } from './call-video-ringing';
import { CallAudioConnecting } from './call-audio-connecting';
import { CallVideoConnecting } from './call-video-connecting';
import { CallAudioConnected } from './call-audio-connected';
import { CallVideoConnected } from './call-video-connected';
import { MicrophonePermissionDialog } from './microphone-permission-dialog';
import { CamsConnectQueueSellerDialog } from './cams-connect-queue-seller-dialog';
import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useMessage } from '@/context/message-context';
import { getUserByIdService } from '@/lib/services';
import { AuthorType, UserType } from '@/types/global';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export const CallSheet = () => {
  const {
    incomingCall,
    currentCallType,
    authenticated,
    ringing,
    connected,
    connecting,
    showMicPermissionDialog,
    requestMicrophonePermission,
    handleMicPermissionCancel,
    setRinging,
    isCamsPreview,
    endCall,
  } = useCall();

  const { user: currentUser } = useGlobal();

  const [fetchedRemoteUser, setFetchedRemoteUser] = useState<AuthorType | null>(
    null,
  );
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPiPMode, setIsPiPMode] = useState(false);

  // Track if seller has confirmed/dismissed the queue dialog
  // This is a ref to avoid race conditions with state updates
  const sellerQueueConfirmedRef = useRef(false);

  // Drag state for desktop call container
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const callContainerRef = useRef<HTMLDivElement>(null);

  // Audio refs for ringing tones
  const callerRingAudioRef = useRef<HTMLAudioElement>(null);
  const calleeRingAudioRef = useRef<HTMLAudioElement>(null);
  const calleeUnavailableAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const ensureCallAudioElements = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!callerRingAudioRef.current) {
      const callerRingAudio = new Audio('/caller-ring.mp3');
      callerRingAudio.loop = true;
      callerRingAudio.preload = 'none';
      callerRingAudioRef.current = callerRingAudio;
    }

    if (!calleeRingAudioRef.current) {
      const calleeRingAudio = new Audio('/callee-ring.mp3');
      calleeRingAudio.loop = true;
      calleeRingAudio.preload = 'none';
      calleeRingAudioRef.current = calleeRingAudio;
    }

    if (!calleeUnavailableAudioRef.current) {
      const calleeUnavailableAudio = new Audio('/callee-unavailable.mp3');
      calleeUnavailableAudio.preload = 'none';
      calleeUnavailableAudioRef.current = calleeUnavailableAudio;
    }
  }, []);

  // Initialize lightweight audio settings and clean up on unmount
  useEffect(() => {
    // Set remote audio volume to maximum
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = 1.0;
    }

    return () => {
      // Cleanup audio on unmount
      if (callerRingAudioRef.current) {
        callerRingAudioRef.current.pause();
        callerRingAudioRef.current = null;
      }
      if (calleeRingAudioRef.current) {
        calleeRingAudioRef.current.pause();
        calleeRingAudioRef.current = null;
      }
      if (calleeUnavailableAudioRef.current) {
        calleeUnavailableAudioRef.current.pause();
        calleeUnavailableAudioRef.current = null;
      }
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
  }, []);

  // Handle ringing audio for incoming calls (callee side) with 30-second timeout
  useEffect(() => {
    if (ringing && authenticated) {
      ensureCallAudioElements();

      if (!calleeRingAudioRef.current) {
        return;
      }

      calleeRingAudioRef.current.play().catch((error) => {
        console.error('Error playing callee ring tone:', error);
      });

      callTimeoutRef.current = setTimeout(() => {
        if (calleeRingAudioRef.current) {
          calleeRingAudioRef.current.pause();
          calleeRingAudioRef.current.currentTime = 0;
        }

        if (calleeUnavailableAudioRef.current) {
          calleeUnavailableAudioRef.current.currentTime = 0;
          calleeUnavailableAudioRef.current.play().catch((error) => {
            console.error('Error playing callee unavailable sound:', error);
          });

          setTimeout(() => {
            if (calleeUnavailableAudioRef.current) {
              calleeUnavailableAudioRef.current.pause();
              calleeUnavailableAudioRef.current.currentTime = 0;
            }
          }, 1000);

          setTimeout(() => {
            endCall();
          }, 1000);
        } else {
          endCall();
        }
      }, 30000);
    } else {
      if (calleeRingAudioRef.current) {
        calleeRingAudioRef.current.pause();
        calleeRingAudioRef.current.currentTime = 0;
      }
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    }

    return () => {
      if (calleeRingAudioRef.current) {
        calleeRingAudioRef.current.pause();
        calleeRingAudioRef.current.currentTime = 0;
      }
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    };
  }, [ringing, authenticated, endCall, ensureCallAudioElements]);

  // Handle connecting audio for outgoing calls (caller side) with 30-second timeout
  useEffect(() => {
    if (connecting && authenticated) {
      ensureCallAudioElements();

      if (!callerRingAudioRef.current) {
        return;
      }

      callerRingAudioRef.current.play().catch((error) => {
        console.error('Error playing caller ring tone:', error);
      });

      callTimeoutRef.current = setTimeout(() => {
        if (callerRingAudioRef.current) {
          callerRingAudioRef.current.pause();
          callerRingAudioRef.current.currentTime = 0;
        }

        if (calleeUnavailableAudioRef.current) {
          calleeUnavailableAudioRef.current.currentTime = 0;
          calleeUnavailableAudioRef.current.play().catch((error) => {
            console.error('Error playing callee unavailable sound:', error);
          });

          setTimeout(() => {
            if (calleeUnavailableAudioRef.current) {
              calleeUnavailableAudioRef.current.pause();
              calleeUnavailableAudioRef.current.currentTime = 0;
            }
          }, 1000);

          setTimeout(() => {
            endCall();
          }, 1000);
        } else {
          endCall();
        }
      }, 30000);
    } else {
      if (callerRingAudioRef.current) {
        callerRingAudioRef.current.pause();
        callerRingAudioRef.current.currentTime = 0;
      }
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    }

    return () => {
      if (callerRingAudioRef.current) {
        callerRingAudioRef.current.pause();
        callerRingAudioRef.current.currentTime = 0;
      }
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    };
  }, [connecting, authenticated, endCall, ensureCallAudioElements]);

  // Stop all ringing audio when call is connected
  useEffect(() => {
    if (connected) {
      if (callerRingAudioRef.current) {
        callerRingAudioRef.current.pause();
        callerRingAudioRef.current.currentTime = 0;
      }
      if (calleeRingAudioRef.current) {
        calleeRingAudioRef.current.pause();
        calleeRingAudioRef.current.currentTime = 0;
      }
    }
  }, [connected]);

  const { receiver } = useMessage();

  // Fetch remote user data when incoming call changes
  useEffect(() => {
    const fetchRemoteUser = async () => {
      if (incomingCall?.from) {
        try {
          const response = await getUserByIdService(incomingCall.from);
          if (response?.data) {
            setFetchedRemoteUser(response.data as AuthorType);
          }
        } catch (error) {
          console.error('Error fetching remote user:', error);
        }
      }
    };

    fetchRemoteUser();
  }, [incomingCall?.from]);

  // Get the other person in the call (remote user)
  const remoteUser = useMemo(() => {
    if (fetchedRemoteUser) {
      return fetchedRemoteUser;
    }

    if (receiver) {
      return {
        _id: receiver.discordId || '',
        discordId: receiver.discordId || '',
        displayName: receiver.displayName || '',
        discordAvatar: receiver.discordAvatar || '',
        profileImage: receiver.profileImage || null,
        username: receiver.username || '',
        role: receiver.role || '',
      };
    }

    if (incomingCall) {
      return {
        _id: incomingCall.from || '',
        discordId: incomingCall.from || '',
        displayName: 'Unknown User',
        discordAvatar: '',
        profileImage: null,
        username: incomingCall.from || '',
        role: '',
      };
    }

    return {
      _id: '',
      discordId: '',
      displayName: 'Unknown User',
      discordAvatar: '',
      profileImage: null,
      username: '',
      role: '',
    };
  }, [fetchedRemoteUser, receiver, incomingCall]);

  // Reset seller queue confirmed flag when call goes idle
  useEffect(() => {
    const isCallActive = ringing || connecting || connected;
    if (!isCallActive) {
      sellerQueueConfirmedRef.current = false;
    }
  }, [ringing, connecting, connected]);

  // Compute if seller queue dialog should be open - derived directly, no race conditions
  // Dialog should show for sellers receiving video calls until they confirm
  const isSellerVideoCall =
    currentCallType === 'video' &&
    currentUser?.role === 'seller' &&
    (ringing || connecting || connected);

  // Force re-render when confirmation changes by using a state
  const [sellerQueueConfirmed, setSellerQueueConfirmed] = useState(false);

  const showSellerQueueDialog = isSellerVideoCall && !sellerQueueConfirmed;

  // Callback for when seller confirms the call
  const handleSellerQueueConfirm = useCallback(() => {
    sellerQueueConfirmedRef.current = true;
    setSellerQueueConfirmed(true);
  }, []);

  // Reset confirmation state when call goes idle
  useEffect(() => {
    const isCallActive = ringing || connecting || connected;
    if (!isCallActive && sellerQueueConfirmed) {
      setSellerQueueConfirmed(false);
    }
  }, [ringing, connecting, connected, sellerQueueConfirmed]);

  const handleAllowMicrophone = async () => {
    const granted = await requestMicrophonePermission();
    if (granted) {
      setRinging(true);
    }
  };

  // Drag handlers for desktop call container
  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Prevent dragging from buttons or interactive elements
      if (
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('a')
      ) {
        return;
      }

      setIsDragging(true);
      dragStartRef.current = {
        x: dragPosition.x,
        y: dragPosition.y,
        startX: e.clientX,
        startY: e.clientY,
      };

      e.preventDefault();
    },
    [dragPosition],
  );

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;

      setDragPosition({
        x: dragStartRef.current.x + deltaX,
        y: dragStartRef.current.y + deltaY,
      });
    },
    [isDragging],
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global mouse listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const isCallActive =
    authenticated &&
    (ringing || connecting || connected) &&
    !isCamsPreview &&
    !showSellerQueueDialog;

  // Reset drag position when going fullscreen or when call ends
  useEffect(() => {
    if (isFullScreen || !isCallActive) {
      setDragPosition({ x: 0, y: 0 });
    }
  }, [isFullScreen, isCallActive]);

  return (
    <>
      {/* Hidden audio elements for call audio routing */}
      <audio
        id="local_audio_element_id"
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
      <audio
        ref={remoteAudioRef}
        id="remote_audio_element_id"
        autoPlay
        playsInline
        style={{ display: 'none' }}
      >
        <track kind="captions" srcLang="en" label="English captions" />
      </audio>

      {/* Video elements for video call routing - legacy IDs */}
      <video
        id="local_video_element_id"
        autoPlay
        playsInline
        muted
        className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
      >
        <track kind="captions" srcLang="en" label="English captions" />
      </video>
      <video
        id="remote_video_element_id"
        autoPlay
        playsInline
        className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
      >
        <track kind="captions" srcLang="en" label="English captions" />
      </video>

      {/* Global video elements - streams are attached by context and persist across view changes */}
      <video
        id="global_local_video"
        autoPlay
        playsInline
        muted
        className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
      >
        <track kind="captions" srcLang="en" label="English captions" />
      </video>
      <video
        id="global_remote_video"
        autoPlay
        playsInline
        className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
      >
        <track kind="captions" srcLang="en" label="English captions" />
      </video>

      {/* Microphone Permission Dialog */}
      <MicrophonePermissionDialog
        open={showMicPermissionDialog}
        onAllow={handleAllowMicrophone}
        onCancel={handleMicPermissionCancel}
      />

      {/* Seller Queue Dialog for incoming video calls */}
      <CamsConnectQueueSellerDialog
        open={showSellerQueueDialog}
        onOpenChange={() => {
          // Dialog closing is handled internally - we only care about onConfirm
        }}
        onConfirm={handleSellerQueueConfirm}
        user={fetchedRemoteUser as unknown as UserType}
        isLoadingUser={!fetchedRemoteUser}
      />

      {isCallActive && (
        <div
          ref={callContainerRef}
          className={cn(
            'absolute md:top-0 inset-0 left-1/2 md:-translate-x-1/3 md:block hidden -translate-x-1/2 z-[999] h-full w-full transition-all duration-200',
            isFullScreen
              ? 'h-full w-full md:translate-x-0'
              : 'md:w-[515px] md:h-[350px] ',
            isDragging && 'cursor-grabbing',
            !isDragging && !isFullScreen && 'cursor-grab',
          )}
          style={{
            transform: isFullScreen
              ? 'translateX(-50%)'
              : `translate(calc(-33.333% + ${dragPosition.x}px), ${dragPosition.y}px)`,
          }}
          onMouseDown={!isFullScreen ? handleDragStart : undefined}
        >
          {/* Drag handle for desktop */}
          {!isFullScreen && (
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/40 to-transparent flex items-center justify-center z-50">
              <div className="w-10 h-1 bg-white/40 rounded-full" />
            </div>
          )}
          {authenticated &&
            ringing &&
            (currentCallType === 'video' ? (
              <CallVideoRinging caller={remoteUser} />
            ) : (
              <CallAudioRinging caller={remoteUser} />
            ))}
          {authenticated &&
            connecting &&
            (currentCallType === 'video' ? (
              <CallVideoConnecting
                isFullScreen={isFullScreen}
                setIsFullScreen={setIsFullScreen}
              />
            ) : (
              <CallAudioConnecting remoteUser={remoteUser} />
            ))}
          {authenticated &&
            connected &&
            (currentCallType === 'video' ? (
              <CallVideoConnected
                isFullScreen={isFullScreen}
                setIsFullScreen={setIsFullScreen}
                isPiPMode={isPiPMode}
                setIsPiPMode={setIsPiPMode}
              />
            ) : (
              <CallAudioConnected remoteUser={remoteUser} />
            ))}
        </div>
      )}

      <Sheet open={isCallActive && !isPiPMode} modal={false}>
        <SheetContent
          side="bottom"
          className="h-full w-full p-0 border-none md:hidden md:pointer-events-none"
        >
          <div className="h-full w-full bg-[#0A0A0B]">
            {authenticated &&
              ringing &&
              (currentCallType === 'video' ? (
                <CallVideoRinging caller={remoteUser} />
              ) : (
                <CallAudioRinging caller={remoteUser} />
              ))}
            {authenticated &&
              connecting &&
              (currentCallType === 'video' ? (
                <CallVideoConnecting
                  isFullScreen={isFullScreen}
                  setIsFullScreen={setIsFullScreen}
                />
              ) : (
                <CallAudioConnecting remoteUser={remoteUser} />
              ))}
            {authenticated &&
              connected &&
              (currentCallType === 'video' ? (
                <CallVideoConnected
                  isFullScreen={isFullScreen}
                  setIsFullScreen={setIsFullScreen}
                  isPiPMode={isPiPMode}
                  setIsPiPMode={setIsPiPMode}
                />
              ) : (
                <CallAudioConnected remoteUser={remoteUser} />
              ))}
          </div>
        </SheetContent>
      </Sheet>
      {/* PiP mode renders outside the Sheet */}
      {isPiPMode &&
        authenticated &&
        connected &&
        currentCallType === 'video' && (
          <CallVideoConnected
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
            isPiPMode={isPiPMode}
            setIsPiPMode={setIsPiPMode}
          />
        )}
    </>
  );
};

# Custom WebRTC Implementation Guide

## ✅ What's Been Created

### 1. WebRTC Hook (`hooks/use-webrtc.ts`)

Complete WebRTC implementation with:

- Peer connection management
- Media stream handling (audio/video)
- ICE candidate exchange
- Offer/Answer SDP exchange
- Call state management
- Toggle audio/video controls

## 🔌 Socket.IO Events (Backend Required)

Your backend needs to handle these events:

### Signaling Events:

```typescript
// Client → Server → Client
socket.on('webrtc:offer', (data) => {
  // Forward offer to recipient
  io.to(data.to).emit('webrtc:offer', {
    from: socket.userId,
    offer: data.offer,
    callType: data.callType,
  });
});

socket.on('webrtc:answer', (data) => {
  // Forward answer back to caller
  io.to(data.to).emit('webrtc:answer', {
    from: socket.userId,
    answer: data.answer,
  });
});

socket.on('webrtc:ice-candidate', (data) => {
  // Forward ICE candidate to peer
  io.to(data.to).emit('webrtc:ice-candidate', {
    from: socket.userId,
    candidate: data.candidate,
  });
});

socket.on('webrtc:end-call', (data) => {
  // Notify peer that call ended
  io.to(data.to).emit('webrtc:call-ended', {
    from: socket.userId,
  });
});
```

## 📋 Integration Steps

### Option 1: Integrate WebRTC into Existing Call Context

Update `/context/call-context.tsx`:

```typescript
import { useWebRTC } from '@/hooks/use-webrtc';

// In your CallContext:
const {
  localStream,
  remoteStream,
  isConnecting,
  isConnected,
  startCall,
  answerCall,
  endCall,
  handleAnswer,
  handleIceCandidate,
  toggleVideo,
  toggleAudio,
} = useWebRTC({
  onRemoteStream: (stream) => {
    // Attach to video element
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  },
  onCallConnected: () => {
    setCallState('connected');
  },
  onCallEnded: () => {
    setCallState('ended');
  },
  onCallFailed: (error) => {
    console.error('Call failed:', error);
    toast.error(error);
  },
});

// Listen for incoming WebRTC events
useEffect(() => {
  if (!socket) return;

  socket.on('webrtc:offer', async ({ from, offer, callType }) => {
    // Show incoming call UI
    setIncomingCall({ from, callType });
    // Store offer to answer later
    setPendingOffer(offer);
  });

  socket.on('webrtc:answer', ({ answer }) => {
    handleAnswer(answer);
  });

  socket.on('webrtc:ice-candidate', ({ candidate }) => {
    handleIceCandidate(candidate);
  });

  socket.on('webrtc:call-ended', () => {
    endCall();
  });

  return () => {
    socket.off('webrtc:offer');
    socket.off('webrtc:answer');
    socket.off('webrtc:ice-candidate');
    socket.off('webrtc:call-ended');
  };
}, [socket, handleAnswer, handleIceCandidate, endCall]);

// Start a call
const initiateCall = async (
  receiverId: string,
  callType: 'audio' | 'video',
) => {
  try {
    await startCall(receiverId, callType);
  } catch (error) {
    console.error('Failed to start call:', error);
  }
};

// Answer incoming call
const acceptCall = async () => {
  if (!pendingOffer) return;
  try {
    await answerCall(pendingOffer, incomingCall.callType);
    setIncomingCall(null);
    setPendingOffer(null);
  } catch (error) {
    console.error('Failed to answer call:', error);
  }
};
```

### Option 2: Create New WebRTC Call Component

```typescript
'use client';

import { useWebRTC } from '@/hooks/use-webrtc';
import { useSocket } from '@/context/socket-context';
import { useEffect, useRef, useState } from 'react';

export const WebRTCCall = ({ calleeId, callType }: {
  calleeId: string;
  callType: 'audio' | 'video'
}) => {
  const { socket } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    localStream,
    remoteStream,
    isConnecting,
    isConnected,
    startCall,
    answerCall,
    endCall,
    handleAnswer,
    handleIceCandidate,
    toggleVideo,
    toggleAudio,
  } = useWebRTC({
    onRemoteStream: (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    },
  });

  // Attach local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('webrtc:answer', ({ answer }) => handleAnswer(answer));
    socket.on('webrtc:ice-candidate', ({ candidate }) => handleIceCandidate(candidate));
    socket.on('webrtc:call-ended', endCall);

    return () => {
      socket.off('webrtc:answer');
      socket.off('webrtc:ice-candidate');
      socket.off('webrtc:call-ended');
    };
  }, [socket, handleAnswer, handleIceCandidate, endCall]);

  return (
    <div className="relative h-screen bg-black">
      {/* Remote video (fullscreen) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Local video (pip) */}
      {callType === 'video' && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-4 right-4 w-32 h-24 rounded-lg border-2 border-white"
        />
      )}

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button onClick={() => toggleAudio(false)}>Mute</button>
        <button onClick={() => toggleVideo(false)}>Video Off</button>
        <button onClick={endCall} className="bg-red-500">End Call</button>
      </div>

      {/* Connection status */}
      {isConnecting && <div className="absolute top-4 left-4">Connecting...</div>}
      {isConnected && <div className="absolute top-4 left-4 text-green-500">Connected</div>}
    </div>
  );
};
```

## 🎯 Key Benefits

1. **No Third-Party Fees**: Completely free (except STUN/TURN servers)
2. **Full Control**: Customize everything
3. **Privacy**: Your data never touches third-party servers
4. **Already Integrated**: Uses your existing Socket.IO infrastructure

## 🔧 STUN/TURN Server Configuration

Currently using free Google STUN servers. For production, you may want to add TURN servers:

```typescript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password',
    },
  ],
};
```

### Free TURN Server Options:

- **Twilio TURN** (has free tier)
- **Self-hosted Coturn** (open source)
- **Metered.ca** (250GB/month free)

## 📊 SendBird Removal Complete

The following have been removed:

- `sendbird-calls` package dependency
- SendBird initialization and authentication code from call-context.tsx
- All SendBird-specific event handlers and logic

## 🚀 Next Steps

1. Update backend to handle WebRTC signaling events
2. Test with 2 users in local network
3. Add TURN server for production (handles ~10% of calls that need it)
4. Remove SendBird dependency
5. Add call quality monitoring/analytics

## 💡 Testing

Test locally:

```bash
# Terminal 1 - User A
npm run dev

# Terminal 2 - User B (different browser or incognito)
# Navigate to same localhostOpen two browser windows and test calls!
```

## Need Help?

The WebRTC hook is ready to use! Just need to:

1. Wire up the socket events on backend
2. Integrate into your call context or create new component
3. Test!

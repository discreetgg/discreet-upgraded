/**
 * Backend Socket.IO Event Handlers for WebRTC Signaling
 * 
 * Add these event handlers to your Socket.IO server
 * File: backend/src/socket/handlers/webrtc.ts (or similar)
 */

import { Server as SocketIOServer, Socket } from 'socket.io';

export const registerWebRTCHandlers = (io: SocketIOServer, socket: Socket) => {
    const userId = socket.data.userId || socket.handshake.query.discordId;

    /**
     * Handle WebRTC offer from caller to callee
     * Forwards the offer to the recipient
     */
    socket.on('webrtc:offer', (data: {
        to: string;
        offer: RTCSessionDescriptionInit;
        callType: 'audio' | 'video';
    }) => {
        console.log(`[WebRTC] Offer from ${userId} to ${data.to}`);

        // Forward offer to the recipient
        io.to(data.to).emit('webrtc:offer', {
            from: userId,
            offer: data.offer,
            callType: data.callType,
        });
    });

    /**
     * Handle WebRTC answer from callee back to caller
     * Forwards the answer to the original caller
     */
    socket.on('webrtc:answer', (data: {
        to?: string;
        answer: RTCSessionDescriptionInit;
    }) => {
        console.log(`[WebRTC] Answer from ${userId}`);

        // If 'to' is provided, use it; otherwise might need to track caller
        if (data.to) {
            io.to(data.to).emit('webrtc:answer', {
                from: userId,
                answer: data.answer,
            });
        }
    });

    /**
     * Handle ICE candidate exchange
     * Forwards ICE candidates between peers for connection establishment
     */
    socket.on('webrtc:ice-candidate', (data: {
        to?: string;
        candidate: RTCIceCandidateInit;
    }) => {
        console.log(`[WebRTC] ICE candidate from ${userId}`);

        if (data.to) {
            io.to(data.to).emit('webrtc:ice-candidate', {
                from: userId,
                candidate: data.candidate,
            });
        }
    });

    /**
     * Handle call end notification
     * Notifies the other peer that the call has ended
     */
    socket.on('webrtc:end-call', (data?: { to?: string }) => {
        console.log(`[WebRTC] Call ended by ${userId}`);

        if (data?.to) {
            io.to(data.to).emit('webrtc:call-ended', {
                from: userId,
            });
        }
    });

    /**
     * Optional: Handle call rejection
     */
    socket.on('webrtc:reject-call', (data: { to: string }) => {
        console.log(`[WebRTC] Call rejected by ${userId}`);

        io.to(data.to).emit('webrtc:call-rejected', {
            from: userId,
        });
    });
};

/**
 * Alternative: Room-based approach (more scalable)
 * Creates a dedicated room for each call
 */
export const registerWebRTCHandlersWithRooms = (io: SocketIOServer, socket: Socket) => {
    const userId = socket.data.userId || socket.handshake.query.discordId;

    /**
     * Join a call room
     */
    socket.on('webrtc:join-room', (data: { roomId: string }) => {
        socket.join(data.roomId);
        console.log(`[WebRTC] ${userId} joined room ${data.roomId}`);

        // Notify others in the room
        socket.to(data.roomId).emit('webrtc:peer-joined', {
            userId: userId,
        });
    });

    /**
     * Leave a call room
     */
    socket.on('webrtc:leave-room', (data: { roomId: string }) => {
        socket.leave(data.roomId);
        console.log(`[WebRTC] ${userId} left room ${data.roomId}`);

        // Notify others in the room
        socket.to(data.roomId).emit('webrtc:peer-left', {
            userId: userId,
        });
    });

    /**
     * Forward signaling messages within a room
     */
    socket.on('webrtc:signal', (data: {
        roomId: string;
        signal: any;
        type: 'offer' | 'answer' | 'ice-candidate';
    }) => {
        // Broadcast to all others in the room
        socket.to(data.roomId).emit('webrtc:signal', {
            from: userId,
            signal: data.signal,
            type: data.type,
        });
    });
};

/**
 * Example Express/Socket.IO server setup
 */
/*
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerWebRTCHandlers } from './handlers/webrtc';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Register WebRTC handlers
  registerWebRTCHandlers(io, socket);
  
  // ... other handlers
});

httpServer.listen(3001, () => {
  console.log('Socket.IO server running on port 3001');
});
*/

/**
 * Testing with curl/websocat:
 * 
 * # Install websocat
 * brew install websocat
 * 
 * # Connect to socket server
 * websocat "wss://api.discreet.fans/socket.io/?discordId=test123&transport=websocket"
 * 
 * # Send test offer
 * 42["webrtc:offer",{"to":"user456","offer":{"type":"offer","sdp":"..."},"callType":"video"}]
 */

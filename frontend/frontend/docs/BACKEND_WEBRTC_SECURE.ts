/**
 * SECURE WebRTC Socket.IO Handlers
 *
 * This is the production-ready, security-hardened version
 * Implements all security best practices from the audit
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import Joi from 'joi';

// Types
interface CallSession {
  sessionId: string;
  caller: string;
  callee: string;
  startTime: number;
  status: 'ringing' | 'connected' | 'ended';
}

// In-memory stores (use Redis in production)
const activeCalls = new Map<string, CallSession>();
const callAttempts = new Map<string, number[]>();

// Validation schemas
const sdpSchema = Joi.object({
  type: Joi.string().valid('offer', 'answer').required(),
  sdp: Joi.string().required().max(100000),
});

const iceCandidateSchema = Joi.object({
  candidate: Joi.string().required().max(1000),
  sdpMid: Joi.string().allow(null, ''),
  sdpMLineIndex: Joi.number().allow(null),
});

/**
 * Check if user can call another user
 * Implement your business logic here
 */
async function canUserCall(
  callerId: string,
  calleeId: string,
  db: any, // Your database instance
): Promise<boolean> {
  try {
    // Check if callee has blocked caller
    const isBlocked = await db.blocks.exists({
      blocker: calleeId,
      blocked: callerId,
    });
    if (isBlocked) return false;

    // Check caller's call privacy settings
    const calleeSettings = await db.users.findOne({
      _id: calleeId,
      select: 'callPrivacy',
    });

    switch (calleeSettings?.callPrivacy) {
      case 'no_one':
        return false;

      case 'following':
        // Callee must be following caller
        return await db.follows.exists({
          follower: calleeId,
          following: callerId,
        });

      case 'mutual':
        // Must be mutual followers
        const [follows, followedBy] = await Promise.all([
          db.follows.exists({ follower: calleeId, following: callerId }),
          db.follows.exists({ follower: callerId, following: calleeId }),
        ]);
        return follows && followedBy;

      case 'everyone':
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking call permission:', error);
    return false;
  }
}

/**
 * Rate limiting check
 */
function checkRateLimit(
  userId: string,
  maxCalls = 5,
  windowMs = 60000,
): boolean {
  const now = Date.now();
  const attempts = callAttempts.get(userId) || [];

  // Keep only recent attempts
  const recentAttempts = attempts.filter((time) => now - time < windowMs);

  if (recentAttempts.length >= maxCalls) {
    return false;
  }

  recentAttempts.push(now);
  callAttempts.set(userId, recentAttempts);
  return true;
}

/**
 * Create call session
 */
function createCallSession(caller: string, callee: string): string {
  const sessionId = `${caller}_${callee}_${Date.now()}`;
  activeCalls.set(sessionId, {
    sessionId,
    caller,
    callee,
    startTime: Date.now(),
    status: 'ringing',
  });
  return sessionId;
}

/**
 * Find socket by user ID
 */
function findSocketByUserId(io: SocketIOServer, userId: string): string | null {
  const sockets = io.sockets.sockets;
  for (const [socketId, socket] of sockets) {
    if (socket.data.userId === userId) {
      return socketId;
    }
  }
  return null;
}

/**
 * Secure WebRTC event handlers
 */
export const registerSecureWebRTCHandlers = (
  io: SocketIOServer,
  socket: Socket,
  db: any, // Your database instance
) => {
  // Get authenticated user ID from session (NOT from client!)
  const userId = socket.data.userId;

  if (!userId) {
    console.error('Socket connected without authentication');
    socket.disconnect();
    return;
  }

  /**
   * Handle call offer with full security checks
   */
  socket.on(
    'webrtc:offer',
    async (data: {
      to: string;
      offer: RTCSessionDescriptionInit;
      callType: 'audio' | 'video';
    }) => {
      try {
        // 1. Rate limiting
        if (!checkRateLimit(userId)) {
          return socket.emit('webrtc:error', {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many call attempts. Please wait before trying again.',
          });
        }

        // 2. Validate input
        const { error: offerError } = sdpSchema.validate(data.offer);
        if (offerError) {
          return socket.emit('webrtc:error', {
            code: 'INVALID_OFFER',
            message: 'Invalid call offer format',
          });
        }

        // 3. Check if callee exists and is online
        const calleeSocketId = findSocketByUserId(io, data.to);
        if (!calleeSocketId) {
          return socket.emit('webrtc:error', {
            code: 'USER_UNAVAILABLE',
            message: 'User is not available for calls',
          });
        }

        // 4. Authorization check
        const hasPermission = await canUserCall(userId, data.to, db);
        if (!hasPermission) {
          // Log unauthorized attempt
          await db.callLogs.insert({
            caller: userId,
            callee: data.to,
            status: 'unauthorized',
            timestamp: new Date(),
          });

          return socket.emit('webrtc:error', {
            code: 'CALL_NOT_ALLOWED',
            message: 'You are not authorized to call this user',
          });
        }

        // 5. Check if either user is already in a call
        const existingCall = Array.from(activeCalls.values()).find(
          (call) =>
            (call.caller === userId ||
              call.callee === userId ||
              call.caller === data.to ||
              call.callee === data.to) &&
            call.status !== 'ended',
        );

        if (existingCall) {
          return socket.emit('webrtc:error', {
            code: 'USER_BUSY',
            message: 'User is currently in another call',
          });
        }

        // 6. Create call session
        const sessionId = createCallSession(userId, data.to);

        // 7. Forward offer to callee
        io.to(calleeSocketId).emit('webrtc:offer', {
          from: userId,
          offer: data.offer,
          callType: data.callType,
          sessionId,
        });

        // 8. Log call attempt
        await db.callLogs.insert({
          sessionId,
          caller: userId,
          callee: data.to,
          callType: data.callType,
          status: 'initiated',
          timestamp: new Date(),
        });

        console.log(
          `[WebRTC] Call offer from ${userId} to ${data.to} (session: ${sessionId})`,
        );
      } catch (error) {
        console.error('[WebRTC] Error handling offer:', error);
        socket.emit('webrtc:error', {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process call offer',
        });
      }
    },
  );

  /**
   * Handle call answer with session validation
   */
  socket.on(
    'webrtc:answer',
    async (data: { sessionId: string; answer: RTCSessionDescriptionInit }) => {
      try {
        // 1. Validate input
        const { error: answerError } = sdpSchema.validate(data.answer);
        if (answerError) {
          return socket.emit('webrtc:error', {
            code: 'INVALID_ANSWER',
            message: 'Invalid call answer format',
          });
        }

        // 2. Validate session
        const session = activeCalls.get(data.sessionId);
        if (!session) {
          return socket.emit('webrtc:error', {
            code: 'INVALID_SESSION',
            message: 'Invalid or expired call session',
          });
        }

        // 3. Verify user is the callee
        if (session.callee !== userId) {
          return socket.emit('webrtc:error', {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to answer this call',
          });
        }

        // 4. Update session status
        session.status = 'connected';

        // 5. Forward answer to caller
        const callerSocketId = findSocketByUserId(io, session.caller);
        if (callerSocketId) {
          io.to(callerSocketId).emit('webrtc:answer', {
            from: userId,
            answer: data.answer,
            sessionId: data.sessionId,
          });
        }

        // 6. Log call connected
        await db.callLogs.updateOne(
          { sessionId: data.sessionId },
          {
            $set: {
              status: 'connected',
              connectedAt: new Date(),
            },
          },
        );

        console.log(`[WebRTC] Call answered for session ${data.sessionId}`);
      } catch (error) {
        console.error('[WebRTC] Error handling answer:', error);
        socket.emit('webrtc:error', {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process call answer',
        });
      }
    },
  );

  /**
   * Handle ICE candidate with validation
   */
  socket.on(
    'webrtc:ice-candidate',
    async (data: {
      sessionId: string;
      candidate: RTCIceCandidateInit;
      to: string;
    }) => {
      try {
        // 1. Validate ICE candidate
        const { error } = iceCandidateSchema.validate(data.candidate);
        if (error) {
          return socket.emit('webrtc:error', {
            code: 'INVALID_CANDIDATE',
            message: 'Invalid ICE candidate format',
          });
        }

        // 2. Validate session
        const session = activeCalls.get(data.sessionId);
        if (!session) {
          return; // Silently ignore invalid sessions for ICE candidates
        }

        // 3. Verify user is part of this call
        if (session.caller !== userId && session.callee !== userId) {
          return;
        }

        // 4. Forward to peer
        const peerSocketId = findSocketByUserId(io, data.to);
        if (peerSocketId) {
          io.to(peerSocketId).emit('webrtc:ice-candidate', {
            from: userId,
            candidate: data.candidate,
            sessionId: data.sessionId,
          });
        }
      } catch (error) {
        console.error('[WebRTC] Error handling ICE candidate:', error);
      }
    },
  );

  /**
   * Handle call end
   */
  socket.on('webrtc:end-call', async (data: { sessionId: string }) => {
    try {
      const session = activeCalls.get(data.sessionId);
      if (!session) return;

      // Verify user is part of this call
      if (session.caller !== userId && session.callee !== userId) {
        return;
      }

      // Update session
      session.status = 'ended';
      const duration = Date.now() - session.startTime;

      // Notify peer
      const peerId =
        session.caller === userId ? session.callee : session.caller;
      const peerSocketId = findSocketByUserId(io, peerId);
      if (peerSocketId) {
        io.to(peerSocketId).emit('webrtc:call-ended', {
          from: userId,
          sessionId: data.sessionId,
        });
      }

      // Log call end
      await db.callLogs.updateOne(
        { sessionId: data.sessionId },
        {
          $set: {
            status: 'completed',
            endedAt: new Date(),
            duration,
          },
        },
      );

      // Clean up session after 30 seconds
      setTimeout(() => {
        activeCalls.delete(data.sessionId);
      }, 30000);

      console.log(
        `[WebRTC] Call ended - session ${data.sessionId}, duration: ${duration}ms`,
      );
    } catch (error) {
      console.error('[WebRTC] Error ending call:', error);
    }
  });

  /**
   * Handle mute state change
   * Forwards mute notification to the remote peer
   */
  socket.on('call:mute', (data: { to: string; isMuted: boolean }) => {
    try {
      const peerSocketId = findSocketByUserId(io, data.to);
      if (peerSocketId) {
        io.to(peerSocketId).emit('call:mute', {
          from: userId,
          isMuted: data.isMuted,
        });
      }
      console.log(
        `[WebRTC] Mute state from ${userId} to ${data.to}: ${data.isMuted}`,
      );
    } catch (error) {
      console.error('[WebRTC] Error forwarding mute state:', error);
    }
  });

  /**
   * Handle video state change
   * Forwards video off notification to the remote peer
   */
  socket.on('call:video', (data: { to: string; isVideoOff: boolean }) => {
    try {
      const peerSocketId = findSocketByUserId(io, data.to);
      if (peerSocketId) {
        io.to(peerSocketId).emit('call:video', {
          from: userId,
          isVideoOff: data.isVideoOff,
        });
      }
      console.log(
        `[WebRTC] Video state from ${userId} to ${data.to}: ${data.isVideoOff}`,
      );
    } catch (error) {
      console.error('[WebRTC] Error forwarding video state:', error);
    }
  });

  /**
   * Handle call rejection
   */
  socket.on('webrtc:reject-call', async (data: { sessionId: string }) => {
    try {
      const session = activeCalls.get(data.sessionId);
      if (!session) return;

      // Verify user is the callee
      if (session.callee !== userId) return;

      // Notify caller
      const callerSocketId = findSocketByUserId(io, session.caller);
      if (callerSocketId) {
        io.to(callerSocketId).emit('webrtc:call-rejected', {
          from: userId,
          sessionId: data.sessionId,
        });
      }

      // Log rejection
      await db.callLogs.updateOne(
        { sessionId: data.sessionId },
        {
          $set: {
            status: 'rejected',
            rejectedAt: new Date(),
          },
        },
      );

      // Clean up session
      activeCalls.delete(data.sessionId);

      console.log(`[WebRTC] Call rejected - session ${data.sessionId}`);
    } catch (error) {
      console.error('[WebRTC] Error rejecting call:', error);
    }
  });

  /**
   * Clean up on disconnect
   */
  socket.on('disconnect', async () => {
    // End any active calls for this user
    const userCalls = Array.from(activeCalls.values()).filter(
      (call) =>
        (call.caller === userId || call.callee === userId) &&
        call.status !== 'ended',
    );

    for (const call of userCalls) {
      call.status = 'ended';

      // Notify peer
      const peerId = call.caller === userId ? call.callee : call.caller;
      const peerSocketId = findSocketByUserId(io, peerId);
      if (peerSocketId) {
        io.to(peerSocketId).emit('webrtc:call-ended', {
          from: userId,
          sessionId: call.sessionId,
          reason: 'disconnect',
        });
      }

      // Log disconnect
      await db.callLogs.updateOne(
        { sessionId: call.sessionId },
        {
          $set: {
            status: 'disconnected',
            endedAt: new Date(),
          },
        },
      );

      activeCalls.delete(call.sessionId);
    }

    console.log(
      `[WebRTC] User ${userId} disconnected, ${userCalls.length} calls ended`,
    );
  });
};

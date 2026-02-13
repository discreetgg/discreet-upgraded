import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageWithoutMediaDto } from './dto/create-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Message,
  MessageStatus,
  CallStatus,
} from 'src/database/schemas/message.schema';
import { Payment, PaymentType } from 'src/database/schemas/payment.schema';
import { CallSessionDto } from './dto/call.dto';
import { User } from 'src/database/schemas/user.schema';
import { PaymentService } from 'src/payment/payment.service';
import { forwardRef, Inject, Logger, UseFilters } from '@nestjs/common';
import { WsAllExceptionsFilter } from './filters/ws-exception.filter';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';
import { randomUUID } from 'crypto';

const WS_CORS_ORIGINS: Array<string | RegExp> = [
  'https://discreet-mocha.vercel.app',
  'https://www.discreet.gg',
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https:\/\/.*\.?discreet\.fan$/,
  /^https:\/\/.*\.?discreet\.fans$/,
  /^https:\/\/.*\.?discreet\.gg$/,
];

const extraWsOrigins = (process.env.WS_CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
WS_CORS_ORIGINS.push(...extraWsOrigins);

const PRESENCE_USERS_KEY = 'presence:users';
const WAITROOM_LOCK_TTL_SECONDS = 6 * 60;

@UseFilters(WsAllExceptionsFilter)
@WebSocketGateway({
  cors: {
    origin: WS_CORS_ORIGINS,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly instanceId = randomUUID();

  // Map userId -> socketId[]
  private onlineUsers = new Map<string, Set<string>>();

  // Map callId -> Timeout (waitroom)
  private callWaitRoomTimeouts = new Map<string, NodeJS.Timeout>();
  private callWaitRoomLockTokens = new Map<string, string>();
  // Map callId -> Interval (billing)
  private callBillingIntervals = new Map<string, NodeJS.Timeout>();
  private callBillingLockTokens = new Map<string, string>();

  constructor(
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  private getClientDiscordId(client: Socket): string {
    const discordId = client.data.discordId;
    if (!discordId || typeof discordId !== 'string') {
      throw new WsException('Unauthorized socket');
    }
    return discordId;
  }

  private getClientUserId(client: Socket): string {
    const userId = client.data.userId;
    if (!userId || typeof userId !== 'string') {
      throw new WsException('Unauthorized socket');
    }
    return userId;
  }

  private getTokenFromCookieHeader(cookieHeader?: string): string | null {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';');
    for (const part of cookies) {
      const [rawKey, ...rawValue] = part.trim().split('=');
      if (rawKey === 'auth_token') {
        return decodeURIComponent(rawValue.join('='));
      }
    }
    return null;
  }

  private extractSocketToken(client: Socket): string | null {
    const cookieToken = this.getTokenFromCookieHeader(
      client.handshake.headers?.cookie,
    );
    if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
      return cookieToken;
    }

    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.trim().length > 0) {
      return queryToken.replace(/^Bearer\s+/i, '');
    }

    const authorizationHeader = client.handshake.headers?.authorization;
    if (
      typeof authorizationHeader === 'string' &&
      authorizationHeader.trim().length > 0
    ) {
      return authorizationHeader.replace(/^Bearer\s+/i, '');
    }
    return null;
  }

  private getUserSocketKey(discordId: string): string {
    return `presence:user:${discordId}:sockets`;
  }

  private getWaitroomLockKey(callId: string): string {
    return `lock:call:${callId}:waitroom`;
  }

  private getBillingLockKey(callId: string): string {
    return `lock:call:${callId}:billing`;
  }

  private async listOnlineUsers(): Promise<string[]> {
    if (this.redisService.isConnected()) {
      return this.redisService.smembers(PRESENCE_USERS_KEY);
    }
    return Array.from(this.onlineUsers.keys());
  }

  private async registerOnlineSocket(
    discordId: string,
    socketId: string,
  ): Promise<boolean> {
    if (this.redisService.isConnected()) {
      const userSocketKey = this.getUserSocketKey(discordId);
      await this.redisService.sadd(userSocketKey, socketId);
      await this.redisService.expire(userSocketKey, 24 * 60 * 60);
      const totalSockets = await this.redisService.scard(userSocketKey);
      await this.redisService.sadd(PRESENCE_USERS_KEY, discordId);
      return totalSockets === 1;
    }

    let sockets = this.onlineUsers.get(discordId);
    if (!sockets) {
      sockets = new Set<string>();
      this.onlineUsers.set(discordId, sockets);
    }
    const wasOffline = sockets.size === 0;
    sockets.add(socketId);
    return wasOffline;
  }

  private async unregisterOnlineSocket(
    discordId: string,
    socketId: string,
  ): Promise<boolean> {
    if (this.redisService.isConnected()) {
      const userSocketKey = this.getUserSocketKey(discordId);
      await this.redisService.srem(userSocketKey, socketId);
      const remainingSockets = await this.redisService.scard(userSocketKey);
      if (remainingSockets === 0) {
        await this.redisService.del(userSocketKey);
        await this.redisService.srem(PRESENCE_USERS_KEY, discordId);
        return true;
      }
      return false;
    }

    const userSockets = this.onlineUsers.get(discordId);
    if (!userSockets) return false;

    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      this.onlineUsers.delete(discordId);
      return true;
    }
    return false;
  }

  private async tryAcquireLock(
    key: string,
    token: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (!this.redisService.isConnected()) return true;
    return this.redisService.setIfNotExists(key, token, ttlSeconds);
  }

  private async releaseLock(key: string): Promise<void> {
    if (!this.redisService.isConnected()) return;
    await this.redisService.del(key);
  }

  private async clearWaitroomTimer(callId: string): Promise<void> {
    const timeout = this.callWaitRoomTimeouts.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      this.callWaitRoomTimeouts.delete(callId);
    }
    this.callWaitRoomLockTokens.delete(callId);
    await this.releaseLock(this.getWaitroomLockKey(callId));
  }

  private async clearBillingTimer(
    callId: string,
    releaseDistributedLock = true,
  ): Promise<void> {
    const interval = this.callBillingIntervals.get(callId);
    if (interval) {
      clearInterval(interval);
      this.callBillingIntervals.delete(callId);
    }
    this.callBillingLockTokens.delete(callId);
    if (releaseDistributedLock) {
      await this.releaseLock(this.getBillingLockKey(callId));
    }
  }

  async handleConnection(client: Socket) {
    const token = this.extractSocketToken(client);
    if (!token) {
      client.emit('error', { message: 'Unauthorized socket' });
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        userId: string;
      }>(token, {
        secret: process.env.JWT_SECRET,
      });

      if (!payload?.sub || !payload?.userId) {
        throw new WsException('Invalid authentication payload');
      }

      const claimedDiscordId = client.handshake.query.discordId;
      if (
        typeof claimedDiscordId === 'string' &&
        claimedDiscordId &&
        claimedDiscordId !== payload.sub
      ) {
        throw new WsException('Socket identity mismatch');
      }

      client.data.discordId = payload.sub;
      client.data.userId = payload.userId;
      client.join(`user:${payload.sub}`);

      const becameOnline = await this.registerOnlineSocket(
        payload.sub,
        client.id,
      );
      if (becameOnline) {
        this.server.emit('user:online', payload.sub);
      }

      client.emit('users:online', await this.listOnlineUsers());

      this.logger.log(`User ${payload.sub} connected with socket ${client.id}`);
    } catch (error) {
      this.logger.warn(`Rejected socket connection ${client.id}: ${error}`);
      client.emit('error', { message: 'Unauthorized socket' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.discordId;
    if (!userId || typeof userId !== 'string') return;

    const becameOffline = await this.unregisterOnlineSocket(userId, client.id);
    if (becameOffline) {
      this.server.emit('user:offline', userId);
    }

    this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
  }

  @SubscribeMessage('message:send')
  async onMessageSend(
    @MessageBody() data: CreateMessageWithoutMediaDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getClientDiscordId(client);
    if (data.sender && data.sender !== userId) {
      throw new WsException('Sender mismatch');
    }

    const saved = await this.chatService.sendMessage(userId, data);
    this.server.to(`user:${data.reciever}`).emit('message:new', saved);

    //only the sender can recivere this
    client.emit('message:ack', {
      message: saved,
      status: MessageStatus.SENT,
      success: true,
    });
    return saved;
  }

  // @SubscribeMessage('message:send-with-media')
  // async handleSendMessageWithMedia(
  //   @MessageBody() data: { messageId: string },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const message = await this.messageModel
  //     .findById(data.messageId)
  //     .populate<{ reciever: { discordId: string } }>('reciever', 'discordId');

  //   if (message && message.reciever?.discordId) {
  //     this.server
  //       .to(`user:${message.reciever?.discordId}`)
  //       .emit('message:new', message);

  //     //only the sender can reciever this
  //     client.emit('message:ack', {
  //       message: message,
  //       status: MessageStatus.SENT,
  //       success: true,
  //     });
  //     return message;
  //   }
  // }

  @SubscribeMessage('message:send-with-media')
  async handleSendMessageWithMedia(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messageModel
      .findById(data.messageId)
      .populate([
        {
          path: 'sender',
          select: 'discordId',
        },
        {
          path: 'reciever',
          select: 'discordId',
        },
        {
          path: 'media',
        },
      ])
      .lean<{
        sender?: { discordId?: string };
        reciever?: { discordId?: string };
        media?: any[];
      }>();

    const userId = this.getClientDiscordId(client);
    if (message?.sender?.discordId !== userId) {
      throw new WsException('Not authorized to publish this message');
    }

    if (!message?.reciever?.discordId) return;
    const sanitizedMessage = this.chatService.sanitizeMessageForClient(message);

    // send to receiver
    this.server
      .to(`user:${message.reciever.discordId}`)
      .emit('message:new', sanitizedMessage);

    // only the sender receives ack
    client.emit('message:ack', {
      message: sanitizedMessage,
      status: MessageStatus.SENT,
      success: true,
    });

    return sanitizedMessage;
  }

  async handleSendMenuMessage(data: { messageId: string }) {
    const message = await this.messageModel
      .findById(data.messageId)
      .populate<{ reciever: { discordId: string } }>('reciever', 'discordId');

    if (message && message.reciever?.discordId) {
      this.server
        .to(`user:${message.reciever?.discordId}`)
        .emit('message:new', message);

      return message;
    }
  }

  @SubscribeMessage('message:delivered')
  async handleDelivered(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getClientUserId(client);
    const message = await this.messageModel
      .findOneAndUpdate(
        { _id: data.messageId, reciever: userId },
        { status: MessageStatus.DELIVERED },
        { new: true },
      )
      .populate<{ sender: { discordId: string } }>('sender', 'discordId');

    if (message && message.sender?.discordId) {
      this.server
        .to(`user:${message.sender?.discordId}`)
        .emit('message:status', {
          messageId: data.messageId,
          status: message.status,
        });
      return;
    }
  }

  @SubscribeMessage('message:read')
  async handleRead(
    @MessageBody()
    data: {
      messageIds: string | string[];
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getClientUserId(client);
    if (!data?.messageIds) return;

    // Normalize to string[]
    const messageIds = Array.isArray(data.messageIds)
      ? data.messageIds
      : [data.messageIds];

    if (!messageIds.length) return;

    await this.messageModel.updateMany(
      {
        _id: { $in: messageIds },
        reciever: userId,
        status: { $ne: MessageStatus.READ },
      },
      { $set: { status: MessageStatus.READ } },
    );

    // Fetch updated messages
    const messages = await this.messageModel
      .find({
        _id: { $in: messageIds },
        reciever: userId,
        status: MessageStatus.READ,
      })
      .populate<{ sender: { discordId: string } }>('sender', 'discordId');

    // Emit updates to senders
    for (const message of messages) {
      if (!message?.sender?.discordId) continue;

      this.server
        .to(`user:${message.sender.discordId}`)
        .emit('message:status', {
          messageId: message._id.toString(),
          status: MessageStatus.READ,
        });
    }
  }
  // async handleRead(@MessageBody() data: { messageId: string }) {
  //   console.log('called here');
  //   console.log('messageId :', data);
  //   const message = await this.messageModel
  //     .findByIdAndUpdate(
  //       data.messageId,
  //       { status: MessageStatus.READ },
  //       { new: true },
  //     )
  //     .populate<{ sender: { discordId: string } }>('sender', 'discordId'); // cast type

  //   console.log('message :', message);
  //   if (message && message.sender?.discordId) {
  //     this.server
  //       .to(`user:${message.sender?.discordId}`)
  //       .emit('message:status', {
  //         messageId: data.messageId,
  //         status: message.status,
  //       });
  //     return;
  //   }
  // }

  @SubscribeMessage('typing')
  onTyping(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userId = this.getClientDiscordId(client);
    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('typing', { userId, isTyping: data.isTyping });
  }

  @SubscribeMessage('call:session')
  async onCallSession(
    @MessageBody() data: CallSessionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getClientDiscordId(client);
    if (data.callerId !== userId) {
      throw new WsException('Caller mismatch');
    }

    const call = await this.messageModel
      .findById(data.callId)
      .populate<{ sender: { discordId: string } }>('sender', 'discordId')
      .populate<{ reciever: { discordId: string } }>('reciever', 'discordId');
    if (!call) {
      throw new WsException('Call session does not exist');
    }

    if (call.sender?.discordId !== userId) {
      throw new WsException('Not authorized for this call');
    }
    if (call.reciever?.discordId !== data.calleeId) {
      throw new WsException('Callee mismatch');
    }
    if (
      call.callStatus === CallStatus.ENDED ||
      call.callStatus === CallStatus.MISSED ||
      call.callStatus === CallStatus.DECLINED
    ) {
      throw new WsException('Call has already ended');
    }

    const caller = await this.userModel.findOne({ discordId: userId });
    const callee = await this.userModel.findOne({
      discordId: data.calleeId,
    });
    const prevPaymentTx = await this.paymentModel.findOne({
      'meta.callId': data.callId,
    });

    if (!caller) {
      throw new WsException('Caller does not exist');
    }
    if (!callee) {
      throw new WsException('Callee does not exist');
    }
    const rateAmount = callee.callRate;
    const meta = {
      type: PaymentType.CALL_SESSION,
      fromUser: caller._id.toString(),
      toUser: callee._id.toString(),
      callId: call._id.toString(),
      callRate: callee.callRate,
      amount: rateAmount,
    };

    let previousPaymentId = null;
    if (prevPaymentTx) {
      previousPaymentId = prevPaymentTx._id.toString();
    }

    const resTx = await this.paymentService.reserveCallPayment(
      caller._id.toString(),
      rateAmount,
      meta,
      previousPaymentId,
      null,
    );

    //only the sender can recieve this
    client.emit('call:ack', {
      billTx: resTx,
      success: true,
    });
    return resTx;
  }

  async getOnlineUsers(): Promise<string[]> {
    return this.listOnlineUsers();
  }

  async emitToUser(userId: string, event: string, payload: any) {
    const user = await this.userModel.findById(userId);
    if (user) {
      this.server.to(`user:${user.discordId}`).emit(event, payload);
    }
  }

  @SubscribeMessage('call:offer')
  async onCallOffer(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getClientDiscordId(client);
    this.logger.log(`Call offer from ${userId} to ${data.to}`);

    try {
      // Create call session message
      const callMessage = await this.chatService.createCallSession({
        callerId: userId,
        calleeId: data.to,
        callType: data.callType,
      });

      this.server.to(`user:${data.to}`).emit('call:offer', {
        from: `${userId}`,
        offer: data.offer,
        conversationId: data.conversationId,
        callType: data.callType,
        callId: (callMessage as any)._id.toString(),
      });

      // Emit feedback to caller with callId
      client.emit('call:initiated', {
        callId: (callMessage as any)._id.toString(),
        status: callMessage.callStatus,
      });
    } catch (error) {
      this.logger.error('Failed to initiate call', error);
      client.emit('call:error', {
        message: error.message || 'Failed to initiate call',
      });
    }
  }

  @SubscribeMessage('call:answer')
  async onCallAnswer(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getClientDiscordId(client);
    this.logger.log(`Call answer from ${userId} to ${data.to}`);

    if (data.callId) {
      await this.chatService.markCallWaitroom(data.callId);

      const waitroomLockKey = this.getWaitroomLockKey(data.callId);
      const waitroomToken = `${this.instanceId}:${client.id}:${Date.now()}`;
      const acquired = await this.tryAcquireLock(
        waitroomLockKey,
        waitroomToken,
        WAITROOM_LOCK_TTL_SECONDS,
      );

      if (acquired) {
        this.callWaitRoomLockTokens.set(data.callId, waitroomToken);

        // Start 5-minute waitroom timeout
        const timeout = setTimeout(
          async () => {
            try {
              if (this.redisService.isConnected()) {
                const lockOwned = await this.redisService.compareAndDelete(
                  waitroomLockKey,
                  waitroomToken,
                );
                if (!lockOwned) return;
              }

              this.callWaitRoomLockTokens.delete(data.callId);
              this.callWaitRoomTimeouts.delete(data.callId);
              this.logger.log(`Waitroom timeout for call ${data.callId}`);
              await this.handleAutomaticCallEnd(
                data.callId,
                'Waitroom timeout',
              );
            } catch (error) {
              this.logger.error('Waitroom timeout handler failed', error);
            }
          },
          5 * 60 * 1000,
        );

        this.callWaitRoomTimeouts.set(data.callId, timeout);
      } else {
        this.logger.log(
          `Waitroom timer already owned by another instance for call ${data.callId}`,
        );
      }
    }

    this.server.to(`user:${data.to}`).emit('call:answer', {
      from: `${userId}`,
      answer: data.answer,
      conversationId: data.conversationId,
      callId: data.callId,
    });
  }

  @SubscribeMessage('call:start-billing')
  async onStartCallBilling(
    @MessageBody() data: { callId: string; callerId: string; calleeId: string },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getClientDiscordId(client);
    this.logger.log(`Starting billing for call ${data.callId} by ${userId}`);

    // Cancel waitroom timeout
    await this.clearWaitroomTimer(data.callId);

    try {
      const call = await this.messageModel
        .findById(data.callId)
        .populate<{ sender: { discordId: string } }>('sender', 'discordId')
        .populate<{ reciever: { discordId: string } }>('reciever', 'discordId');
      if (!call?.sender?.discordId || !call?.reciever?.discordId) {
        throw new WsException('Call session not found');
      }

      const callerId = call.sender.discordId;
      const calleeId = call.reciever.discordId;
      const isParticipant = userId === callerId || userId === calleeId;
      if (!isParticipant) {
        throw new WsException('Not authorized for this call');
      }

      await this.chatService.markCallOngoingForParticipant(data.callId, userId);

      // Notify both parties
      this.server
        .to(`user:${callerId}`)
        .to(`user:${calleeId}`)
        .emit('call:ongoing', {
          callId: data.callId,
        });
    } catch (error) {
      this.logger.error('Failed to start billing', error);
    }
  }

  private async handleAutomaticCallEnd(callId: string, reason: string) {
    const call = await this.messageModel
      .findById(callId)
      .populate('sender reciever');
    if (!call) return;

    const caller = call.sender as any;
    const callee = call.reciever as any;

    const normalizedReason = reason.toLowerCase();
    const isWaitroomTimeout = normalizedReason.includes('waitroom timeout');
    const callStatus = isWaitroomTimeout ? CallStatus.MISSED : CallStatus.ENDED;

    try {
      await this.chatService.endCall({
        callId,
        callerId: caller.discordId,
        calleeId: callee.discordId,
        callStatus,
      });

      this.server
        .to(`user:${caller.discordId}`)
        .to(`user:${callee.discordId}`)
        .emit('call:end', {
          callId,
          reason,
        });
    } finally {
      await this.cleanupCall(callId);
    }
  }

  private async cleanupCall(callId: string) {
    await this.clearWaitroomTimer(callId);
    await this.clearBillingTimer(callId);
  }

  @SubscribeMessage('call:ice')
  async onCallIce(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userId = this.getClientDiscordId(client);
    // console.log(`ICE candidate from ${userId} to ${data.to}`);

    this.server.to(`user:${data.to}`).emit('call:ice', {
      from: `${userId}`,
      candidate: data.candidate,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('call:end')
  async onCallEnd(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userId = this.getClientDiscordId(client);
    this.logger.log(`Call ended by ${userId} for ${data.to}`);

    if (data.callId) {
      await this.cleanupCall(data.callId);
      const call = await this.messageModel
        .findById(data.callId)
        .populate<{ sender: { discordId: string } }>('sender', 'discordId')
        .populate<{ reciever: { discordId: string } }>('reciever', 'discordId');
      if (!call?.sender?.discordId || !call?.reciever?.discordId) {
        throw new WsException('Call session does not exist');
      }
      const callerId = call.sender.discordId;
      const calleeId = call.reciever.discordId;
      if (userId !== callerId && userId !== calleeId) {
        throw new WsException('Not authorized for this call');
      }

      await this.chatService.endCall({
        callId: data.callId,
        callerId,
        calleeId,
        callStatus: data.callStatus || CallStatus.ENDED,
        duration: data.duration,
      });
    }

    this.server.to(`user:${data.to}`).emit('call:end', {
      from: `${userId}`,
      reason: data.reason,
      conversationId: data.conversationId,
      callId: data.callId,
    });
  }

  @SubscribeMessage('call:ringing')
  async onCallRinging(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getClientDiscordId(client);
    this.logger.log(`Call ringing from ${userId} to ${data.to}`);

    this.server.to(`user:${data.to}`).emit('call:ringing', {
      from: `${userId}`,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: { timestamp?: number }) {
    return {
      ok: true,
      timestamp: Date.now(),
      clientTimestamp: data?.timestamp ?? null,
    };
  }
}

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
import { forwardRef, Inject, UseFilters } from '@nestjs/common';
import { WsAllExceptionsFilter } from './filters/ws-exception.filter';

@UseFilters(WsAllExceptionsFilter)
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map userId -> socketId[]
  private onlineUsers = new Map<string, Set<string>>(); // TODO:move to redis when scaling

  // Map callId -> Timeout (waitroom)
  private callWaitRoomTimeouts = new Map<string, NodeJS.Timeout>();
  // Map callId -> Interval (billing)
  private callBillingIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.discordId;
    console.log(userId);
    client.join(`user:${userId}`);
    // console.log('WS connected', userId);

    if (!this.onlineUsers.has(`${userId}`)) {
      this.onlineUsers.set(`${userId}`, new Set());
      // Broadcast that the user is now online
      this.server.emit('user:online', userId);
    }
    const onlineUsers = Array.from(this.onlineUsers.keys());
    this.server.emit('users:online', onlineUsers);

    console.log(`User ${userId} connected with socket ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.discordId;
    // console.log('WS disconnect', client.id);
    this.server.emit('user:offline', userId);

    const userSockets = this.onlineUsers.get(`${userId}`);
    if (!userSockets) return;

    userSockets.delete(client.id);

    // If no more active sockets, mark user as offline
    if (userSockets.size === 0) {
      this.onlineUsers.delete(`${userId}`);
      this.server.emit('user:offline', userId);
    }

    // Emit updated list
    const onlineUsers = Array.from(this.onlineUsers.keys());
    this.server.emit('users:online', onlineUsers);

    console.log(`User ${userId} disconnected (socket ${client.id})`);
  }

  @SubscribeMessage('message:send')
  async onMessageSend(
    @MessageBody() data: CreateMessageWithoutMediaDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.discordId;
    const saved = await this.chatService.sendMessage(`${userId}`, data);
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
          path: 'reciever',
          select: 'discordId',
        },
        {
          path: 'media',
        },
      ])
      .lean<{
        reciever?: { discordId?: string };
        media?: any[];
      }>();

    if (!message?.reciever?.discordId) return;

    // send to receiver
    this.server
      .to(`user:${message.reciever.discordId}`)
      .emit('message:new', message);

    // only the sender receives ack
    client.emit('message:ack', {
      message,
      status: MessageStatus.SENT,
      success: true,
    });

    return message;
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
  async handleDelivered(@MessageBody() data: { messageId: string }) {
    const message = await this.messageModel
      .findByIdAndUpdate(
        data.messageId,
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
  ) {
    console.log('this is data. :', data.messageIds);
    if (!data?.messageIds) return;

    // Normalize to string[]
    const messageIds = Array.isArray(data.messageIds)
      ? data.messageIds
      : [data.messageIds];

    console.log('this is data strings:', messageIds);

    if (!messageIds.length) return;

    await this.messageModel.updateMany(
      { _id: { $in: messageIds } },
      { $set: { status: MessageStatus.READ } },
    );

    // Fetch updated messages
    const messages = await this.messageModel
      .find({ _id: { $in: messageIds } })
      .populate<{ sender: { discordId: string } }>('sender', 'discordId');

    console.log('updated messages :', messages);

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
    const userId = client.handshake.query.discordId;
    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('typing', { userId: `${userId}`, isTyping: data.isTyping });
  }

  @SubscribeMessage('call:session')
  async onCallSession(
    @MessageBody() data: CallSessionDto,
    @ConnectedSocket() client: Socket,
  ) {
    // const userId = client.handshake.query.discordId;
    console.log('call data :', data);
    const call = await this.messageModel.findById(data.callId);
    if (!call) {
      throw new WsException('Call session does not exist');
    }

    console.log('call :', call);
    const caller = await this.userModel.findOne({ discordId: data.callerId });
    const callee = await this.userModel.findOne({
      discordId: data.calleeId,
    });
    const prevPaymentTx = await this.paymentModel.findOne({
      'mete.callId': data.callId,
    });

    console.log('call id :', call._id.toString());
    if (!caller) {
      throw new WsException('Caller does not exist');
    }
    if (!callee) {
      throw new WsException('Callee does not exist');
    }
    const rateAmount = callee.callRate;
    const meta = {
      type: PaymentType.CALL_SESSION,
      fromUser: call.sender.toString(),
      toUser: call.reciever.toString(),
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

  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
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
    const userId = client.handshake.query.discordId as string;
    console.log(`Call offer from ${userId} to ${data.to}`);

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
      console.error('Failed to initiate call:', error);
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
    const userId = client.handshake.query.discordId;
    console.log(`Call answer from ${userId} to ${data.to}`);

    if (data.callId) {
      await this.chatService.markCallWaitroom(data.callId);

      // Start 5-minute waitroom timeout
      const timeout = setTimeout(
        async () => {
          console.log(`Waitroom timeout for call ${data.callId}`);
          await this.handleAutomaticCallEnd(data.callId, 'Waitroom timeout');
        },
        5 * 60 * 1000,
      );

      this.callWaitRoomTimeouts.set(data.callId, timeout);
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
    console.log(`Starting billing for call ${data.callId}`);

    // Cancel waitroom timeout
    const timeout = this.callWaitRoomTimeouts.get(data.callId);
    if (timeout) {
      clearTimeout(timeout);
      this.callWaitRoomTimeouts.delete(data.callId);
    }

    try {
      await this.chatService.markCallOngoing(data.callId);

      // Start recurring billing every 1 minute
      const interval = setInterval(async () => {
        try {
          console.log(`Billing for call ${data.callId}...`);
          await this.paymentService.billCallMinute(
            data.callerId,
            data.calleeId,
            data.callId,
          );
        } catch (error) {
          console.error(`Billing failed for call ${data.callId}:`, error);
          await this.handleAutomaticCallEnd(
            data.callId,
            'Insufficient funds/Billing error',
          );
        }
      }, 60 * 1000);

      this.callBillingIntervals.set(data.callId, interval);

      // Notify both parties
      this.server
        .to(`user:${data.callerId}`)
        .to(`user:${data.calleeId}`)
        .emit('call:ongoing', {
          callId: data.callId,
        });
    } catch (error) {
      console.error('Failed to start billing:', error);
    }
  }

  private async handleAutomaticCallEnd(callId: string, reason: string) {
    const call = await this.messageModel
      .findById(callId)
      .populate('sender reciever');
    if (!call) return;

    const caller = call.sender as any;
    const callee = call.reciever as any;

    await this.chatService.endCall({
      callId,
      callerId: caller.discordId,
      calleeId: callee.discordId,
      callStatus: CallStatus.ENDED, // or MISSED if waitroom timeout
    });

    this.server
      .to(`user:${caller.discordId}`)
      .to(`user:${callee.discordId}`)
      .emit('call:end', {
        callId,
        reason,
      });

    this.cleanupCall(callId);
  }

  private cleanupCall(callId: string) {
    const timeout = this.callWaitRoomTimeouts.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      this.callWaitRoomTimeouts.delete(callId);
    }

    const interval = this.callBillingIntervals.get(callId);
    if (interval) {
      clearInterval(interval);
      this.callBillingIntervals.delete(callId);
    }
  }

  @SubscribeMessage('call:ice')
  async onCallIce(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.discordId;
    // console.log(`ICE candidate from ${userId} to ${data.to}`);

    this.server.to(`user:${data.to}`).emit('call:ice', {
      from: `${userId}`,
      candidate: data.candidate,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('call:end')
  async onCallEnd(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.discordId;
    console.log(`Call ended by ${userId} for ${data.to}`);

    if (data.callId) {
      this.cleanupCall(data.callId);
      await this.chatService.endCall({
        callId: data.callId,
        callerId: data.callerId || userId,
        calleeId: data.calleeId || data.to,
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
    const userId = client.handshake.query.discordId;
    console.log(`Call ringing from ${userId} to ${data.to}`);

    this.server.to(`user:${data.to}`).emit('call:ringing', {
      from: `${userId}`,
      conversationId: data.conversationId,
    });
  }
}

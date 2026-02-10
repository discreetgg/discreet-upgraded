import {
  BadRequestException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Connection, Model } from 'mongoose';
import { Conversation } from 'src/database/schemas/conversation.schema';
import {
  CallStatus,
  Message,
  MessageDocument,
  MessageStatus,
  MessageType,
} from 'src/database/schemas/message.schema';
import {
  CreateInMessageMediaDto,
  CreateMessageMenuDto,
  CreateMessageWithMediaDto,
  CreateMessageWithoutMediaDto,
  MessageMediaMetaDto,
} from './dto/create-message.dto';
import { FileUploaderService } from 'src/file-uploader/file-uploader.service';
import { Media } from 'src/database/schemas/media.schema';
import { User } from 'src/database/schemas/user.schema';
import { AcceptCallDto, EndCallDto, StartCallDto } from './dto/call.dto';
import { WalletService } from 'src/wallet/wallet.service';
import { PaymentService } from 'src/payment/payment.service';
import { NoteDto } from './dto/note.dto';
import { ChatNote } from 'src/database/schemas/chat-note.schema';
import { InMessageMedia } from 'src/database/schemas/in-message-media.schema';
import { MediaMetaDto } from 'src/menu/dto/create-menu.dto';

@Injectable()
export class ChatService {
  private logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
    @InjectModel(Media.name) private readonly mediaModel: Model<Media>,
    @InjectModel(InMessageMedia.name)
    private readonly inMessageMediaModel: Model<InMessageMedia>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(ChatNote.name) private readonly chatNoteModel: Model<ChatNote>,
    private readonly fileUploaderService: FileUploaderService,
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  async sendMessage(
    senderId: string,
    dto: CreateMessageWithoutMediaDto,
  ): Promise<Message> {
    try {
      const [sender, receiver] = await Promise.all([
        this.userModel.findOne({ discordId: senderId }),
        this.userModel.findOne({ discordId: dto.reciever }),
      ]);

      if (!sender) throw new NotFoundException('Sender not found');
      if (!receiver) throw new NotFoundException('Receiver not found');
      if (!dto.text)
        throw new BadRequestException('Message must have content or media');

      let conversation = await this.conversationModel.findOne({
        participants: { $all: [sender._id, receiver._id] },
      });

      if (!conversation) {
        conversation = await this.conversationModel.create({
          participants: [sender._id, receiver._id],
        });
      }

      // Remove sender/receiver from dto
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sender: _ignoredSender,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        reciever: _ignoredReceiver,
        ...messagePayload
      } = dto;

      const message = await this.messageModel.create({
        conversation: conversation._id,
        sender: sender._id,
        reciever: receiver._id,
        ...messagePayload,
      });

      await this.conversationModel.findByIdAndUpdate(conversation._id, {
        lastMessage: message._id,
      });

      return await message.populate([
        { path: 'media' },
        {
          path: 'sender',
          select:
            'id discordId username displayName discordAvatar role profileImage',
        },
        {
          path: 'reciever',
          select:
            'id discordId username displayName discordAvatar role profileImage',
        },
        {
          path: 'conversation',
          select: 'id participants lastMessage',
        },
      ]);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to send Message');
    }
  }

  async sendMessageWithMedia(
    senderId: string,
    dto: CreateMessageWithMediaDto,
    files: Express.Multer.File[] = [],
    mediaMeta: MessageMediaMetaDto[] = [],
  ): Promise<Message> {
    // console.log('HEREEE :', dto);
    try {
      console.log(files);
      let finalMessage: Message | null = null;
      const sender = await this.userModel.findOne({ discordId: senderId });

      if (!sender) throw new NotFoundException('Sender not found');
      const reciever = await this.userModel.findOne({
        discordId: dto.reciever,
      });
      if (!reciever) throw new NotFoundException('Reciever not found');
      let conversation = await this.conversationModel.findOne({
        participants: { $all: [sender._id, reciever._id] },
      });

      if (dto.type !== MessageType.MEDIA) {
        throw new BadRequestException('message type must be a media');
      }

      if (files.length === 0) {
        throw new BadRequestException(
          'message must include at least one media file',
        );
      }

      if (!conversation) {
        conversation = await this.conversationModel.create({
          participants: [sender._id, reciever._id],
        });
      }

      // to ignore sender and reciever from dto
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sender: _dtoSender, reciever: _dtoReciever, ...rest } = dto;
      const message = await this.messageModel.create({
        conversation: conversation._id,
        sender: sender._id,
        reciever: reciever._id,
        ...rest,
      });

      await this.conversationModel.findByIdAndUpdate(conversation._id, {
        lastMessage: message._id,
      });

      if (
        files.length > 0 &&
        mediaMeta.length > 0 &&
        files.length !== mediaMeta.length
      ) {
        throw new BadRequestException(
          'Each file must have a corresponding mediaMeta entry',
        );
      }
      const uploadedMedia = [];

      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const meta = (mediaMeta && mediaMeta[i]) || {};
          let upload;

          console.log(meta);
          if (meta.type === 'image') {
            upload = await this.fileUploaderService.uploadImage(file);
          } else if (meta.type === 'video') {
            upload = await this.fileUploaderService.uploadVideo(file);
          } else {
            throw new BadRequestException(`Unknown media type at index ${i}`);
          }

          const savedMedia = await new this.mediaModel({
            url: upload.url,
            public_id: upload.public_id,
            type: meta.type,
            uploadedAt: new Date(),
            chat: message._id,
            owner: sender._id,
          }).save();

          uploadedMedia.push(savedMedia.id);
        }

        finalMessage = await this.messageModel
          .findByIdAndUpdate(
            message.id,
            {
              media: [...uploadedMedia],
              mediaModel: 'Media',
            },
            { new: true },
          )
          .populate('media')
          .populate({
            path: 'sender',
            select:
              'id discordId username displayName discordAvatar role profileImage',
          })
          .populate({
            path: 'reciever',
            select:
              'id discordId username displayName discordAvatar role profileImage',
          })
          .populate({
            path: 'conversation',
            select: 'id  participants lastMessage',
          })
          .lean();
      }

      return finalMessage;
    } catch (error) {
      this.logger.error(error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to send Message');
    }
  }

  async sendMessageWithMedia_likeMenu(
    senderId: string,
    dto: CreateInMessageMediaDto,
    files: Express.Multer.File[] = [],
    mediaMeta: MediaMetaDto[] = [],
  ): Promise<Message> {
    // console.log('HEREEE :', dto);
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // console.log(files);

      const sender = await this.userModel.findOne({ discordId: senderId });

      if (!sender) throw new NotFoundException('Sender not found');
      const reciever = await this.userModel.findOne({
        discordId: dto.reciever,
      });
      if (!reciever) throw new NotFoundException('Reciever not found');
      let conversation = await this.conversationModel.findOne({
        participants: { $all: [sender._id, reciever._id] },
      });

      if (files.length === 0) {
        throw new BadRequestException(
          'message must include at least one media file',
        );
      }

      if (!conversation) {
        conversation = await this.conversationModel.create({
          participants: [sender._id, reciever._id],
        });
      }

      // to ignore sender and reciever from dto
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reciever: _dtoReciever, ...rest } = dto;

      const inMessageMedia = await this.inMessageMediaModel.create({
        ...dto,
        sender: sender._id,
        reciever: reciever._id,
      });

      const message = await this.messageModel.create({
        conversation: conversation._id,
        sender: sender._id,
        reciever: reciever._id,
        type: MessageType.IN_MESSAGE_MEDIA,
        isPayable: true,
        price: dto.priceToView,
        inMessageMedia: inMessageMedia._id,
        title: dto.title,
        description: dto.description,
        discount: dto.discount,
      });

      await this.conversationModel.findByIdAndUpdate(conversation._id, {
        lastMessage: message._id,
      });

      if (
        files.length > 0 &&
        mediaMeta.length > 0 &&
        files.length !== mediaMeta.length
      ) {
        throw new BadRequestException(
          'Each file must have a corresponding mediaMeta entry',
        );
      }
      const uploadedMedia = [];

      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const meta = (mediaMeta && mediaMeta[i]) || {};
          let upload;

          if (meta.type === 'image') {
            upload = await this.fileUploaderService.uploadImage(file);
          } else if (meta.type === 'video') {
            upload = await this.fileUploaderService.uploadVideo(file);
          } else {
            throw new BadRequestException(`Unknown media type at index ${i}`);
          }

          const savedMedia = await new this.mediaModel({
            url: upload.url,
            public_id: upload.public_id,
            type: meta.type,
            uploadedAt: new Date(),
            chat: message._id,
            owner: sender._id,
            caption: meta.caption ?? '',
          }).save();

          uploadedMedia.push(savedMedia._id.toString());
        }

        await this.inMessageMediaModel.findByIdAndUpdate(
          inMessageMedia.id,
          {
            media: [...uploadedMedia],
            itemCount: files.length,
          },
          { new: true },
        );
      }
      await this.messageModel.updateOne(
        { _id: message._id },
        { $set: { media: uploadedMedia } },
      );

      // const populatedMessage = await this.messageModel
      //   .findById(message._id)
      //   .populate({
      //     path: 'inMessageMedia',
      //     populate: [
      //       { path: 'media' },
      //       {
      //         path: 'sender',
      //         select:
      //           'id discordId username displayName discordAvatar role profileImage',
      //       },
      //       {
      //         path: 'reciever',
      //         select:
      //           'id discordId username displayName discordAvatar role profileImage',
      //       },
      //     ],
      //   })
      //   .lean();

      const populatedMessage = await this.messageModel
        .findById(message._id)
        .populate([
          {
            path: 'media',
          },
          {
            path: 'sender',
            select:
              '_id discordId username displayName discordAvatar role profileImage',
          },
          {
            path: 'reciever',
            select:
              '_id discordId username displayName discordAvatar role profileImage',
          },
        ])
        .lean();

      return populatedMessage;
    } catch (error) {
      this.logger.error(error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to send Message');
    }
  }

  async sendMenu(dto: CreateMessageMenuDto): Promise<MessageDocument> {
    try {
      // Find existing conversation between sender and receiver
      let conversation = await this.conversationModel.findOne({
        participants: { $all: [dto.sender, dto.reciever] },
      });

      // Create a new conversation if it doesn’t exist
      if (!conversation) {
        conversation = await this.conversationModel.create({
          participants: [dto.sender, dto.reciever],
        });
      }

      // Create the message
      const message = await this.messageModel.create({
        conversation: conversation._id,
        ...dto,
        type: MessageType.MENU,
        //   mediaModel: 'MenuMedia',
      });

      // Update conversation with the latest message
      await this.conversationModel.findByIdAndUpdate(conversation._id, {
        lastMessage: message._id,
      });

      return message;
    } catch (error) {
      console.log(error);
      this.logger.error(error);
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to send Menu to buyer');
    }
  }

  //   async fetchConversation(conversationId: string, limit = 50, before?: Date) {
  //     const query: any = { conversation: conversationId };
  //     if (before) query.createdAt = { $lt: before };

  //     return this.messageModel
  //       .find(query)
  //       .sort({ createdAt: -1 })
  //       .populate(
  //         'sender',
  //         'id discordId username displayName discordAvatar role profileImage',
  //       )
  //       .populate(
  //         'reciever',
  //         'id discordId username displayName discordAvatar role profileImage',
  //       )
  //       .populate('media')
  //       .populate('replyTo')
  //       .limit(limit)
  //       .exec();
  //   }

  //   async fetchConversation(
  //     conversationId: string,
  //     limit = 50,
  //     before?: Date,
  //     from?: Date,
  //     end?: Date,
  //   ) {
  //     const query: any = { conversation: conversationId };

  //     // Range query handling
  //     if (from && end) {
  //       query.createdAt = { $gte: from, $lte: end };
  //     } else if (from) {
  //       query.createdAt = { $gte: from };
  //     } else if (end) {
  //       query.createdAt = { $lte: end };
  //     } else if (before) {
  //       query.createdAt = { $lt: before };
  //     }

  //     return this.messageModel
  //       .find(query)
  //       .sort({ createdAt: -1 })
  //       .populate(
  //         'sender',
  //         'id discordId username displayName discordAvatar role profileImage',
  //       )
  //       .populate(
  //         'reciever',
  //         'id discordId username displayName discordAvatar role profileImage',
  //       )
  //       .populate('media')
  //       .populate('replyTo')
  //       .limit(limit)
  //       .exec();
  //   }

  async fetchConversation(
    conversationId: string,
    limit = 50,
    from?: Date,
    to?: Date,
  ): Promise<any> {
    const query: any = { conversation: conversationId };
    const safeLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(limit, 200))
      : 50;

    // Add date range filter if provided
    if (from && to) {
      query.createdAt = { $gte: from, $lte: to };
    } else if (from) {
      query.createdAt = { $gte: from };
    } else if (to) {
      query.createdAt = { $lte: to };
    }

    // return this.messageModel
    //   .find(query)
    //   .sort({ createdAt: -1 })
    //   .populate(
    //     'sender',
    //     'id discordId username displayName discordAvatar role profileImage',
    //   )
    //   .populate(
    //     'reciever',
    //     'id discordId username displayName discordAvatar role profileImage',
    //   )
    //   .populate('media')
    //   .populate('replyTo')
    //   .limit(limit)
    //   .exec();

    return this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .populate({
        path: 'sender',
        select:
          'id discordId username displayName discordAvatar role profileImage takingCams',
      })
      .populate({
        path: 'reciever',
        select:
          'id discordId username displayName discordAvatar role profileImage takingCams',
      })
      .populate({
        path: 'media',
        select:
          '_id url public_id type caption price isPayable paid post owner uploadedAt createdAt updatedAt __v',
      })
      .populate({
        path: 'replyTo',
        select:
          '_id conversation sender reciever type text media status isPayable price paid paymentTx call callStatus callStartedAt missed durationInSeconds title description createdAt updatedAt __v',
      })
      .lean()
      .exec();
  }

  async getUsersConversationsUsingIds(discordIds: string[]): Promise<any> {
    const [user1, user2] = await Promise.all([
      this.userModel.findOne({ discordId: discordIds[0] }),
      this.userModel.findOne({ discordId: discordIds[1] }),
    ]);

    if (!user1)
      throw new BadRequestException(`User ${discordIds[0]} does not exist`);
    if (!user2)
      throw new BadRequestException(`User ${discordIds[1]} does not exist`);

    return this.conversationModel
      .findOne({
        participants: { $all: [user1._id, user2._id] },
      })
      .populate(
        'participants',
        'id discordId username displayName discordAvatar role profileImage',
      )
      .populate({
        path: 'lastMessage',
        select:
          'id conversation sender reciever type text media status replyTo createdAt updatedAt',
        populate: [
          {
            path: 'sender',
            select:
              'id discordId username displayName discordAvatar role profileImage',
          },
          {
            path: 'reciever',
            select:
              'id discordId username displayName discordAvatar role profileImage',
          },
          {
            path: 'media',
            select: '_id url public_id type chat owner uploadedAt',
          },
        ],
      })
      .lean();
  }

  // async getUserConversations(userId: string): Promise<any> {
  //   return this.conversationModel
  //     .find({ participants: userId })

  //     .populate(
  //       'participants',
  //       'id discordId username displayName discordAvatar role profileImage',
  //     )
  //     .populate({
  //       path: 'lastMessage',
  //       select:
  //         'id conversation sender reciever type text media status replyTo createdAt updatedAt ',
  //       populate: {
  //         path: 'sender',
  //         select:
  //           'id discordId username displayName discordAvatar role profileImage',
  //       },
  //     })
  //     .sort({ updatedAt: -1 })
  //     .lean();
  // }

  async getUserConversations(userId: string): Promise<any> {
    // 1️⃣ Fetch conversations
    const conversations = await this.conversationModel
      .find({ participants: userId })
      .populate(
        'participants',
        'id discordId username displayName discordAvatar role profileImage takingCams takingCalls',
      )
      .populate({
        path: 'lastMessage',
        select:
          'id conversation sender reciever type text media status replyTo createdAt updatedAt',
        populate: [
          {
            path: 'sender',
            select:
              'id discordId username displayName discordAvatar role profileImage takingCams takingCalls',
          },
          {
            path: 'reciever',
            select:
              'id discordId username displayName discordAvatar role profileImage takingCams takingCalls',
          },
          {
            path: 'media',
            select: '_id url public_id type chat owner uploadedAt',
          },
        ],
      })
      .sort({ updatedAt: -1 })
      .lean();

    if (!conversations.length) return [];

    const mongoUserId =
      typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    // 2️⃣ Get unread counts per conversation
    const unreadCounts = await this.messageModel.aggregate([
      {
        $match: {
          reciever: mongoUserId,
          status: { $ne: MessageStatus.READ },
          conversation: {
            $in: conversations.map((c) => c._id),
          },
        },
      },
      {
        $group: {
          _id: '$conversation',
          count: { $sum: 1 },
        },
      },
    ]);

    // 3️⃣ Map unread counts for quick lookup
    const unreadMap = new Map<string, number>();
    unreadCounts.forEach((u) => unreadMap.set(u._id.toString(), u.count));

    // 4️⃣ Attach unreadCount to each conversation
    return conversations.map((conv) => ({
      ...conv,
      unreadCount: unreadMap.get(conv._id.toString()) || 0,
    }));
  }

  // async getUserConversations(userId: string): Promise<any> {
  //   return this.conversationModel
  //     .find({ participants: userId })
  //     .populate(
  //       'participants',
  //       'id discordId username displayName discordAvatar role profileImage',
  //     )
  //     .populate({
  //       path: 'lastMessage',
  //       select:
  //         'id conversation sender reciever type text media status replyTo createdAt updatedAt',
  //       populate: [
  //         {
  //           path: 'sender',
  //           select:
  //             'id discordId username displayName discordAvatar role profileImage',
  //         },
  //         {
  //           path: 'reciever',
  //           select:
  //             'id discordId username displayName discordAvatar role profileImage',
  //         },
  //         {
  //           path: 'media',
  //           select: '_id url public_id type chat owner uploadedAt',
  //         },
  //       ],
  //     })
  //     .sort({ updatedAt: -1 })
  //     .lean();
  // }

  /**
   * chat notes
   */
  async upsertNote(dto: NoteDto) {
    const [seller, buyer] = await Promise.all([
      this.userModel.findOne({ discordId: dto.seller }),
      this.userModel.findOne({ discordId: dto.buyer }),
    ]);

    if (!seller) throw new BadRequestException('Seller does not exist');
    if (!buyer) throw new BadRequestException('Buyer does not exist');

    return await this.chatNoteModel.findOneAndUpdate(
      { seller: seller._id.toString(), buyer: buyer._id.toString() },
      { note: dto.note.trim() },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  async getNotes(sellerId: string, buyerId: string) {
    const [seller, buyer] = await Promise.all([
      this.userModel.findOne({ discordId: sellerId }),
      this.userModel.findOne({ discordId: buyerId }),
    ]);

    if (!seller) throw new BadRequestException('Seller does not exist');
    if (!buyer) throw new BadRequestException('Buyer does not exist');
    return await this.chatNoteModel.findOne({
      seller: seller._id.toString(),
      buyer: buyer._id.toString(),
    });
  }

  async deleteNote(id: string) {
    const result = await this.chatNoteModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Note not found');

    return { message: 'Deleted successfully' };
  }

  /**
   * Create a call session when caller initiates a call
   */
  async createCallSession(dto: StartCallDto): Promise<Message> {
    const [callerWallet, caller, callee] = await Promise.all([
      this.walletService.getWallet(dto.callerId),
      this.userModel.findOne({ discordId: dto.callerId }),
      this.userModel.findOne({ discordId: dto.calleeId }),
    ]);

    if (!callerWallet) {
      throw new BadRequestException('Caller does not have an active wallet');
    }

    if (!caller) throw new NotFoundException('Caller not found');
    if (!callee) throw new NotFoundException('Callee not found');

    const calleeRate = callee.callRate || 0;
    const minCallTime = callee.minimumCallTime || 1;
    const requiredBalance = calleeRate * minCallTime;

    if (callerWallet.balance < requiredBalance) {
      throw new BadRequestException(
        `Insufficient funds. You need at least $${requiredBalance.toFixed(2)} to initiate this call.`,
      );
    }

    let conversation = await this.conversationModel.findOne({
      participants: { $all: [caller._id, callee._id] },
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [caller._id, callee._id],
      });
    }

    // Create message (acts as call log entry)
    const callMessage = await this.messageModel.create({
      conversation: conversation._id,
      sender: caller._id.toString(),
      reciever: callee._id.toString(),
      type: MessageType.CALL,
      call: dto.callType,
      callStatus: CallStatus.INITIATED,
      callStartedAt: new Date(),
      isPayable: true,
      price: calleeRate.toString(),
      paid: false,
    });

    return callMessage;
  }

  /**
   * Mark call as in waitroom (callee answered, but billing not yet started)
   */
  async markCallWaitroom(callId: string): Promise<Message> {
    const call = await this.messageModel.findByIdAndUpdate(
      callId,
      { callStatus: CallStatus.IN_WAITROOM },
      { new: true },
    );

    if (!call) throw new NotFoundException('Call not found');
    return call;
  }

  /**
   * Mark call as ongoing (billing started)
   */
  async markCallOngoing(callId: string): Promise<Message> {
    const call = await this.messageModel.findByIdAndUpdate(
      callId,
      { callStatus: CallStatus.ONGOING, callStartedAt: new Date() },
      { new: true },
    );

    if (!call) throw new NotFoundException('Call not found');
    return call;
  }

  /**
   * End the call and finalize billing
   */
  async endCall(dto: EndCallDto) {
    const call = await this.messageModel.findById(dto.callId);
    if (!call) throw new NotFoundException('Call session not found');

    if (dto.callStatus === CallStatus.ENDED) {
      const callEndTime = new Date();
      const durationInSeconds =
        (callEndTime.getTime() - call.callStartedAt.getTime()) / 1000;

      const totalMinutes = dto.duration || Math.ceil(durationInSeconds / 60);
      const rate = parseFloat(call.price);
      const totalCost = totalMinutes * rate;

      const paymentTx = await this.paymentService.payForCall({
        callerId: dto.callerId,
        calleeId: dto.calleeId,
        callId: dto.callId,
        amount: totalCost,
        duration: dto.duration,
      });

      console.log('this is payment :', paymentTx);

      const UpdatedCall = await this.messageModel.findByIdAndUpdate(
        call._id.toString(),
        {
          callEndedAt: callEndTime,
          durationInSeconds: durationInSeconds,
          callStatus: CallStatus.ENDED,
          paid: true,
          paymentTx: paymentTx.tx._id.toString(),
        },
        { new: true },
      );

      return UpdatedCall;
    } else {
      return this.messageModel.findByIdAndUpdate(
        dto.callId,
        {
          callStatus: dto.callStatus,
        },
        { new: true },
      );
    }
  }

  /**
   * Fetch active/ongoing calls
   */
  async getActiveCalls(userId: string) {
    return this.messageModel.find({
      $or: [{ sender: userId }, { reciever: userId }],
      callStatus: CallStatus.ONGOING,
    });
  }

  /**
   * Utility: compute total charge for a duration
   */
  computeCharge(ratePerMinute: number, durationSeconds: number) {
    const minutes = Math.ceil(durationSeconds / 60);
    return ratePerMinute * minutes;
  }

  //migrations
  async migrateInMessageMedia() {
    const messages = await this.messageModel
      .find({ type: MessageType.IN_MESSAGE_MEDIA })
      .populate<{ inMessageMedia: InMessageMedia }>('inMessageMedia')
      .exec();

    for (const msg of messages) {
      if (!msg.inMessageMedia || !msg.inMessageMedia.media) continue;

      await this.messageModel.updateOne(
        { _id: msg._id },
        { $set: { media: msg.inMessageMedia.media } },
      );
    }

    console.log('Migration complete');
  }
}

////  1. Block-Aware fetchConversation()
// async fetchConversation(
//   userId: string,
//   conversationId: string,
//   limit = 50,
//   from?: Date,
//   to?: Date,
// ) {
//   // Fetch conversation
//   const conversation = await this.conversationModel
//     .findById(conversationId)
//     .select('participants')
//     .lean();

//   if (!conversation) throw new NotFoundException('Conversation not found');

//   // Resolve the other user
//   const otherUserId = conversation.participants.find(
//     (p) => p.toString() !== userId,
//   );

//   // BLOCK CHECK
//   const isBlocked = await this.blockModel.exists({
//     $or: [
//       { blocker: userId, blocked: otherUserId },
//       { blocker: otherUserId, blocked: userId },
//     ],
//   });

//   if (isBlocked) {
//     throw new ForbiddenException('You cannot access this conversation');
//   }

//   // Build query
//   const query: any = { conversation: conversationId };

//   if (from || to) {
//     query.createdAt = {};
//     if (from) query.createdAt.$gte = from;
//     if (to) query.createdAt.$lte = to;
//   }

//   return this.messageModel
//     .find(query)
//     .sort({ createdAt: -1 })
//     .limit(limit)
//     .populate(
//       'sender',
//       'id discordId username displayName discordAvatar role profileImage',
//     )
//     .populate(
//       'reciever',
//       'id discordId username displayName discordAvatar role profileImage',
//     )
//     .populate('media')
//     .populate('replyTo')
//     .lean();
// }

// // 2. Block-Aware getUsersConversationsUsingIds()
// async getUsersConversationsUsingIds(discordIds: string[]) {
//   const [user1, user2] = await Promise.all([
//     this.userModel.findOne({ discordId: discordIds[0] }).lean(),
//     this.userModel.findOne({ discordId: discordIds[1] }).lean(),
//   ]);

//   if (!user1) throw new BadRequestException(`User ${discordIds[0]} does not exist`);
//   if (!user2) throw new BadRequestException(`User ${discordIds[1]} does not exist`);

//   // BLOCK CHECK
//   const isBlocked = await this.blockModel.exists({
//     $or: [
//       { blocker: user1._id, blocked: user2._id },
//       { blocker: user2._id, blocked: user1._id },
//     ],
//   });

//   if (isBlocked) {
//     throw new ForbiddenException('You cannot open a chat with this user');
//   }

//   return this.conversationModel
//     .findOne({
//       participants: { $all: [user1._id, user2._id] },
//     })
//     .populate(
//       'participants',
//       'id discordId username displayName discordAvatar role profileImage',
//     )
//     .populate({
//       path: 'lastMessage',
//       select:
//         'id conversation sender reciever type text media status replyTo createdAt updatedAt',
//       populate: [
//         {
//           path: 'sender',
//           select:
//             'id discordId username displayName discordAvatar role profileImage',
//         },
//         {
//           path: 'reciever',
//           select:
//             'id discordId username displayName discordAvatar role profileImage',
//         },
//         {
//           path: 'media',
//           select: '_id url public_id type chat owner uploadedAt',
//         },
//       ],
//     })
//     .lean();
// }

// // 3. Block-Aware getUserConversations() (Chat List)
// async getUserConversations(userId: string) {
//   const { blockedUsers, blockedByUsers } =
//     await this.getBlockRelations(userId);

//   const excluded = [...blockedUsers, ...blockedByUsers];

//   return this.conversationModel
//     .find({
//       participants: userId,
//       participants: { $nin: excluded }, // <-- filter here
//     })
//     .populate(
//       'participants',
//       'id discordId username displayName discordAvatar role profileImage',
//     )
//     .populate({
//       path: 'lastMessage',
//       select:
//         'id conversation sender reciever type text media status replyTo createdAt updatedAt',
//       populate: [
//         {
//           path: 'sender',
//           select:
//             'id discordId username displayName discordAvatar role profileImage',
//         },
//         {
//           path: 'reciever',
//           select:
//             'id discordId username displayName discordAvatar role profileImage',
//         },
//         {
//           path: 'media',
//           select: '_id url public_id type chat owner uploadedAt',
//         },
//       ],
//     })
//     .sort({ updatedAt: -1 })
//     .lean();
// }

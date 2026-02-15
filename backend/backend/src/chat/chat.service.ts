import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
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
import { EndCallDto, StartCallDto } from './dto/call.dto';
import { WalletService } from 'src/wallet/wallet.service';
import { PaymentService } from 'src/payment/payment.service';
import { NoteDto } from './dto/note.dto';
import { ChatNote } from 'src/database/schemas/chat-note.schema';
import { InMessageMedia } from 'src/database/schemas/in-message-media.schema';
import { MediaMetaDto } from 'src/menu/dto/create-menu.dto';

const DEFAULT_MESSAGE_PAGE_SIZE = 50;
const MAX_MESSAGE_PAGE_SIZE = 100;
const DEFAULT_SHARED_MEDIA_PAGE_SIZE = 40;
const MAX_SHARED_MEDIA_PAGE_SIZE = 60;
const DEFAULT_CONVERSATION_PAGE_SIZE = 30;
const MAX_CONVERSATION_PAGE_SIZE = 100;
const SEARCHED_CONVERSATION_USER_SCAN_LIMIT = 500;

type KeysetCursor = {
  date: Date;
  id: mongoose.Types.ObjectId;
};

type ConversationMessagePage = {
  messages: any[];
  nextCursor: string | null;
  hasMore: boolean;
};

type ConversationListPage = {
  conversations: any[];
  nextCursor: string | null;
  hasMore: boolean;
  totalUnreadCount: number;
};

type ConversationListOptions = {
  limit?: number;
  cursor?: string;
  search?: string;
};

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
  ) {}

  private normalizeLimit(
    requestedLimit: number | undefined,
    defaults: { fallback: number; max: number },
  ) {
    if (!Number.isFinite(requestedLimit)) {
      return defaults.fallback;
    }
    return Math.max(
      1,
      Math.min(Math.floor(requestedLimit as number), defaults.max),
    );
  }

  private encodeKeysetCursor(
    date: Date | string,
    id: mongoose.Types.ObjectId | string,
  ): string {
    const normalizedDate = new Date(date);
    const payload = {
      d: normalizedDate.toISOString(),
      i: id.toString(),
    };
    return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  }

  private decodeKeysetCursor(cursor?: string): KeysetCursor | null {
    if (!cursor) {
      return null;
    }

    try {
      const decoded = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf-8'),
      ) as { d?: string; i?: string };
      if (!decoded?.d || !decoded?.i) {
        return null;
      }

      const date = new Date(decoded.d);
      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return {
        date,
        id: new mongoose.Types.ObjectId(decoded.i),
      };
    } catch {
      return null;
    }
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private isFreePreviewCaption(caption?: string) {
    if (!caption) return false;
    const normalizedCaption = caption.toLowerCase();
    return (
      normalizedCaption.includes('free preview') ||
      normalizedCaption.includes('cover image')
    );
  }

  private stripMediaUrlsFromMessage<T>(message: T): T {
    // Keep media URLs for direct CDN/signed delivery on the client.
    return message;
  }

  public sanitizeMessageForClient<T>(message: T): T {
    return this.stripMediaUrlsFromMessage(message);
  }

  private readObjectId(value: any): string | null {
    if (!value) {
      return null;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (value instanceof mongoose.Types.ObjectId) {
      return value.toString();
    }
    if (typeof value === 'object') {
      if (value._id) {
        return value._id.toString();
      }
      if (value.id) {
        return value.id.toString();
      }
      if (
        typeof value.toString === 'function' &&
        value.toString() !== '[object Object]'
      ) {
        return value.toString();
      }
    }
    return null;
  }

  private collectInMessageAssetTargets(messages: any[]) {
    const targets: Array<{ id: string; message: any }> = [];
    const stack = [...messages];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || typeof current !== 'object') {
        continue;
      }

      const messageId = this.readObjectId(current._id);
      if (
        messageId &&
        current.type === MessageType.IN_MESSAGE_MEDIA &&
        current.isPayable
      ) {
        targets.push({ id: messageId, message: current });
      }

      if (current.replyTo && typeof current.replyTo === 'object') {
        stack.push(current.replyTo);
      }
    }

    return targets;
  }

  private async applyMediaPurchaseEntitlements(
    messages: any[],
    requesterUserId: string,
  ) {
    const targets = this.collectInMessageAssetTargets(messages);
    if (targets.length === 0) {
      return;
    }

    const entitledAssetIds =
      await this.paymentService.getCompletedMediaPurchaseAssetIdsForBuyer(
        requesterUserId,
        targets.map((target) => target.id),
      );

    for (const target of targets) {
      const receiverId = this.readObjectId(target.message.reciever);
      if (!receiverId || receiverId !== requesterUserId) {
        continue;
      }

      const isEntitled = entitledAssetIds.has(target.id);
      target.message.paid = isEntitled;

      if (Array.isArray(target.message.media)) {
        target.message.media = target.message.media.map((media: any) => {
          if (media && typeof media === 'object' && !Array.isArray(media)) {
            const isFreePreview = this.isFreePreviewCaption(media.caption);
            if (!isEntitled && !isFreePreview) {
              return {
                ...media,
                paid: false,
                url: '',
                public_id: '',
              };
            }

            return { ...media, paid: isEntitled };
          }
          return media;
        });
      }
    }
  }

  private toObjectId(
    value: string | mongoose.Types.ObjectId | { toString(): string },
  ) {
    if (value instanceof mongoose.Types.ObjectId) {
      return value;
    }
    return new mongoose.Types.ObjectId(value.toString());
  }

  private buildDirectConversationKey(
    participants: Array<
      string | mongoose.Types.ObjectId | { toString(): string }
    >,
  ): string {
    return participants
      .map((participant) => participant.toString())
      .sort((a, b) => a.localeCompare(b))
      .join(':');
  }

  private async getDirectConversationFamily(
    participantA: string | mongoose.Types.ObjectId | { toString(): string },
    participantB: string | mongoose.Types.ObjectId | { toString(): string },
  ) {
    const participantAObjectId = this.toObjectId(participantA);
    const participantBObjectId = this.toObjectId(participantB);
    const participantKey = this.buildDirectConversationKey([
      participantAObjectId,
      participantBObjectId,
    ]);

    return this.conversationModel
      .find({
        $or: [
          { participantKey },
          {
            participants: {
              $all: [participantAObjectId, participantBObjectId],
              $size: 2,
            },
          },
        ],
      })
      .sort({ updatedAt: -1, _id: -1 });
  }

  private async getOrCreateDirectConversation(
    participantA: string | mongoose.Types.ObjectId | { toString(): string },
    participantB: string | mongoose.Types.ObjectId | { toString(): string },
  ) {
    const conversationFamily = await this.getDirectConversationFamily(
      participantA,
      participantB,
    );
    if (conversationFamily.length > 0) {
      return conversationFamily[0];
    }

    const participantAObjectId = this.toObjectId(participantA);
    const participantBObjectId = this.toObjectId(participantB);
    const participantKey = this.buildDirectConversationKey([
      participantAObjectId,
      participantBObjectId,
    ]);

    try {
      return await this.conversationModel.create({
        participants: [participantAObjectId, participantBObjectId],
        participantKey,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        const retryFamily = await this.getDirectConversationFamily(
          participantAObjectId,
          participantBObjectId,
        );
        if (retryFamily.length > 0) {
          return retryFamily[0];
        }
      }
      throw error;
    }
  }

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

      const conversation = await this.getOrCreateDirectConversation(
        sender._id,
        receiver._id,
      );

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

      const populatedMessage = await message.populate([
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
      return this.sanitizeMessageForClient(populatedMessage as any);
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
    try {
      let finalMessage: Message | null = null;
      const sender = await this.userModel.findOne({ discordId: senderId });

      if (!sender) throw new NotFoundException('Sender not found');
      const reciever = await this.userModel.findOne({
        discordId: dto.reciever,
      });
      if (!reciever) throw new NotFoundException('Reciever not found');
      const conversation = await this.getOrCreateDirectConversation(
        sender._id,
        reciever._id,
      );

      if (dto.type !== MessageType.MEDIA) {
        throw new BadRequestException('message type must be a media');
      }

      if (files.length === 0) {
        throw new BadRequestException(
          'message must include at least one media file',
        );
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

      return this.sanitizeMessageForClient(finalMessage as any);
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
    try {
      // console.log(files);

      const sender = await this.userModel.findOne({ discordId: senderId });

      if (!sender) throw new NotFoundException('Sender not found');
      const reciever = await this.userModel.findOne({
        discordId: dto.reciever,
      });
      if (!reciever) throw new NotFoundException('Reciever not found');
      const conversation = await this.getOrCreateDirectConversation(
        sender._id,
        reciever._id,
      );

      if (files.length === 0) {
        throw new BadRequestException(
          'message must include at least one media file',
        );
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

      return this.sanitizeMessageForClient(populatedMessage as any);
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
      const conversation = await this.getOrCreateDirectConversation(
        dto.sender,
        dto.reciever,
      );

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

  async fetchConversation(
    conversationId: string,
    requesterUserId: string,
    limit = DEFAULT_MESSAGE_PAGE_SIZE,
    cursor?: string,
    from?: Date,
    to?: Date,
  ): Promise<ConversationMessagePage> {
    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      participants: requesterUserId,
    });
    if (!conversation) {
      throw new ForbiddenException('Conversation not found or access denied');
    }

    const safeLimit = this.normalizeLimit(limit, {
      fallback: DEFAULT_MESSAGE_PAGE_SIZE,
      max: MAX_MESSAGE_PAGE_SIZE,
    });
    const cursorFilter = this.decodeKeysetCursor(cursor);

    let conversationIds: mongoose.Types.ObjectId[] = [conversation._id];
    if (
      Array.isArray(conversation.participants) &&
      conversation.participants.length === 2
    ) {
      const directConversationFamily = await this.getDirectConversationFamily(
        conversation.participants[0],
        conversation.participants[1],
      );
      if (directConversationFamily.length > 0) {
        conversationIds = directConversationFamily.map((item) => item._id);
      }
    }

    const filters: Record<string, any>[] = [
      {
        conversation: { $in: conversationIds },
      },
    ];

    if (from && to) {
      filters.push({ createdAt: { $gte: from, $lte: to } });
    } else if (from) {
      filters.push({ createdAt: { $gte: from } });
    } else if (to) {
      filters.push({ createdAt: { $lte: to } });
    }

    if (cursorFilter) {
      filters.push({
        $or: [
          { createdAt: { $lt: cursorFilter.date } },
          {
            createdAt: cursorFilter.date,
            _id: { $lt: cursorFilter.id },
          },
        ],
      });
    }

    const query = filters.length === 1 ? filters[0] : { $and: filters };

    const messageBatch = await this.messageModel
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit + 1)
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

    const hasMore = messageBatch.length > safeLimit;
    const messages = hasMore ? messageBatch.slice(0, safeLimit) : messageBatch;
    await this.applyMediaPurchaseEntitlements(
      messages as any[],
      requesterUserId,
    );
    const sanitizedMessages = messages.map((message) =>
      this.sanitizeMessageForClient(message),
    );
    const oldestVisibleMessage = messages[messages.length - 1] as
      | { createdAt?: string | Date; _id?: string | mongoose.Types.ObjectId }
      | undefined;
    const nextCursor =
      hasMore && oldestVisibleMessage?.createdAt && oldestVisibleMessage?._id
        ? this.encodeKeysetCursor(
            oldestVisibleMessage.createdAt,
            oldestVisibleMessage._id,
          )
        : null;

    return {
      messages: sanitizedMessages,
      nextCursor,
      hasMore,
    };
  }

  async fetchConversationSharedMedia(
    conversationId: string,
    requesterUserId: string,
    limit = DEFAULT_SHARED_MEDIA_PAGE_SIZE,
    cursor?: string,
  ): Promise<ConversationMessagePage> {
    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      participants: requesterUserId,
    });
    if (!conversation) {
      throw new ForbiddenException('Conversation not found or access denied');
    }

    const safeLimit = this.normalizeLimit(limit, {
      fallback: DEFAULT_SHARED_MEDIA_PAGE_SIZE,
      max: MAX_SHARED_MEDIA_PAGE_SIZE,
    });
    const cursorFilter = this.decodeKeysetCursor(cursor);

    let conversationIds: mongoose.Types.ObjectId[] = [conversation._id];
    if (
      Array.isArray(conversation.participants) &&
      conversation.participants.length === 2
    ) {
      const directConversationFamily = await this.getDirectConversationFamily(
        conversation.participants[0],
        conversation.participants[1],
      );
      if (directConversationFamily.length > 0) {
        conversationIds = directConversationFamily.map((item) => item._id);
      }
    }

    const filters: Record<string, any>[] = [
      {
        conversation: { $in: conversationIds },
      },
      {
        type: {
          $in: [
            MessageType.MEDIA,
            MessageType.MENU,
            MessageType.IN_MESSAGE_MEDIA,
          ],
        },
      },
      {
        media: { $exists: true, $ne: [] },
      },
    ];

    if (cursorFilter) {
      filters.push({
        $or: [
          { createdAt: { $lt: cursorFilter.date } },
          {
            createdAt: cursorFilter.date,
            _id: { $lt: cursorFilter.id },
          },
        ],
      });
    }

    const query = filters.length === 1 ? filters[0] : { $and: filters };

    const messageBatch = await this.messageModel
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit + 1)
      .select(
        '_id conversation sender reciever type media isPayable price paid title text createdAt updatedAt',
      )
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
        path: 'media',
        select:
          '_id url public_id type caption price isPayable paid post owner uploadedAt createdAt updatedAt __v',
      })
      .lean()
      .exec();

    const hasMore = messageBatch.length > safeLimit;
    const messages = hasMore ? messageBatch.slice(0, safeLimit) : messageBatch;
    await this.applyMediaPurchaseEntitlements(
      messages as any[],
      requesterUserId,
    );
    const sanitizedMessages = messages.map((message) =>
      this.sanitizeMessageForClient(message),
    );
    const oldestVisibleMessage = messages[messages.length - 1] as
      | { createdAt?: string | Date; _id?: string | mongoose.Types.ObjectId }
      | undefined;
    const nextCursor =
      hasMore && oldestVisibleMessage?.createdAt && oldestVisibleMessage?._id
        ? this.encodeKeysetCursor(
            oldestVisibleMessage.createdAt,
            oldestVisibleMessage._id,
          )
        : null;

    return {
      messages: sanitizedMessages,
      nextCursor,
      hasMore,
    };
  }

  async markConversationAsRead(
    conversationId: string,
    requesterUserId: string,
  ): Promise<{ updated: number }> {
    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      participants: requesterUserId,
    });
    if (!conversation) {
      throw new ForbiddenException('Conversation not found or access denied');
    }

    let conversationIds: mongoose.Types.ObjectId[] = [conversation._id];
    if (
      Array.isArray(conversation.participants) &&
      conversation.participants.length === 2
    ) {
      const directConversationFamily = await this.getDirectConversationFamily(
        conversation.participants[0],
        conversation.participants[1],
      );
      if (directConversationFamily.length > 0) {
        conversationIds = directConversationFamily.map((item) => item._id);
      }
    }

    const result = await this.messageModel.updateMany(
      {
        conversation: { $in: conversationIds },
        reciever: requesterUserId,
        status: { $ne: MessageStatus.READ },
      },
      {
        $set: { status: MessageStatus.READ },
      },
    );

    return {
      updated: result.modifiedCount ?? 0,
    };
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

    const participantKey = this.buildDirectConversationKey([
      user1._id,
      user2._id,
    ]);
    const conversation = await this.conversationModel
      .find({
        $or: [
          { participantKey },
          { participants: { $all: [user1._id, user2._id], $size: 2 } },
        ],
      })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(1)
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
      .lean()
      .then((rows) => rows[0] ?? null);

    if (conversation?.lastMessage) {
      this.sanitizeMessageForClient(conversation.lastMessage);
    }

    return conversation;
  }

  async getUserConversations(
    userId: string,
    options: ConversationListOptions = {},
  ): Promise<ConversationListPage> {
    const safeLimit = this.normalizeLimit(options.limit, {
      fallback: DEFAULT_CONVERSATION_PAGE_SIZE,
      max: MAX_CONVERSATION_PAGE_SIZE,
    });
    const mongoUserId = new mongoose.Types.ObjectId(userId);
    const totalUnreadCountPromise = this.messageModel.countDocuments({
      reciever: mongoUserId,
      status: { $ne: MessageStatus.READ },
    });
    const cursorFilter = this.decodeKeysetCursor(options.cursor);
    const filters: Record<string, any>[] = [{ participants: mongoUserId }];
    const trimmedSearch = options.search?.trim();

    if (trimmedSearch) {
      const searchRegex = new RegExp(
        `^${this.escapeRegex(trimmedSearch)}`,
        'i',
      );
      const matchingUsers = await this.userModel
        .find({
          _id: { $ne: mongoUserId },
          $or: [{ displayName: searchRegex }, { username: searchRegex }],
        })
        .select('_id')
        .limit(SEARCHED_CONVERSATION_USER_SCAN_LIMIT)
        .lean();

      if (matchingUsers.length === 0) {
        return {
          conversations: [],
          nextCursor: null,
          hasMore: false,
          totalUnreadCount: await totalUnreadCountPromise,
        };
      }

      filters.push({
        participants: { $in: matchingUsers.map((user) => user._id) },
      });
    }

    if (cursorFilter) {
      filters.push({
        $or: [
          { updatedAt: { $lt: cursorFilter.date } },
          {
            updatedAt: cursorFilter.date,
            _id: { $lt: cursorFilter.id },
          },
        ],
      });
    }

    const conversationQuery =
      filters.length === 1 ? filters[0] : { $and: filters };
    const rawConversationLimit = Math.min(
      safeLimit * 5,
      MAX_CONVERSATION_PAGE_SIZE * 5,
    );
    const conversationBatch = await this.conversationModel
      .find(conversationQuery)
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
      .sort({ updatedAt: -1, _id: -1 })
      .limit(rawConversationLimit + 1)
      .lean();

    if (!conversationBatch.length) {
      return {
        conversations: [],
        nextCursor: null,
        hasMore: false,
        totalUnreadCount: await totalUnreadCountPromise,
      };
    }

    const resolveParticipantId = (participant: any): string => {
      if (!participant) return '';
      if (participant instanceof mongoose.Types.ObjectId) {
        return participant.toString();
      }
      if (typeof participant === 'string') {
        return participant;
      }
      if (typeof participant === 'object') {
        if (participant._id) return participant._id.toString();
        if (participant.id) return participant.id.toString();
      }
      return '';
    };

    const getConversationGroupKey = (conversation: any): string => {
      const participantIds = (conversation?.participants ?? [])
        .map((participant: any) => resolveParticipantId(participant))
        .filter(Boolean)
        .sort((a: string, b: string) => a.localeCompare(b));

      if (participantIds.length === 2) {
        return this.buildDirectConversationKey(participantIds);
      }

      return `conversation:${conversation?._id?.toString?.() ?? ''}`;
    };

    const groupedConversationsMap = new Map<
      string,
      {
        groupKey: string;
        conversation: any;
        familyConversationIds: mongoose.Types.ObjectId[];
      }
    >();

    for (const conversation of conversationBatch) {
      const groupKey = getConversationGroupKey(conversation);
      const existing = groupedConversationsMap.get(groupKey);

      if (!existing) {
        groupedConversationsMap.set(groupKey, {
          groupKey,
          conversation,
          familyConversationIds: [conversation._id],
        });
        continue;
      }

      existing.familyConversationIds.push(conversation._id);

      const existingUpdatedAt = new Date(
        existing.conversation.updatedAt,
      ).getTime();
      const candidateUpdatedAt = new Date(
        (conversation as any).updatedAt,
      ).getTime();
      if (
        candidateUpdatedAt > existingUpdatedAt ||
        (candidateUpdatedAt === existingUpdatedAt &&
          conversation._id.toString() > existing.conversation._id.toString())
      ) {
        existing.conversation = conversation;
      }
    }

    const groupedConversations = Array.from(
      groupedConversationsMap.values(),
    ).sort((a, b) => {
      const updatedAtDelta =
        new Date(b.conversation.updatedAt).getTime() -
        new Date(a.conversation.updatedAt).getTime();
      if (updatedAtDelta !== 0) return updatedAtDelta;
      return b.conversation._id
        .toString()
        .localeCompare(a.conversation._id.toString());
    });

    const hasMore =
      groupedConversations.length > safeLimit ||
      conversationBatch.length > rawConversationLimit;
    const visibleConversationGroups = hasMore
      ? groupedConversations.slice(0, safeLimit)
      : groupedConversations;
    const visibleConversations = visibleConversationGroups.map(
      (item) => item.conversation,
    );

    const unreadCounts = await this.messageModel.aggregate([
      {
        $match: {
          reciever: mongoUserId,
          status: { $ne: MessageStatus.READ },
          conversation: {
            $in: visibleConversationGroups.flatMap(
              (item) => item.familyConversationIds,
            ),
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

    const conversationIdToGroupKey = new Map<string, string>();
    for (const group of visibleConversationGroups) {
      for (const conversationObjectId of group.familyConversationIds) {
        conversationIdToGroupKey.set(
          conversationObjectId.toString(),
          group.groupKey,
        );
      }
    }

    const unreadCountByGroupKey = new Map<string, number>();
    for (const unreadEntry of unreadCounts) {
      const groupKey = conversationIdToGroupKey.get(unreadEntry._id.toString());
      if (!groupKey) continue;
      const current = unreadCountByGroupKey.get(groupKey) ?? 0;
      unreadCountByGroupKey.set(groupKey, current + unreadEntry.count);
    }

    const conversationsWithUnreadCount = visibleConversationGroups.map(
      (group) => {
        const nextConversation = {
          ...group.conversation,
          unreadCount: unreadCountByGroupKey.get(group.groupKey) || 0,
        };
        if ((nextConversation as any)?.lastMessage) {
          this.sanitizeMessageForClient((nextConversation as any).lastMessage);
        }
        return nextConversation;
      },
    );

    const oldestVisibleConversation = visibleConversations[
      visibleConversations.length - 1
    ] as
      | { updatedAt?: string | Date; _id?: string | mongoose.Types.ObjectId }
      | undefined;
    const nextCursor =
      hasMore &&
      oldestVisibleConversation?.updatedAt &&
      oldestVisibleConversation?._id
        ? this.encodeKeysetCursor(
            oldestVisibleConversation.updatedAt,
            oldestVisibleConversation._id,
          )
        : null;

    return {
      conversations: conversationsWithUnreadCount,
      nextCursor,
      hasMore,
      totalUnreadCount: await totalUnreadCountPromise,
    };
  }

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

  async deleteNote(id: string, requesterDiscordId: string) {
    const requester = await this.userModel
      .findOne({ discordId: requesterDiscordId })
      .select('_id');
    if (!requester) throw new NotFoundException('User not found');

    const result = await this.chatNoteModel.findOneAndDelete({
      _id: id,
      $or: [{ seller: requester._id }, { buyer: requester._id }],
    });
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

    const conversation = await this.getOrCreateDirectConversation(
      caller._id,
      callee._id,
    );

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

  async markCallOngoingForParticipant(
    callId: string,
    requesterDiscordId: string,
  ): Promise<Message> {
    const call = await this.messageModel
      .findById(callId)
      .populate<{ sender?: { discordId?: string } }>('sender', 'discordId')
      .populate<{ reciever?: { discordId?: string } }>('reciever', 'discordId');

    if (!call) throw new NotFoundException('Call not found');

    const callerDiscordId = call.sender?.discordId;
    const calleeDiscordId = call.reciever?.discordId;
    if (
      requesterDiscordId !== callerDiscordId &&
      requesterDiscordId !== calleeDiscordId
    ) {
      throw new ForbiddenException('Not authorized for this call');
    }

    if (call.callStatus === CallStatus.ONGOING) {
      const ongoing = await this.messageModel.findById(callId);
      if (!ongoing) throw new NotFoundException('Call not found');
      return ongoing;
    }

    const updated = await this.messageModel.findByIdAndUpdate(
      callId,
      { callStatus: CallStatus.ONGOING, callStartedAt: new Date() },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Call not found');
    return updated;
  }

  /**
   * End the call and finalize billing
   */
  async endCall(dto: EndCallDto, requesterDiscordId?: string) {
    const call = await this.messageModel
      .findById(dto.callId)
      .populate<{ sender?: { discordId?: string } }>('sender', 'discordId')
      .populate<{ reciever?: { discordId?: string } }>('reciever', 'discordId');
    if (!call) throw new NotFoundException('Call session not found');

    const callerDiscordId = call.sender?.discordId;
    const calleeDiscordId = call.reciever?.discordId;
    if (!callerDiscordId || !calleeDiscordId) {
      throw new BadRequestException('Call participants are invalid');
    }

    if (
      requesterDiscordId &&
      requesterDiscordId !== callerDiscordId &&
      requesterDiscordId !== calleeDiscordId
    ) {
      throw new ForbiddenException('Not authorized to end this call');
    }

    if (call.callStatus === CallStatus.ENDED && call.paid && call.paymentTx) {
      return call;
    }

    const callEndTime = new Date();
    const startedAt = call.callStartedAt?.getTime();
    const computedDurationInSeconds =
      typeof startedAt === 'number'
        ? Math.max(0, Math.ceil((callEndTime.getTime() - startedAt) / 1000))
        : 0;
    const durationInSeconds = Math.max(
      0,
      Math.ceil(dto.duration ?? computedDurationInSeconds),
    );

    if (dto.callStatus === CallStatus.ENDED) {
      const paymentTx = await this.paymentService.payForCall({
        callerId: callerDiscordId,
        calleeId: calleeDiscordId,
        callId: dto.callId,
        amount: 0,
        duration: durationInSeconds,
      });

      const paymentId = paymentTx?.tx?._id?.toString?.();
      if (!paymentId) {
        throw new BadRequestException(
          'Call payment settlement did not return an id',
        );
      }

      const UpdatedCall = await this.messageModel.findByIdAndUpdate(
        call._id.toString(),
        {
          callEndedAt: callEndTime,
          durationInSeconds: durationInSeconds,
          callStatus: CallStatus.ENDED,
          paid: true,
          paymentTx: paymentId,
        },
        { new: true },
      );

      return UpdatedCall;
    } else {
      return this.messageModel.findByIdAndUpdate(
        dto.callId,
        {
          callStatus: dto.callStatus,
          callEndedAt: callEndTime,
          durationInSeconds,
          missed: dto.callStatus === CallStatus.MISSED,
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

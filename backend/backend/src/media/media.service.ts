import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Media } from 'src/database/schemas/media.schema';
import { User } from 'src/database/schemas/user.schema';
import { Message, MessageType } from 'src/database/schemas/message.schema';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from 'src/database/schemas/payment.schema';

type MediaAccessMessage = {
  _id: unknown;
  sender?: unknown;
  reciever?: unknown;
  isPayable?: boolean;
  paid?: boolean;
  type?: MessageType;
};

@Injectable()
export class MediaService {
  private logger = new Logger(MediaService.name);

  constructor(
    @InjectModel(Media.name) private readonly mediaModel: Model<Media>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
  ) {}

  async findById(id: string): Promise<Media | null> {
    return this.mediaModel.findById(id).lean();
  }

  private isFreePreviewCaption(caption?: string): boolean {
    if (!caption) return false;
    const normalized = caption.toLowerCase();
    return (
      normalized.includes('free preview') || normalized.includes('cover image')
    );
  }

  private async evaluateMessageMediaAccess(
    message: MediaAccessMessage | null,
    requesterId: string,
    requesterObjectId: unknown,
    mediaCaption?: string,
  ): Promise<'allow' | 'locked' | 'deny'> {
    if (!message) {
      return 'deny';
    }

    const isSender = message.sender?.toString() === requesterId;
    const isReceiver = message.reciever?.toString() === requesterId;

    if (!isSender && !isReceiver) {
      return 'deny';
    }

    if (isSender || !message.isPayable) {
      return 'allow';
    }

    if (message.type !== MessageType.IN_MESSAGE_MEDIA) {
      return message.paid ? 'allow' : 'locked';
    }

    if (this.isFreePreviewCaption(mediaCaption)) {
      return 'allow';
    }

    const hasPaidEntitlement = await this.paymentModel.exists({
      type: PaymentType.MEDIA_PURCHASE,
      status: PaymentStatus.COMPLETED,
      payer: requesterObjectId,
      'meta.MessageAsset': message._id.toString(),
    });

    return hasPaidEntitlement ? 'allow' : 'locked';
  }

  async assertCanReadMedia(
    mediaId: string,
    requesterDiscordId: string,
  ): Promise<Media> {
    const [media, requester] = await Promise.all([
      this.mediaModel.findById(mediaId).lean(),
      this.userModel
        .findOne({ discordId: requesterDiscordId })
        .select('_id')
        .lean(),
    ]);

    if (!media) {
      throw new NotFoundException('Media not found');
    }
    if (!requester) {
      throw new ForbiddenException('Unauthorized media request');
    }

    const requesterId = requester._id.toString();
    if (media.owner?.toString() === requesterId) {
      return media;
    }

    if (media.chat) {
      const message = await this.messageModel
        .findById(media.chat)
        .select('_id sender reciever isPayable paid type')
        .lean();

      const mediaAccess = await this.evaluateMessageMediaAccess(
        message as MediaAccessMessage | null,
        requesterId,
        requester._id,
        media.caption,
      );
      if (mediaAccess === 'allow') {
        return media;
      }
      if (mediaAccess === 'locked') {
        throw new ForbiddenException('This media is locked');
      }
    }

    // Menu/feed purchases can reference media on a message while leaving media.chat unset.
    const referencedMessage = await this.messageModel
      .findOne({
        media: media._id,
        $or: [{ sender: requester._id }, { reciever: requester._id }],
      })
      .sort({ createdAt: -1, _id: -1 })
      .select('_id sender reciever isPayable paid type')
      .lean();

    const referencedAccess = await this.evaluateMessageMediaAccess(
      referencedMessage as MediaAccessMessage | null,
      requesterId,
      requester._id,
      media.caption,
    );
    if (referencedAccess === 'allow') {
      return media;
    }
    if (referencedAccess === 'locked') {
      throw new ForbiddenException('This media is locked');
    }

    throw new ForbiddenException('Media access denied');
  }
}

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

      if (!message) {
        throw new ForbiddenException('Media access denied');
      }

      const isSender = message.sender?.toString() === requesterId;
      const isReceiver = message.reciever?.toString() === requesterId;

      if (!isSender && !isReceiver) {
        throw new ForbiddenException('Media access denied');
      }

      if (isSender || !message.isPayable) {
        return media;
      }

      if (message.type !== MessageType.IN_MESSAGE_MEDIA) {
        if (message.paid) {
          return media;
        }
        throw new ForbiddenException('This media is locked');
      }

      if (
        message.type === MessageType.IN_MESSAGE_MEDIA &&
        this.isFreePreviewCaption(media.caption)
      ) {
        return media;
      }

      const hasPaidEntitlement = await this.paymentModel.exists({
        type: PaymentType.MEDIA_PURCHASE,
        status: PaymentStatus.COMPLETED,
        payer: requester._id,
        'meta.MessageAsset': message._id.toString(),
      });
      if (hasPaidEntitlement) {
        return media;
      }

      throw new ForbiddenException('This media is locked');
    }

    throw new ForbiddenException('Media access denied');
  }
}

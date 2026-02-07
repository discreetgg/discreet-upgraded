import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from './dto/email.dto';
import { Notification } from 'src/database/schemas/notification.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ChatGateway } from 'src/chat/chat.gateway';
import { CreateNotificationDto } from './dto/in-app-notification.dto';
import { User } from 'src/database/schemas/user.schema';
import { ReadDto } from './dto/read-notification.dto';
import { DiscordBotService } from 'src/discord-bot/discord-bot.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @Inject(forwardRef(() => ChatGateway))
    private readonly notificationGateway: ChatGateway,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject(forwardRef(() => DiscordBotService))
    private readonly discordBotService: DiscordBotService,
  ) {}

  private async emailTransport() {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    return transporter;
  }

  async sendEmail(dto: SendEmailDto) {
    const { recipients, subject, html } = dto;

    const transport = await this.emailTransport();

    const options: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients,
      subject: subject,
      html: html,
    };
    try {
      return await transport.sendMail(options);
      console.log('Email sent successfully');
    } catch (error) {
      console.log('Error sending mail: ', error);
    }
  }

  async sendDiscordNotification() {}

  async createInAppNotication(data: CreateNotificationDto) {
    const notification = await this.notificationModel.create(data);

    await notification.populate([
      {
        path: 'user',
        select:
          'username discordAvatar profileImage discordId discordNotification',
      },
      {
        path: 'sender',
        select: 'username discordAvatar profileImage discordId',
      },
    ]);

    // Convert to plain object WITHOUT applying toJSON transform
    const raw = notification.toObject({ getters: false, virtuals: false });

    // Emit realtime event
    await this.notificationGateway.emitToUser(
      data.user,
      'notification:new',
      raw,
    );

    const user: any = notification.user;
    const sender: any = notification.sender;

    if (user?.discordNotification?.enabled && user?.discordId) {
      let message = '';

      switch (data.entityType) {
        case 'Tip':
          if (user.discordNotification.tip) {
            message = `@${sender?.username || 'Someone'} tipped you $${notification.metadata?.amount}`;
          }
          break;
        case 'Follow':
          if (user.discordNotification.newFollower) {
            message = `@${sender?.username || 'Someone'} started following you`;
          }
          break;
        case 'Like':
          if (user.discordNotification.newLike) {
            message = `@${sender?.username || 'Someone'} liked your post`;
          }
          break;
        case 'Comment':
          if (user.discordNotification.newComment) {
            message = `@${sender?.username || 'Someone'} commented on your post`;
          }
          break;
      }

      if (message) {
        await this.discordBotService.sendDiscordBotNotification(
          message,
          user.discordId,
        );
      }
    }

    return notification;
  }

  async getUserNotifications(
    discordId: string,
    page = 1,
    limit = 20,
  ): Promise<any> {
    const user = await this.userModel.findOne({ discordId });
    if (!user) throw new NotFoundException('User not found');
    const skip = (page - 1) * limit;

    const notifications = await this.notificationModel
      .find({ user: user._id.toString() })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username discordAvatar profileImage  discordId')
      .populate('sender', 'username discordAvatar profileImage  discordId')
      .lean();

    const unreadCount = await this.notificationModel.countDocuments({
      user,
      isRead: false,
    });

    return { notifications, unreadCount };
  }

  async markAsRead(data: ReadDto) {
    const user = await this.userModel.findOne({ discordId: data.discordId });
    if (!user) throw new NotFoundException('User not found');

    const filter: any = { user: user._id, isRead: false };

    const result = await this.notificationModel.updateOne(filter, {
      $set: { isRead: true },
    });

    // Emit count update
    const unreadCount = await this.notificationModel.countDocuments({
      user,
      isRead: false,
    });

    this.notificationGateway.emitToUser(
      user._id.toString(),
      'notification:count',
      unreadCount,
    );

    return { updated: result.modifiedCount, unreadCount };
  }
}

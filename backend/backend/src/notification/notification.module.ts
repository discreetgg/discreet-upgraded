import { forwardRef, Module } from '@nestjs/common';
import { DiscordBotModule } from 'src/discord-bot/discord-bot.module';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from 'src/database/schemas/notification.schema';
import { ChatModule } from 'src/chat/chat.module';
import { User, UserSchema } from 'src/database/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    forwardRef(() => ChatModule),
    forwardRef(() => DiscordBotModule),
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}

import { forwardRef, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationSchema,
} from 'src/database/schemas/conversation.schema';
import { Message, MessageSchema } from 'src/database/schemas/message.schema';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { FileUploaderModule } from 'src/file-uploader/file-uploader.module';
import { Media, MediaSchema } from 'src/database/schemas/media.schema';
import { ChatGateway } from './chat.gateway';
import { WalletModule } from 'src/wallet/wallet.module';
import { PaymentModule } from 'src/payment/payment.module';
import { Payment, PaymentSchema } from 'src/database/schemas/payment.schema';
import {
  ChatNote,
  ChatNoteSchema,
} from 'src/database/schemas/chat-note.schema';
import {
  InMessageMedia,
  InMessageMediaSchema,
} from 'src/database/schemas/in-message-media.schema';

@Module({
  imports: [
    JwtModule,
    FileUploaderModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Media.name, schema: MediaSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: ChatNote.name, schema: ChatNoteSchema },
      { name: InMessageMedia.name, schema: InMessageMediaSchema },
    ]),
    WalletModule,
    forwardRef(() => PaymentModule),
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { Post, PostSchema } from 'src/database/schemas/post.schema';
import { Message, MessageSchema } from 'src/database/schemas/message.schema';
import {
  Conversation,
  ConversationSchema,
} from 'src/database/schemas/conversation.schema';
import { Media, MediaSchema } from 'src/database/schemas/media.schema';
import { FileUploaderModule } from 'src/file-uploader/file-uploader.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Media.name, schema: MediaSchema },
    ]),
    FileUploaderModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

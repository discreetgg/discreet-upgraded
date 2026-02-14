import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from 'src/database/schemas/media.schema';
import { MediaService } from './media.service';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { Message, MessageSchema } from 'src/database/schemas/message.schema';
import { JwtModule } from '@nestjs/jwt';
import { Payment, PaymentSchema } from 'src/database/schemas/payment.schema';

@Module({
  imports: [
    HttpModule,
    JwtModule,
    MongooseModule.forFeature([
      { name: Media.name, schema: MediaSchema },
      { name: User.name, schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  providers: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {}

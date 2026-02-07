import { Module } from '@nestjs/common';
import { CreatorService } from './creator.service';
import { CreatorController } from './creator.controller';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import {
  Server,
  ServerSchema,
} from 'src/database/schemas/discord-server.schema';
import { Like, LikeSchema } from 'src/database/schemas/like.schema';
import { DiscordBotModule } from 'src/discord-bot/discord-bot.module';

@Module({
  imports: [
    JwtModule,
    DiscordBotModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Server.name, schema: ServerSchema }]),
    MongooseModule.forFeature([{ name: Like.name, schema: LikeSchema }]),
  ],
  providers: [CreatorService],
  controllers: [CreatorController],
})
export class CreatorModule {}

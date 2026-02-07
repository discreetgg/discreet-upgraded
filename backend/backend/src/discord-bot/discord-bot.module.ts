import { Module, forwardRef } from '@nestjs/common';
import { DiscordBotService } from './discord-bot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import * as dotenv from 'dotenv';
import { UserModule } from 'src/user/user.module';
dotenv.config();

@Module({
  imports: [
    forwardRef(() => UserModule),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [
    {
      provide: 'DISCORD_BOT_TOKEN',
      useValue: process.env.DISCORD_BOT_TOKEN,
    },
    { provide: 'DISCORD_BOT_ID', useValue: process.env.DISCORD_BOT_ID },
    DiscordBotService,
  ],
  exports: [DiscordBotService],
})
export class DiscordBotModule {}

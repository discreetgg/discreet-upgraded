import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from 'src/database/schemas/media.schema';
import { MediaService } from './media.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
  ],
  providers: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {}

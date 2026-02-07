import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Media } from 'src/database/schemas/media.schema';

@Injectable()
export class MediaService {
  private logger = new Logger(MediaService.name);

  constructor(
    @InjectModel(Media.name) private readonly mediaModel: Model<Media>,
  ) {}
  async findById(id: string): Promise<Media | null> {
    return this.mediaModel.findById(id).lean();
  }
}

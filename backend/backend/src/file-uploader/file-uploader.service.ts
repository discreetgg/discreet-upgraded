// file-uploader/file-uploader.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { UploaderService } from './interfaces/uploader.interface';
import { UPLOADER_SERVICE } from './constant';

@Injectable()
export class FileUploaderService {
  constructor(
    @Inject(UPLOADER_SERVICE)
    private readonly uploaderService: UploaderService,
  ) {}

  uploadImage(file: Express.Multer.File) {
    return this.uploaderService.uploadImage(file);
  }

  uploadVideo(file: Express.Multer.File) {
    return this.uploaderService.uploadVideo(file);
  }

  deleteFile(publicId: string, resourceType?: 'image' | 'video') {
    return this.uploaderService.deleteFile(publicId, resourceType);
  }
}

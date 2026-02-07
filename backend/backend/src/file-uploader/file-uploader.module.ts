import { Module } from '@nestjs/common';
import { FileUploaderService } from './file-uploader.service';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { UPLOADER_SERVICE } from './constant';

@Module({
  providers: [
    {
      provide: UPLOADER_SERVICE,
      useClass: CloudinaryProvider,
    },
    FileUploaderService,
    CloudinaryProvider,
  ],
  exports: [FileUploaderService],
})
export class FileUploaderModule {}

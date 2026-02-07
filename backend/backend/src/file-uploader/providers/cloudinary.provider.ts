import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import {
  UploaderService,
  FileUploadResponse,
} from '../interfaces/uploader.interface';

@Injectable()
export class CloudinaryProvider implements UploaderService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  uploadImage(file: Express.Multer.File): Promise<FileUploadResponse> {
    console.log(file);
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: 'image', folder: 'uploads/images' },
          (error, result) => {
            if (error) return reject(error);
            resolve({ url: result.secure_url, public_id: result.public_id });
          },
        )
        .end(file.buffer);
    });
  }

  uploadVideo(file: Express.Multer.File): Promise<FileUploadResponse> {
    try {
      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: 'video', folder: 'uploads/videos' },
            (error, result) => {
              if (error) return reject(error);
              resolve({ url: result.secure_url, public_id: result.public_id });
            },
          )
          .end(file.buffer);
      });
    } catch (error) {
      console.error('Error in UploadController.upload:', error);
      throw new InternalServerErrorException('Upload failed');
    }
  }

  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' = 'image',
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
    });
  }
}

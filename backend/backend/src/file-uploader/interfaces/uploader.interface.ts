export interface FileUploadResponse {
  url: string;
  public_id?: string;
}

export interface UploaderService {
  uploadImage(file: Express.Multer.File): Promise<FileUploadResponse>;
  uploadVideo(file: Express.Multer.File): Promise<FileUploadResponse>;
  /**
   * Delete a file from the provider (Cloudinary, S3, etc.)
   * @param publicId - The provider's public identifier of the file
   * @param resourceType - Optional: 'image' | 'video'
   */
  deleteFile(publicId: string, resourceType?: 'image' | 'video'): Promise<any>;
}

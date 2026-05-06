import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  /**
   * Uploads a file to Cloudinary and returns the response.
   * @param file The file from Multer (Express.Multer.File)
   * @param folder Optional folder name in Cloudinary
   * @returns Promise with Cloudinary upload response
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'we-watch-v2'
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload failed: Result is undefined'));
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Helper to specifically upload thumbnails or other specific types if needed
   */
  async uploadThumbnail(file: Express.Multer.File) {
    return this.uploadFile(file, 'thumbnails');
  }

  /**
   * Uploads a file with a temporary tag for pre-upload flow.
   */
  async uploadTemporary(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'temp',
          tags: ['temporary'],
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload failed'));
          }
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Updates tags for an existing image to make it permanent.
   */
  async makePermanent(publicId: string, tag: string = 'user_avatar') {
    await cloudinary.uploader.replace_tag(tag, [publicId]);
    // Also move it out of temp folder if needed, but for now just tags is enough
    // Or we can use rename to move folders, but tags are easier for management
  }

  async uploadAvatar(file: Express.Multer.File) {
      return this.uploadFile(file, 'avatars');
  }
}

import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { UploadService } from './upload.service';
import { S3Service } from './s3.service';
import { UploadController } from './upload.controller';

@Module({
  controllers: [UploadController],
  providers: [CloudinaryProvider, UploadService, S3Service],
  exports: [CloudinaryProvider, UploadService, S3Service],
})
export class UploadModule {}

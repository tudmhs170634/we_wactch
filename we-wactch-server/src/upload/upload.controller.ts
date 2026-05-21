import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @Throttle({ upload: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const result = await this.uploadService.uploadTemporary(file);
    return { url: result.secure_url, publicId: result.public_id };
  }

  @Post('thumbnail')
  @Throttle({ upload: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadThumbnail(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const result = await this.uploadService.uploadThumbnail(file);
    return { url: result.secure_url, publicId: result.public_id };
  }
}

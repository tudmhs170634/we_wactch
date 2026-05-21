import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../upload/s3.service';
import { RedisService } from '../redis/redis.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { Video } from '@prisma/client';


const VIDEO_LIST_KEY = (page: number, limit: number) =>
  `videos:list:${page}:${limit}`;
const VIDEO_KEY = (id: string) => `videos:item:${id}`;
const VIDEO_TTL = 60; // 60 giây

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly redis: RedisService,
  ) {}

  async getPresignedUrl(mimeType: string) {
    return this.s3.getPresignedUploadUrl('videos', mimeType);
  }

  async create(userId: string, dto: CreateVideoDto) {
    const video = await this.prisma.video.create({
      data: {
        title: dto.title,
        description: dto.description,
        videoUrl: dto.videoUrl,
        videoKey: dto.videoKey,
        thumbnailUrl: dto.thumbnailUrl,
        duration: dto.duration,
        size: dto.size,
        ownerId: userId,
        isActive: false,
      },
    });
    // Xóa cache list sau khi tạo mới
    await this.redis.del(VIDEO_LIST_KEY(1, 12), VIDEO_LIST_KEY(1, 50));

    // Chạy faststart optimization bất đồng bộ (không chờ)
    this.processVideoFaststart(video.id, video.videoKey).catch((err) => {
      this.logger.error(`Faststart failed for video ${video.id}: ${err.message}`);
    });

    return video;
  }

  /**
   * Tải video từ S3 → Pure JS faststart → Upload lại
   * Chạy background, không ảnh hưởng UX
   * Không cần cài FFmpeg
   */
  private async processVideoFaststart(videoId: string, videoKey: string) {
    const { mkdirSync, unlinkSync, existsSync } = await import('fs');
    const { join } = await import('path');
    const { mp4Faststart } = await import('../utils/mp4-faststart.js');

    const tmpDir = join(process.cwd(), 'tmp_videos');
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

    const inputPath = join(tmpDir, `${videoId}_input.mp4`);
    const outputPath = join(tmpDir, `${videoId}_faststart.mp4`);

    try {
      // 1. Download từ S3
      this.logger.log(`[Faststart] Downloading video ${videoId}...`);
      await this.s3.downloadFile(videoKey, inputPath);

      // 2. Pure JS faststart (di chuyển moov atom, không re-encode)
      this.logger.log(`[Faststart] Processing video ${videoId}...`);
      const success = await mp4Faststart(inputPath, outputPath);

      if (!success) {
        this.logger.warn(`[Faststart] Could not process video ${videoId}`);
        return;
      }

      // 3. Upload lại lên S3 (cùng key, ghi đè file cũ)
      this.logger.log(`[Faststart] Uploading optimized video ${videoId}...`);
      await this.s3.uploadFile(videoKey, outputPath, 'video/mp4');

      this.logger.log(`[Faststart] ✅ Video ${videoId} optimized successfully`);
    } catch (err: any) {
      this.logger.error(`[Faststart] ❌ Error: ${err.message}`);
    } finally {
      // 4. Dọn file tạm
      try { unlinkSync(inputPath); } catch {}
      try { unlinkSync(outputPath); } catch {}
    }
  }



  async findAll(page = 1, limit = 12, search?: string) {
    try {
      const cacheKey = search ? null : VIDEO_LIST_KEY(page, limit);

      if (cacheKey) {
        const cached = await this.redis.get(cacheKey);
        if (cached) return cached;
      }

      const skip = (page - 1) * limit;
      const where = search
        ? {
            title: { contains: search, mode: 'insensitive' as const },
            isActive: true,
          }
        : { isActive: true };

      const [videos, total] = await Promise.all([
        this.prisma.video.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: { select: { id: true, username: true, avatarUrl: true } },
          },
        }),
        this.prisma.video.count({ where }),
      ]);

      const result = { videos, total, page, limit };
      if (cacheKey) {
        await this.redis.set(cacheKey, result, VIDEO_TTL);
      }
      return result;
    } catch (error: any) {
      this.logger.error(`FindAll videos error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllAdmin(page = 1, limit = 50, search?: string) {
    const where = search
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {};
    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.video.count({ where }),
    ]);
    return { videos, total, page, totalPages: Math.ceil(total / limit) };
  }

  async approve(id: string) {
    const existing = await this.prisma.video.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Video not found');

    const updated = await this.prisma.video.update({
      where: { id },
      data: { isActive: true },
    });

    await this.redis.del(
      VIDEO_KEY(id),
      VIDEO_LIST_KEY(1, 12),
      VIDEO_LIST_KEY(1, 50),
    );
    return updated;
  }

  async findOne(id: string): Promise<
    Video & {
      owner: { id: string; username: string; avatarUrl: string | null };
    }
  > {
    const cacheKey = VIDEO_KEY(id);
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
    if (!video) throw new NotFoundException('Video not found');

    await this.redis.set(cacheKey, video, VIDEO_TTL);
    return video;
  }

  async update(id: string, userId: string, dto: UpdateVideoDto) {
    const video = await this.findOne(id);
    if (video.ownerId !== userId) throw new ForbiddenException();
    const updated = await this.prisma.video.update({
      where: { id },
      data: dto,
    });
    await this.redis.del(
      VIDEO_KEY(id),
      VIDEO_LIST_KEY(1, 12),
      VIDEO_LIST_KEY(1, 50),
    );
    return updated;
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const video = await this.findOne(id);
    if (!isAdmin && video.ownerId !== userId) throw new ForbiddenException();
    await this.s3.deleteFile(video.videoKey);
    await this.redis.del(
      VIDEO_KEY(id),
      VIDEO_LIST_KEY(1, 12),
      VIDEO_LIST_KEY(1, 50),
    );
    return this.prisma.video.delete({ where: { id } });
  }
}

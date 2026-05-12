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
    return video;
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

  async findAllAdmin(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),
      this.prisma.video.count(),
    ]);

    return { videos, total, page, limit };
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

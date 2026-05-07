import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../upload/s3.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@Injectable()
export class VideoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly s3: S3Service,
    ) {}

    async getPresignedUrl(mimeType: string) {
        return this.s3.getPresignedUploadUrl('videos', mimeType);
    }

    async create(userId: string, dto: CreateVideoDto) {
        return this.prisma.video.create({
            data: {
                title: dto.title,
                description: dto.description,
                videoUrl: dto.videoUrl,
                videoKey: dto.videoKey,
                thumbnailUrl: dto.thumbnailUrl,
                duration: dto.duration,
                size: dto.size,
                ownerId: userId,
            },
        });
    }

    async findAll(page = 1, limit = 12) {
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

    async findOne(id: string) {
        const video = await this.prisma.video.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, username: true, avatarUrl: true } },
            },
        });
        if (!video) throw new NotFoundException('Video not found');
        return video;
    }

    async update(id: string, userId: string, dto: UpdateVideoDto) {
        const video = await this.findOne(id);
        if (video.ownerId !== userId) throw new ForbiddenException();
        return this.prisma.video.update({ where: { id }, data: dto });
    }

    async remove(id: string, userId: string) {
        const video = await this.findOne(id);
        if (video.ownerId !== userId) throw new ForbiddenException();
        await this.s3.deleteFile(video.videoKey);
        return this.prisma.video.delete({ where: { id } });
    }
}

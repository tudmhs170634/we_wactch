import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room, RoomType } from '@prisma/client';

type RoomWithRelations = Room & {
    host: { id: string; username: string; avatarUrl: string | null } | null;
    video: { id: string; title: string; thumbnailUrl: string | null } | null;
};

const slugify = (title: string): string => {
    const base = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 50);
    const suffix = Math.random().toString(36).slice(2, 7);
    return `${base}-${suffix}`;
};

const ROOM_LIST_KEY = (page: number, limit: number, type?: string) => `rooms:list:${page}:${limit}:${type || 'all'}`;
const ROOM_KEY = (id: string) => `rooms:item:${id}`;
const ROOM_SLUG_KEY = (slug: string) => `rooms:slug:${slug}`;
const TTL = 60;

@Injectable()
export class RoomService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) {}

    async create(userId: string, dto: CreateRoomDto) {
        if (dto.type === 'private' && !dto.password) {
            throw new BadRequestException('Phòng private phải có password.');
        }

        const slug = slugify(dto.title);

        const room = await this.prisma.room.create({
            data: {
                title: dto.title,
                slug,
                type: (dto.type as RoomType) ?? RoomType.public,
                hostId: userId,
                videoId: dto.videoId ?? null,
                password: dto.password ?? null,
                maxUsers: dto.maxUsers ?? 5,
            },
            include: {
                host: { select: { id: true, username: true, avatarUrl: true } },
                video: { select: { id: true, title: true, thumbnailUrl: true, videoUrl: true } },
            },
        });

        // Xóa cache list
        await this.redis.del(ROOM_LIST_KEY(1, 10), ROOM_LIST_KEY(1, 20), ROOM_LIST_KEY(1, 100));
        return room;
    }

    async findAll(page = 1, limit = 10, type?: string, onlyActive = false) {
        const cacheKey = ROOM_LIST_KEY(page, limit, type);
        const cached = await this.redis.get(cacheKey);
        if (cached) return cached;

        const skip = (page - 1) * limit;
        const where: any = {};
        if (onlyActive) where.isActive = true;
        if (type) {
            if (type !== RoomType.private && type !== RoomType.public) {
                throw new BadRequestException('Invalid room type');
            }
            where.type = type as RoomType;
        }

        const [rooms, total] = await Promise.all([
            this.prisma.room.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    host: { select: { id: true, username: true, avatarUrl: true } },
                    video: { select: { id: true, title: true, thumbnailUrl: true, videoUrl: true } },
                },
            }),
            this.prisma.room.count({ where }),
        ]);

        const result = { rooms, total, page, limit };
        await this.redis.set(cacheKey, result, TTL);
        return result;
    }

    async findOne(id: string): Promise<RoomWithRelations> {
        const cached = await this.redis.get<RoomWithRelations>(ROOM_KEY(id));
        if (cached) return cached;

        const room = await this.prisma.room.findUnique({
            where: { id },
            include: {
                host: { select: { id: true, username: true, avatarUrl: true } },
                video: { select: { id: true, title: true, thumbnailUrl: true, videoUrl: true } },
            },
        });
        if (!room) throw new NotFoundException('Room not found');

        await this.redis.set(ROOM_KEY(id), room, TTL);
        return room;
    }

    async findBySlug(slug: string): Promise<RoomWithRelations> {
        const cached = await this.redis.get<RoomWithRelations>(ROOM_SLUG_KEY(slug));
        if (cached) return cached;

        const room = await this.prisma.room.findUnique({
            where: { slug },
            include: {
                host: { select: { id: true, username: true, avatarUrl: true } },
                video: { select: { id: true, title: true, thumbnailUrl: true, videoUrl: true } },
            },
        });
        if (!room) throw new NotFoundException('Room not found');

        await this.redis.set(ROOM_SLUG_KEY(slug), room, TTL);
        return room;
    }

    async update(id: string, userId: string, dto: UpdateRoomDto) {
        const room = await this.findOne(id);
        if (room.hostId !== userId) throw new ForbiddenException();

        if (dto.type === 'private' && !dto.password && !room.password) {
            throw new BadRequestException('Phòng private phải có password.');
        }

        const updated = await this.prisma.room.update({
            where: { id },
            data: {
                title: dto.title,
                type: dto.type as RoomType,
                videoId: dto.videoId,
                password: dto.password,
                maxUsers: dto.maxUsers,
                isActive: dto.isActive,
            },
            include: {
                host: { select: { id: true, username: true, avatarUrl: true } },
                video: { select: { id: true, title: true, thumbnailUrl: true, videoUrl: true } },
            },
        });

        await this.redis.del(
            ROOM_KEY(id),
            ROOM_SLUG_KEY(room.slug),
            ROOM_LIST_KEY(1, 10),
            ROOM_LIST_KEY(1, 20),
        );
        return updated;
    }

    async remove(id: string, userId: string) {
        const room = await this.findOne(id);
        if (room.hostId !== userId) throw new ForbiddenException();

        await this.prisma.room.delete({ where: { id } });
        await this.redis.del(
            ROOM_KEY(id),
            ROOM_SLUG_KEY(room.slug),
            ROOM_LIST_KEY(1, 10),
            ROOM_LIST_KEY(1, 20),
        );
        return { message: 'Room deleted' };
    }

    async verifyPassword(id: string, password: string) {
        const room = await this.findOne(id);
        if (room.type === 'public') return { ok: true };
        if (room.password !== password) throw new ForbiddenException('Sai mật khẩu phòng.');
        return { ok: true };
    }
}

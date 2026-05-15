import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UploadService } from '../upload/upload.service';
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

import { Subject } from 'rxjs';

@Injectable()
export class RoomService {
  public readonly roomListUpdated$ = new Subject<void>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly uploadService: UploadService,
  ) {}

  async create(
    userId: string,
    dto: CreateRoomDto,
    imageFile?: Express.Multer.File,
  ) {
    if (dto.type === 'private' && !dto.password) {
      throw new BadRequestException('Phòng private phải có password.');
    }

    const slug = slugify(dto.title);

    let imageUrl: string | null = dto.imageUrl?.trim()
      ? dto.imageUrl.trim()
      : null;
    if (imageFile) {
      const uploaded = await this.uploadService.uploadFile(imageFile, 'rooms');
      if ('secure_url' in uploaded && uploaded.secure_url) {
        imageUrl = uploaded.secure_url;
      } else {
        throw new BadRequestException('Upload ảnh thất bại.');
      }
    }

    const room = await this.prisma.room.create({
      data: {
        title: dto.title,
        slug,
        type: (dto.type as RoomType) ?? RoomType.public,
        hostId: userId,
        videoId: dto.videoId ?? null,
        password: dto.password ?? null,
        maxUsers: dto.maxUsers ?? 5,
        image: imageUrl,
      },
      include: {
        host: { select: { id: true, username: true, avatarUrl: true } },
        video: {
          select: { id: true, title: true, thumbnailUrl: true, videoUrl: true },
        },
      },
    });

    // Xóa toàn bộ cache list phòng
    await this.redis.delPattern('rooms:list:*');
    return room;
  }

  async findAll(
    page = 1,
    limit = 10,
    type?: string,
    search?: string,
    onlyActive = false,
  ) {
    const cacheKey = search ? null : ROOM_LIST_KEY(page, limit, type);
    if (cacheKey) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return cached;
    }

    const skip = (page - 1) * limit;
    const where: any = {};
    if (onlyActive) where.isActive = true;
    if (type) {
      if (type !== RoomType.private && type !== RoomType.public) {
        throw new BadRequestException('Invalid room type');
      }
      where.type = type as RoomType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          host: { select: { id: true, username: true, avatarUrl: true } },
          video: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              videoUrl: true,
            },
          },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    // Lấy số lượng người dùng thực tế từ Redis cho mỗi phòng
    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const keys = await this.redis.keys(`ww:room:${room.id}:members:socket:*`);
        // Đếm số lượng username duy nhất
        const usernames = new Set<string>();
        for (const key of keys) {
          const mData = await this.redis.get<any>(key);
          if (mData?.username) usernames.add(mData.username);
        }
        return {
          ...room,
          currentUsers: usernames.size,
        };
      }),
    );

    const result = {
      rooms: roomsWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    if (cacheKey) await this.redis.set(cacheKey, result, TTL);
    return result;
  }

  async findOne(id: string): Promise<RoomWithRelations> {
    // Kiểm tra định dạng UUID trước khi query database
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) throw new NotFoundException('Phòng không tồn tại (ID không hợp lệ)');

    const cached = await this.redis.get<RoomWithRelations>(ROOM_KEY(id));
    if (cached) return cached;

    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, username: true, avatarUrl: true } },
        video: {
          select: { id: true, title: true, thumbnailUrl: true, videoUrl: true },
        },
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
        video: {
          select: { id: true, title: true, thumbnailUrl: true, videoUrl: true },
        },
      },
    });
    if (!room) throw new NotFoundException('Room not found');

    await this.redis.set(ROOM_SLUG_KEY(slug), room, TTL);
    return room;
  }

  async update(id: string, userId: string, dto: UpdateRoomDto, userRole?: string) {
    const room = await this.findOne(id);
    if (room.hostId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Chỉ chủ phòng hoặc admin mới có quyền.');
    }

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
        video: {
          select: { id: true, title: true, thumbnailUrl: true, videoUrl: true },
        },
      },
    });

    await this.redis.del(ROOM_KEY(id), ROOM_SLUG_KEY(room.slug));
    await this.redis.delPattern('rooms:list:*');
    return updated;
  }

  async remove(id: string, userId: string, userRole?: string, reason?: string) {
    const room = await this.findOne(id);
    if (room.hostId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Chỉ chủ phòng hoặc admin mới có quyền xóa.');
    }

    // Nếu là admin và có lý do, lưu vào bảng báo cáo vi phạm
    if (userRole === 'admin' && reason) {
      const admin = await this.prisma.user.findUnique({ where: { id: userId } });
      await this.prisma.violationReport.create({
        data: {
          roomId: room.id,
          roomTitle: room.title,
          hostId: room.hostId || '',
          hostName: room.host?.username || 'Unknown',
          reason: reason,
          adminId: userId,
          adminName: admin?.username || 'Admin',
        },
      });
    }

    await this.prisma.room.delete({ where: { id } });
    await this.redis.del(ROOM_KEY(id), ROOM_SLUG_KEY(room.slug));
    await this.redis.delPattern('rooms:list:*');
    return { message: 'Room deleted' };
  }

  async verifyPassword(id: string, password: string) {
    const room = await this.findOne(id);
    if (room.type === 'public') return { ok: true };
    if (room.password !== password)
      throw new ForbiddenException('Sai mật khẩu phòng.');
    return { ok: true };
  }
}

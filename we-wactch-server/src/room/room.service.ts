import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomType } from '@prisma/client';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByType(type?: string) {
    const normalized = type?.toLowerCase();

    if (!normalized) {
      return this.prisma.room.findMany({ orderBy: { createdAt: 'desc' } });
    }

    if (normalized !== RoomType.private && normalized !== RoomType.public) {
      throw new BadRequestException('Invalid room type');
    }

    return this.prisma.room.findMany({
      where: { type: normalized as RoomType },
      orderBy: { createdAt: 'desc' },
    });
  }
}

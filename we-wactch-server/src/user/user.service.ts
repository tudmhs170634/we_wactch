import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

const USER_SELECT = {
  id: true,
  email: true,
  username: true,
  avatarUrl: true,
  role: true,
  isHost: true,
  isBanned: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 50, search?: string) {
    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            {
              email: { contains: search, mode: 'insensitive' as const },
            },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async setBanned(userId: string, isBanned: boolean) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existing) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isBanned },
      select: USER_SELECT,
    });
  }

  async switchRole(userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existing) throw new NotFoundException('User not found');

    const nextRole =
      existing.role === UserRole.admin ? UserRole.user : UserRole.admin;
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: nextRole },
      select: USER_SELECT,
    });
  }
}

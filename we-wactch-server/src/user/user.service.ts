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

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: USER_SELECT,
    });
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

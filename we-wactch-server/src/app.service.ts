import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getAdminStats() {
    const [usersCount, roomCount, moviesCount, pendingCount] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.room.count(),
        this.prisma.video.count(),
        this.prisma.video.count({
          where: { isActive: false },
        }),
      ]);
    return { usersCount, roomCount, moviesCount, pendingCount };
  }
}

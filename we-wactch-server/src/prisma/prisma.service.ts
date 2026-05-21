import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
      max: 5, // Giới hạn pool để không quá tải Neon Serverless
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}

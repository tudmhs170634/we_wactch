import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VideoModule } from './video/video.module';
import { RedisModule } from './redis/redis.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule, VideoModule, RoomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


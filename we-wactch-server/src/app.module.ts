import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VideoModule } from './video/video.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';
import { RoomModule } from './room/room.module';
import { LiveKitModule } from './livekit/livekit.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    VideoModule,
    UserModule,
    RoomModule,
    LiveKitModule,
    ReportModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 120,
      },
      {
        name: 'auth',
        ttl: 60000,
        limit: 5,
      },
      {
        name: 'upload',
        ttl: 60000,
        limit: 10,
      },
      {
        name: 'rooms',
        ttl: 60000,
        limit: 10,
      },
      {
        name: 'verify',
        ttl: 60000,
        limit: 5,
      },
      {
        name: 'livekit',
        ttl: 60000,
        limit: 10,
      },
      {
        name: 'wsChat',
        ttl: 2000,
        limit: 3,
      },
      {
        name: 'wsEmoji',
        ttl: 5000,
        limit: 10,
      },
      {
        name: 'wsAction',
        ttl: 3000,
        limit: 2,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }

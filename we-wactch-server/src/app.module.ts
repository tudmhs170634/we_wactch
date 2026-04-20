import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { SocketModule } from './socket/socket.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { VideosModule } from './modules/videos/videos.module';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // ── Infrastructure (global) ──────────────────────────────────────────────
    PrismaModule,
    RedisModule,
    SocketModule,

    // ── Feature Modules ──────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    RoomsModule,
    VideosModule,
  ],
  providers: [
    // Global exception filter
    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    // Global response transform interceptor
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

    // Global JWT guard (use @Public() to opt-out per route)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

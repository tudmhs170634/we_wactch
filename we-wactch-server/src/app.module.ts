import { Module } from '@nestjs/common';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

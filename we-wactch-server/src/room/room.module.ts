import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [PrismaModule, UploadModule, RedisModule],
    controllers: [RoomController],
    providers: [RoomService, RoomGateway],
    exports: [RoomService],
})
export class RoomModule {}

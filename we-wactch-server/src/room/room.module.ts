import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { PrismaModule } from '../prisma/prisma.module';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoomController],
  providers: [RoomService],
=======
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [RoomController],
    providers: [RoomService],
    exports: [RoomService],
>>>>>>> origin/client-server
})
export class RoomModule {}

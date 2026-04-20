import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],  // exported so SocketGateway can access room data
})
export class RoomsModule {}

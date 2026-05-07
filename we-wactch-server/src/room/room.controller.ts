import { Controller, Get, Query } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(private readonly rooms: RoomService) {}

  @Get()
  getAll(@Query('type') type?: string) {
    return this.rooms.findAllByType(type);
  }
}

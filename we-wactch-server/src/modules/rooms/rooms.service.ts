import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * TODO (Dev B): implement create
   * - Create room record linked to requesting user as host
   */
  async create(_hostId: string, _dto: CreateRoomDto) {
    return null;
  }

  /**
   * TODO (Dev B): implement findAll
   */
  async findAll() {
    return [];
  }

  /**
   * TODO (Dev B): implement findById
   */
  async findById(_id: string) {
    return null;
  }

  /**
   * TODO (Dev B): implement update
   */
  async update(_id: string, _dto: UpdateRoomDto) {
    return null;
  }

  /**
   * TODO (Dev B): implement remove
   */
  async remove(_id: string) {
    return null;
  }
}

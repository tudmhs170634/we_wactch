import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  /** TODO (Dev C): implement create */
  async create(_addedById: string, _dto: CreateVideoDto) {
    return null;
  }

  /** TODO (Dev C): implement findAll by room */
  async findAllByRoom(_roomId: string) {
    return [];
  }

  /** TODO (Dev C): implement findById */
  async findById(_id: string) {
    return null;
  }

  /** TODO (Dev C): implement update */
  async update(_id: string, _dto: UpdateVideoDto) {
    return null;
  }

  /** TODO (Dev C): implement remove */
  async remove(_id: string) {
    return null;
  }
}

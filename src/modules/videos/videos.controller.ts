import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  /** POST /videos */
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateVideoDto) {
    return this.videosService.create(user.sub, dto);
  }

  /** GET /videos?roomId=uuid */
  @Get()
  findAll(@Query('roomId', ParseUUIDPipe) roomId: string) {
    return this.videosService.findAllByRoom(roomId);
  }

  /** GET /videos/:id */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.videosService.findById(id);
  }

  /** PATCH /videos/:id */
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVideoDto) {
    return this.videosService.update(id, dto);
  }

  /** DELETE /videos/:id */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.videosService.remove(id);
  }
}

import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /** POST /rooms — Tạo phòng mới (cần login) */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  create(
    @GetUser() user: any,
    @Body() dto: CreateRoomDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.roomService.create(user.userId, dto, image);
  }

  /** GET /rooms — Danh sách phòng active */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.roomService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      type,
      search,
    );
  }

  /** GET /rooms/slug/:slug — Tìm phòng theo slug */
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.roomService.findBySlug(slug);
  }

  /** GET /rooms/:id — Chi tiết phòng */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  /** POST /rooms/:id/verify — Kiểm tra mật khẩu phòng private */
  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  verify(@Param('id') id: string, @Body('password') password: string) {
    return this.roomService.verifyPassword(id, password);
  }

  /** PATCH /rooms/:id — Cập nhật phòng (chỉ host) */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomService.update(id, user.userId, dto, user.role);
  }

  /** DELETE /rooms/:id — Xóa phòng (chỉ host) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.roomService.remove(id, user.userId, user.role);
  }

  @Post(':id/terminate')
  @UseGuards(JwtAuthGuard)
  terminate(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body('reason') reason: string,
  ) {
    return this.roomService.remove(id, user.userId, user.role, reason);
  }
}

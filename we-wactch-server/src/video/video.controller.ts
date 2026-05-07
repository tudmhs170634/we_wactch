import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';

@Controller('videos')
export class VideoController {
    constructor(private readonly videoService: VideoService) {}

    @Post('presigned-url')
    @UseGuards(JwtAuthGuard)
    getPresignedUrl(@Body('mimeType') mimeType: string) {
        return this.videoService.getPresignedUrl(mimeType);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@GetUser() user: any, @Body() dto: CreateVideoDto) {
        return this.videoService.create(user.userId, dto);
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.videoService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 12,
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.videoService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(
        @Param('id') id: string,
        @GetUser() user: any,
        @Body() dto: UpdateVideoDto,
    ) {
        return this.videoService.update(id, user.userId, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string, @GetUser() user: any) {
        return this.videoService.remove(id, user.userId);
    }
}

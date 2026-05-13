import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LiveKitService } from './livekit.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';

@Controller('livekit')
export class LiveKitController {
  constructor(private readonly livekitService: LiveKitService) {}

  @Get('token')
  @UseGuards(JwtAuthGuard)
  async getToken(
    @Query('roomName') roomName: string,
    @GetUser() user: any,
  ) {
    // Sử dụng username nếu có, nếu không thì dùng userId làm identity
    const identity = user.username || user.userId || `user_${Math.floor(Math.random() * 1000)}`;
    const token = await this.livekitService.generateToken(roomName, identity);
    return { token };
  }
}

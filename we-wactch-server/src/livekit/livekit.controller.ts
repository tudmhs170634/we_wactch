import { Controller, Get, Post, Body, Query, UseGuards, Param, Res, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LiveKitService } from './livekit.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';
import type { Response } from 'express';

@Controller('livekit')
export class LiveKitController {
  constructor(private readonly livekitService: LiveKitService) {}

  @Get('token')
  @Throttle({ livekit: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  async getToken(
    @Query('roomName') roomName: string,
    @GetUser() user: any,
  ) {
    const identity = user.username || user.userId || `user_${Math.floor(Math.random() * 1000)}`;
    const token = await this.livekitService.generateToken(roomName, identity);
    return { token };
  }

  @Get('subgroup-token')
  @Throttle({ livekit: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  async getSubGroupToken(
    @Query('roomId') roomId: string,
    @Query('subGroupId') subGroupId: string,
    @GetUser() user: any,
  ) {
    // Sub-group room name is derived from the main room + the sub-group UUID
    const subRoomName = `${roomId}__sub__${subGroupId}`;
    const identity = user.username || user.userId || `user_${Math.floor(Math.random() * 1000)}`;
    const token = await this.livekitService.generateToken(subRoomName, identity);
    return { token, subRoomName };
  }


}



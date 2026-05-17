import { Controller, Get, Post, Body, Query, UseGuards, Param, Res, Req } from '@nestjs/common';
import { LiveKitService } from './livekit.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';
import type { Response } from 'express';

@Controller('livekit')
export class LiveKitController {
  constructor(private readonly livekitService: LiveKitService) {}

  @Get('token')
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

  @Post('start-egress')
  @UseGuards(JwtAuthGuard)
  async startEgress(
    @Body('roomName') roomName: string,
  ) {
    return await this.livekitService.startEgress(roomName);
  }

  @Get('hls/*')
  async getHlsFile(
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      console.log('[LiveKitController] Params nhận được:', req.params);
      
      let path = '';
      if (req.params.path && Array.isArray(req.params.path)) {
        path = req.params.path.join('/');
      } else {
        path = req.params[0] || req.params['0'];
      }
      
      if (!path) {
        res.status(400).send(`Path is required. Params received: ${JSON.stringify(req.params)}`);
        return;
      }
      
      const file = await this.livekitService.getHlsFile(path);
      
      // Set content type dựa trên đuôi file
      if (path.endsWith('.m3u8')) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      } else if (path.endsWith('.ts')) {
        res.setHeader('Content-Type', 'video/MP2T');
      }
      
      res.send(file);
    } catch (error) {
      res.status(404).send('File not found');
    }
  }
}


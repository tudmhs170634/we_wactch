import { Injectable, Logger } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private readonly apiKey = process.env.LIVEKIT_API_KEY;
  private readonly apiSecret = process.env.LIVEKIT_API_SECRET;

  async generateToken(roomName: string, participantName: string) {
    try {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('LiveKit API keys are not configured in .env');
      }

      const at = new AccessToken(this.apiKey, this.apiSecret, {
        identity: participantName,
      });

      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
      });

      return await at.toJwt();
    } catch (error: any) {
      this.logger.error(`Generate token error: ${error.message}`);
      throw error;
    }
  }
}

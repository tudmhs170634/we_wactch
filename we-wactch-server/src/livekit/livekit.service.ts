import { Injectable, Logger } from '@nestjs/common';
import { AccessToken, EgressClient, RoomServiceClient, SegmentedFileOutput, TrackSource, TrackType } from 'livekit-server-sdk';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private readonly apiKey = process.env.LIVEKIT_API_KEY;
  private readonly apiSecret = process.env.LIVEKIT_API_SECRET;
  private readonly livekitUrl = process.env.LIVEKIT_URL;
  private egressClient: EgressClient | null = null;
  private roomServiceClient: RoomServiceClient | null = null;
  private s3Client: S3Client;

  constructor() {
    if (this.apiKey && this.apiSecret && this.livekitUrl) {
      const httpUrl = this.livekitUrl.replace('wss://', 'https://');
      this.egressClient = new EgressClient(httpUrl, this.apiKey, this.apiSecret);
      this.roomServiceClient = new RoomServiceClient(httpUrl, this.apiKey, this.apiSecret);
    } else {
      this.logger.warn('LiveKit API keys or URL not configured. Egress will not be available.');
    }

    this.s3Client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: process.env.DO_SPACES_REGION ?? 'sgp1',
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
      },
      forcePathStyle: false,
    });
  }

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





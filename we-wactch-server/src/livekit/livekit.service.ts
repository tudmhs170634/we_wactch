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

  async startEgress(roomName: string) {
    try {
      if (!this.egressClient || !this.roomServiceClient) {
        throw new Error('LiveKit clients are not initialized. Check your credentials.');
      }

      const filenamePrefix = `livestream/${roomName}_${Date.now()}`;
      
      const output = new SegmentedFileOutput({
        filenamePrefix: filenamePrefix,
        playlistName: `${filenamePrefix}.m3u8`,
        segmentDuration: 2,
        output: {
          case: 's3',
          value: {
            bucket: process.env.DO_SPACES_BUCKET || '',
            endpoint: process.env.DO_SPACES_ENDPOINT || '',
            accessKey: process.env.DO_SPACES_KEY || '',
            secret: process.env.DO_SPACES_SECRET || '',
            region: process.env.DO_SPACES_REGION || 'sgp1',
          }
        }
      });

      this.logger.log(`Searching for tracks in room ${roomName}...`);
      
      const participants = await this.roomServiceClient.listParticipants(roomName);
      let videoTrackId: string | undefined;
      let audioTrackId: string | undefined;

      for (const p of participants) {
        for (const t of p.tracks) {
          // Ưu tiên lấy track chia sẻ màn hình
          if (t.source === TrackSource.SCREEN_SHARE) {
            videoTrackId = t.sid;
          }
          if (t.source === TrackSource.SCREEN_SHARE_AUDIO) {
            audioTrackId = t.sid;
          }
          
          // Fallback sang camera/mic nếu không thấy screen share
          if (!videoTrackId && t.type === TrackType.VIDEO) {
            videoTrackId = t.sid;
          }
          if (!audioTrackId && t.type === TrackType.AUDIO) {
            audioTrackId = t.sid;
          }
        }
      }

      if (!videoTrackId && !audioTrackId) {
        throw new Error('No tracks found in the room to start egress.');
      }

      this.logger.log(`Starting Egress with Video Track: ${videoTrackId}, Audio Track: ${audioTrackId}`);

      const egressInfo = await this.egressClient.startTrackCompositeEgress(roomName, output, {
        videoTrackId,
        audioTrackId,
      });

      this.logger.log(`Egress started successfully: ${egressInfo.egressId}`);
      
      // Trả về URL của proxy trên Backend thay vì link trực tiếp DO Spaces
      const apiUrl = process.env.API_URL || 'http://localhost:3000';
      const hlsUrl = `${apiUrl}/livekit/hls/${filenamePrefix}.m3u8`;
      
      // Cập nhật Room Metadata để Viewer tự động nhận diện được link HLS
      try {
        await this.roomServiceClient.updateRoomMetadata(roomName, JSON.stringify({
          hls_url: hlsUrl,
          egress_id: egressInfo.egressId
        }));
        this.logger.log(`Updated room metadata for ${roomName} with HLS URL.`);
      } catch (metaErr: any) {
        this.logger.error(`Failed to update room metadata: ${metaErr.message}`);
        // Không throw error ở đây để tránh làm fail cả quá trình
      }
      
      return {
        egressId: egressInfo.egressId,
        hlsUrl: hlsUrl,
      };
    } catch (error: any) {
      this.logger.error(`Start egress error: ${error.message}`);
      throw error;
    }
  }

  async getHlsFile(path: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET!,
        Key: path,
      });

      const response = await this.s3Client.send(command);
      const stream = response.Body as Readable;
      
      return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error: any) {
      this.logger.error(`Failed to get Hls file from S3: ${error.message}`);
      console.error('[LiveKitService] Full S3 Error:', error);
      throw error;
    }
  }

  async deleteEgressFiles(prefix: string) {
    try {
      this.logger.log(`Deleting egress files with prefix: ${prefix}`);
      // Ở đây bạn sẽ cần code để list và delete các file trên S3
      // Tôi viết sẵn khung để bạn hoặc tôi điền tiếp khi biết cấu trúc S3 của bạn
    } catch (error: any) {
      this.logger.error(`Failed to delete egress files: ${error.message}`);
    }
  }
}



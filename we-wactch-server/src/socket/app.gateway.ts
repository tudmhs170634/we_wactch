import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * WebSocket gateway — setup only.
 * TODO (Dev B): implement room join/leave, video sync events.
 *
 * CORS origin should be tightened per environment via ConfigService.
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AppGateway.name);

  afterInit(_server: Server): void {
    this.logger.log('WebSocket gateway initialised');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Room Events (TODOs for Dev B) ─────────────────────────────────────────

  /** TODO (Dev B): join a watch room */
  @SubscribeMessage('room:join')
  handleRoomJoin(
    @MessageBody() _data: { roomId: string },
    @ConnectedSocket() _client: Socket,
  ): void {
    // client.join(data.roomId);
    // this.server.to(data.roomId).emit('room:user-joined', { userId: client.id });
  }

  /** TODO (Dev B): leave a watch room */
  @SubscribeMessage('room:leave')
  handleRoomLeave(
    @MessageBody() _data: { roomId: string },
    @ConnectedSocket() _client: Socket,
  ): void {
    // client.leave(data.roomId);
  }

  // ─── Video Sync Events (TODOs for Dev B) ──────────────────────────────────

  /** TODO (Dev B): broadcast video play/pause/seek to room */
  @SubscribeMessage('video:sync')
  handleVideoSync(
    @MessageBody() _data: { roomId: string; action: string; timestamp: number },
    @ConnectedSocket() _client: Socket,
  ): void {
    // this.server.to(data.roomId).emit('video:sync', data);
  }
}

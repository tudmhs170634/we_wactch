import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('RoomGateway');

    // map: roomId -> Map<socketId, {username, avatarUrl}>
    private roomMembers = new Map<string, Map<string, any>>();

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        
        // Remove from all rooms
        for (const [roomId, members] of this.roomMembers.entries()) {
            if (members.has(client.id)) {
                const member = members.get(client.id);
                members.delete(client.id);
                this.server.to(roomId).emit('roomMembers', Array.from(members.values()));
                this.server.to(roomId).emit('userLeft', member.username);
            }
        }
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; username: string; avatarUrl?: string },
    ) {
        const { roomId, username, avatarUrl } = data;
        client.join(roomId);
        this.logger.log(`User ${username} joined room ${roomId}`);

        if (!this.roomMembers.has(roomId)) {
            this.roomMembers.set(roomId, new Map());
        }

        const member = { username, avatarUrl };
        const members = this.roomMembers.get(roomId);
        if (members) {
            members.set(client.id, member);
            const currentMembers = Array.from(members.values());
            this.server.to(roomId).emit('roomMembers', currentMembers);
            this.server.to(roomId).emit('userJoined', member);
        }
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; username: string },
    ) {
        const { roomId, username } = data;
        client.leave(roomId);
        
        const members = this.roomMembers.get(roomId);
        if (members) {
            members.delete(client.id);
            const currentMembers = Array.from(members.values());
            this.server.to(roomId).emit('roomMembers', currentMembers);
            this.server.to(roomId).emit('userLeft', username);
        }
    }

    @SubscribeMessage('endRoom')
    handleEndRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string },
    ) {
        const { roomId } = data;
        // Broadcast cho tất cả người trong phòng biết phòng đã kết thúc
        this.server.to(roomId).emit('roomEnded');
        // Dọn sạch bộ nhớ
        this.roomMembers.delete(roomId);
        this.logger.log(`Room ${roomId} ended by host`);
    }
}

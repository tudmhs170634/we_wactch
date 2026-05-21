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
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Redis key helpers ───────────────────────────────────────────────────────
const ROOM_MEMBERS_KEY = (roomId: string) => `ww:room:${roomId}:members`;
const ROOM_CHAT_KEY = (roomId: string) => `ww:room:${roomId}:chat`;
const ROOM_WISHLIST_KEY = (roomId: string) => `ww:room:${roomId}:wishlist`;
const USER_LOCATION_KEY = (username: string) => `ww:user:${username.trim().toLowerCase()}:location`;
const CHAT_MUTE_KEY = (roomId: string, username: string) => `ww:room:${roomId}:mute:${username.trim().toLowerCase()}`;
const MEMBER_SOCKET_KEY = (roomId: string, socketId: string) => `${ROOM_MEMBERS_KEY(roomId)}:socket:${socketId}`;
const ROOM_VIDEO_STATE_KEY = (roomId: string) => `ww:room:${roomId}:videoState`;

const CHAT_TTL = 60 * 60 * 24; // 24 giờ
const MEMBER_TTL = 60 * 60; // 1 giờ
const LOCATION_TTL = 60 * 60; // 1 giờ
const WISHLIST_TTL = 60 * 60 * 12; // 12 giờ
const MAX_CHAT_MESSAGES = 100;
const MAX_WISHLIST_ITEMS = 30;

export interface ChatMessage {
    id: string;
    roomId: string;
    username: string;
    avatarUrl?: string;
    message: string;
    type: 'msg' | 'status';
    timestamp: number;
}

export interface EmojiEvent {
    roomId: string;
    emoji: string;
    username: string;
    x: number; // % vị trí ngang (0-100)
}

export interface WishlistVideo {
    id: string;
    title: string;
    thumbnailUrl?: string;
    duration?: number;
    addedBy: string;
    addedAt: number;
}

export interface VideoState {
    isPlaying: boolean;
    currentTime: number;
    lastUpdated: number; // Date.now()
}

import { OnModuleInit } from '@nestjs/common';

import { RoomService } from './room.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    pingInterval: 10000,
    pingTimeout: 5000,
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('RoomGateway');

    // map: socketId -> { roomId, userId, username, avatarUrl, role, joinAt }
    private socketRoomMap = new Map<string, { 
        roomId: string; 
        userId: string;
        username: string; 
        avatarUrl?: string; 
        role?: string;
        joinAt: number;
    }>();
    
    // map: roomId:username -> Timeout
    private pendingDisconnects = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly redis: RedisService,
        private readonly prisma: PrismaService,
        private readonly roomService: RoomService,
    ) {}

    // ─── Connection lifecycle ───────────────────────────────────────────────

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket, reason?: string) {
        this.logger.log(`Client disconnected: ${client.id} (Reason: ${reason})`);

        const info = this.socketRoomMap.get(client.id);
        if (!info) return;

        const { roomId, username, userId } = info;
        this.socketRoomMap.delete(client.id);

        // Kiểm tra xem có phải Host không để quyết định thời gian chờ
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            select: { hostId: true, type: true, slug: true }
        });
        const isHost = room?.hostId === userId;
        
        // Nếu là Host: luôn chờ 20 giây (20000 ms) dưới mọi lý do ngắt kết nối.
        // Ngược lại, nếu là viewer: ngắt kết nối do timeout/error thì 0s, bình thường thì 5s.
        const isHardDisconnect = reason === 'ping timeout' || reason === 'transport error';
        const delay = isHost ? 20000 : (isHardDisconnect ? 0 : 5000);

        // Thiết lập chờ xử lý rời phòng
        const pendingKey = `${roomId}:${username}`;
        
        if (this.pendingDisconnects.has(pendingKey)) {
            clearTimeout(this.pendingDisconnects.get(pendingKey));
        }

        const timeout = setTimeout(async () => {
            this.pendingDisconnects.delete(pendingKey);

            // 1. Luôn xóa socket này khỏi Redis trước
            await this.redis.del(MEMBER_SOCKET_KEY(roomId, client.id));

            // 2. Kiểm tra xem người dùng này còn socket nào khác đang hoạt động trong phòng không (check cả Redis và In-memory)
            const membersInRedis = await this.getRoomMembers(roomId);
            const stillInRedis = membersInRedis.some(m => m.username.toLowerCase() === username.toLowerCase());
            const stillInMap = Array.from(this.socketRoomMap.values()).some(s => s.username.toLowerCase() === username.toLowerCase() && s.roomId === roomId);
            
            this.logger.log(`Grace period check for ${username} in ${roomId}: stillInRedis=${stillInRedis}, stillInMap=${stillInMap}`);

            if (stillInRedis || stillInMap) {
                this.logger.log(`User ${username} still has other active sockets in room ${roomId}, skip full leave notification`);
                return;
            }

            // 3. Nếu thực sự đã thoát sạch mọi tab của phòng này:
            this.logger.log(`User ${username} has fully left room ${roomId} (all tabs closed)`);
            
            // Xóa location nếu không còn socket nào ở BẤT KỲ phòng nào
            const hasOtherSocketsAnywhere = Array.from(this.socketRoomMap.values()).some(s => s.username === username);
            if (!hasOtherSocketsAnywhere) {
                this.logger.log(`Deleting location for ${username} after grace period`);
                await this.redis.del(USER_LOCATION_KEY(username));
            }

            // XỬ LÝ NẾU LÀ HOST RỜI PHÒNG THỰC SỰ
            if (isHost) {
                const remainingMembers = await this.getRoomMembers(roomId);
                
                if (remainingMembers.length === 0) {
                    this.logger.log(`Room ${roomId} auto-deactivating as host ${username} left and no one remains.`);
                    
                    // Thông báo kết thúc phòng
                    this.server.to(roomId).emit('roomEnded');
                    
                    try {
                        const updatedRoom = await this.prisma.room.update({
                            where: { id: roomId },
                            data: { isActive: false }
                        });
                        
                        // Clear cache
                        await this.redis.del(`rooms:item:${roomId}`, `rooms:slug:${updatedRoom.slug}`);
                        await this.redis.delPattern(`ww:room:${roomId}:*`);
                        
                        const listKeys = await this.redis.keys('rooms:list:*');
                        if (listKeys.length > 0) {
                            await Promise.all(listKeys.map(k => this.redis.del(k)));
                        }

                        this.roomService.roomListUpdated$.next();
                    } catch (err: any) {
                        if (err?.code === 'P2025') {
                            this.logger.warn(`Room ${roomId} was already deleted before disconnect grace period resolved. Skipping deactivation.`);
                        } else {
                            throw err;
                        }
                    }
                    return;
                }

                // Nếu còn người -> Transfer host cho người ở lâu nhất (dựa trên joinAt)
                const nextHost = remainingMembers.sort((a, b) => (a.joinAt || 0) - (b.joinAt || 0))[0];
                
                // Tìm userId của người này từ Redis hoặc socketRoomMap
                const keys = await this.redis.keys(`${ROOM_MEMBERS_KEY(roomId)}:socket:*`);
                let newHostId = '';
                for (const key of keys) {
                    const mData = await this.redis.get<any>(key);
                    if (mData?.username === nextHost.username) {
                        newHostId = mData.userId;
                        break;
                    }
                }

                if (!newHostId) {
                    const socketMember = Array.from(this.socketRoomMap.values()).find(
                        s => s.roomId === roomId && s.username === nextHost.username
                    );
                    if (socketMember) {
                        newHostId = socketMember.userId;
                    }
                }

                if (newHostId) {
                    let updatedRoom;
                    try {
                        updatedRoom = await this.prisma.room.update({
                            where: { id: roomId },
                            data: { hostId: newHostId },
                            include: { host: true }
                        });
                    } catch (err: any) {
                        if (err?.code === 'P2025') {
                            this.logger.warn(`Room ${roomId} was already deleted before host transfer. Skipping.`);
                            return;
                        } else {
                            throw err;
                        }
                    }

                    // Clear cache for this room
                    await this.redis.del(`rooms:item:${roomId}`, `rooms:slug:${updatedRoom.slug}`);
                    const listKeys = await this.redis.keys('rooms:list:*');
                    if (listKeys.length > 0) {
                        await Promise.all(listKeys.map(k => this.redis.del(k)));
                    }

                    // Thông báo chuyển giao host kèm theo thông báo hệ thống
                    this.server.to(roomId).emit('hostTransferred', { 
                        newHostName: nextHost.username,
                        newHostId: newHostId
                    });

                    // Notify global list to refresh (so "My Rooms" updates)
                    this.roomService.roomListUpdated$.next();

                    const transferMsg: ChatMessage = {
                        id: `sys_transfer_${Date.now()}`,
                        roomId,
                        username: 'system',
                        message: `Chủ phòng mới: ${nextHost.username}`,
                        type: 'status',
                        timestamp: Date.now(),
                    };
                    this.server.to(roomId).emit('newMessage', transferMsg);

                    this.logger.log(`Host transferred from ${username} to ${nextHost.username} in room ${roomId}`);
                }
            }

            const members = await this.getRoomMembers(roomId);
            this.server.to(roomId).emit('roomMembers', members);
            this.server.to(roomId).emit('userLeft', username);
            
            // Notify global rooms list
            await this.notifyRoomsList(roomId);

            // Gửi system message
            const systemMsg: ChatMessage = {
                id: `sys_${Date.now()}`,
                roomId,
                username: 'system',
                message: isHost ? `${username} (host) đã rời phòng.` : `${username} đã rời phòng`,
                type: 'status',
                timestamp: Date.now(),
            };
            this.server.to(roomId).emit('newMessage', systemMsg);
        }, delay);

        this.pendingDisconnects.set(pendingKey, timeout);
    }

    async onModuleInit() {
        this.logger.log('RoomGateway initialized.');

        // Đăng ký theo dõi thay đổi danh sách phòng từ RoomService
        this.roomService.roomListUpdated$.subscribe(() => {
            this.logger.log('Room list updated, notifying clients...');
            this.server.to('global_rooms_list').emit('roomListChanged');
        });
    }

    // ─── Join / Leave ───────────────────────────────────────────────────────

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string; username: string; avatarUrl?: string; role?: string; password?: string },
    ) {
        const { roomId, userId, avatarUrl, role, password } = data;
        const username = data.username?.trim() || 'Anonymous';
        const joinAt = Date.now();

        // (Bỏ qua kiểm tra một người - một tab để thuận tiện test đồng bộ)
        /*
        const existingSocket = Array.from(this.socketRoomMap.values()).find(
            (s) => s.username.toLowerCase() === username.toLowerCase()
        );
        ...
        */

        // ─── Kiểm tra sự tồn tại và trạng thái phòng ──────────────────────────
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: { host: { select: { username: true } } },
        });
        
        if (!room) {
            client.emit('error', 'Phòng không tồn tại.');
            return;
        }

        if (!room.isActive) {
            client.emit('error', 'Phòng này hiện không hoạt động.');
            return;
        }

        const isHost = room.host?.username === username || room.hostId === userId;
        const isAdmin = role === 'admin';

        // ─── Kiểm tra mật khẩu (nếu là phòng private và không phải host/admin) ───
        if (room.type === 'private' && !isHost && !isAdmin) {
            if (!password || password !== room.password) {
                this.logger.warn(`User ${username} failed password check for room ${roomId}`);
                client.emit('error', 'Mật khẩu không chính xác hoặc bạn không có quyền truy cập.');
                return;
            }
        }

        const currentMembers = await this.getRoomMembers(roomId);
        const isAlreadyIn = currentMembers.some((m) => m.username === username);

        // Nếu có timeout rời phòng đang chờ, hủy nó đi vì user đã reconnect
        const pendingKey = `${roomId}:${username}`;
        if (this.pendingDisconnects.has(pendingKey)) {
            clearTimeout(this.pendingDisconnects.get(pendingKey));
            this.pendingDisconnects.delete(pendingKey);
            this.logger.log(`User ${username} reconnected to ${roomId}, cancelled leave timeout`);
        }

        // Dọn dẹp các key member cũ của chính user này trong phòng này (nếu có do F5 nhanh)
        const allMemberKeys = await this.redis.keys(`${ROOM_MEMBERS_KEY(roomId)}:socket:*`);
        for (const key of allMemberKeys) {
            const mData = await this.redis.get<any>(key);
            if (mData?.username === username) {
                this.logger.log(`Cleaning up stale Redis member key for ${username}: ${key}`);
                await this.redis.del(key);
            }
        }

        // Chỉ đếm người xem (không phải Host/Admin)
        const viewerCount = currentMembers.filter(m => m.username !== room.host?.username && m.role !== 'admin').length;

        // Nếu phòng đầy và user là người xem mới (không phải Host/Admin/Reconnect)
        if (!isHost && !isAdmin && !isAlreadyIn && viewerCount >= room.maxUsers) {
            client.emit('error', 'Phòng đã đầy, không thể tham gia.');
            this.logger.warn(`User ${username} blocked from full room ${roomId}`);
            return;
        }

        client.join(roomId);
        this.socketRoomMap.set(client.id, { roomId, userId, username, avatarUrl, role, joinAt });
        this.logger.log(`Socket ${client.id} associated with user ${username} in room ${roomId}`);

        // Lưu member và location vào Redis
        const memberKey = MEMBER_SOCKET_KEY(roomId, client.id);
        await this.redis.set(memberKey, { userId, username, avatarUrl, role, joinAt }, MEMBER_TTL);
        this.logger.log(`Setting location for ${username} to room ${roomId}`);
        await this.redis.set(USER_LOCATION_KEY(username), roomId, LOCATION_TTL);

        const members = await this.getRoomMembers(roomId);
        this.server.to(roomId).emit('roomMembers', members);
        
        if (!isAlreadyIn) {
            this.server.to(roomId).emit('userJoined', { username, avatarUrl, role });

            // Gửi system message và lưu vào history
            const systemMsg: ChatMessage = {
                id: `sys_${Date.now()}`,
                roomId,
                username: 'system',
                message: `${username} đã tham gia phòng`,
                type: 'status',
                timestamp: Date.now(),
            };
            await this.redis.lpush(ROOM_CHAT_KEY(roomId), systemMsg, MAX_CHAT_MESSAGES);
            await this.redis.expire(ROOM_CHAT_KEY(roomId), CHAT_TTL);
            this.server.to(roomId).emit('newMessage', systemMsg);
        }
        
        // Notify global rooms list
        await this.notifyRoomsList(roomId);

        // Gửi lịch sử chat từ Redis cho client mới join (sau khi đã có thể thêm tin nhắn system mới)
        const history = await this.redis.lrange<ChatMessage>(ROOM_CHAT_KEY(roomId), 0, 49);
        client.emit('chatHistory', history);

        // Gửi wishlist hiện tại cho client mới join
        const wishlist = await this.redis.lrange<WishlistVideo>(ROOM_WISHLIST_KEY(roomId), 0, -1);
        client.emit('wishlistSync', wishlist);

        // Gửi trạng thái video hiện tại cho client mới join
        const videoState = await this.redis.get<VideoState>(ROOM_VIDEO_STATE_KEY(roomId));
        if (videoState) {
            client.emit('videoSync', videoState);
        }
        this.logger.log(`User ${username} joined room ${roomId}`);
    }

    @SubscribeMessage('joinRoomsList')
    handleJoinRoomsList(@ConnectedSocket() client: Socket) {
        client.join('global_rooms_list');
        this.logger.log(`Client ${client.id} joined global rooms list`);
    }

    @SubscribeMessage('leaveRoom')
    async handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; username: string },
    ) {
        const { roomId, username } = data;
        
        // Hủy bỏ bất kỳ timeout disconnect nào đang chờ
        const pendingKey = `${roomId}:${username}`;
        if (this.pendingDisconnects.has(pendingKey)) {
            clearTimeout(this.pendingDisconnects.get(pendingKey));
            this.pendingDisconnects.delete(pendingKey);
        }

        // Chỉ xóa location nếu user thực sự đang ở trong phòng này
        const currentLocation = await this.redis.get<string>(USER_LOCATION_KEY(username));
        if (currentLocation === roomId) {
            this.logger.log(`Deleting location for ${username} (explicit leave from ${roomId})`);
            await this.redis.del(USER_LOCATION_KEY(username));
        } else {
            this.logger.warn(`User ${username} tried to leave room ${roomId} but is actually in ${currentLocation}`);
        }
        
        await this.redis.del(MEMBER_SOCKET_KEY(roomId, client.id));

        client.leave(roomId);
        this.socketRoomMap.delete(client.id);

        const members = await this.getRoomMembers(roomId);
        this.server.to(roomId).emit('roomMembers', members);

        // Kiểm tra xem thực sự đã thoát sạch mọi tab của phòng này chưa
        const stillInRedis = members.some(m => m.username.toLowerCase() === username.toLowerCase());
        const stillInMap = Array.from(this.socketRoomMap.values()).some(s => s.username.toLowerCase() === username.toLowerCase() && s.roomId === roomId);

        if (!stillInRedis && !stillInMap) {
            this.server.to(roomId).emit('userLeft', username);
            await this.notifyRoomsList(roomId);

            // Gửi system message
            const systemMsg: ChatMessage = {
                id: `sys_${Date.now()}`,
                roomId,
                username: 'system',
                message: `${username} đã rời phòng`,
                type: 'status',
                timestamp: Date.now(),
            };
            this.server.to(roomId).emit('newMessage', systemMsg);
            this.logger.log(`User ${username} has fully left room ${roomId}`);
        } else {
            this.logger.log(`User ${username} closed one tab of ${roomId}, but still has other active sessions.`);
        }
    }

    // ─── Chat ───────────────────────────────────────────────────────────────

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; message: string; username: string; avatarUrl?: string },
    ) {
        const { roomId, message, avatarUrl } = data;
        const username = data.username?.trim() || 'Anonymous';

        if (!message?.trim()) return;

        // ─── Kiểm tra xem user có đang bị cấm chat không ──────────────────────
        const muteData = await this.redis.get<{ mutedUntil: number; mutedBy: string }>(
            CHAT_MUTE_KEY(roomId, username)
        );
        if (muteData) {
            const remaining = Math.ceil((muteData.mutedUntil - Date.now()) / 1000 / 60);
            client.emit('chatMuted', {
                mutedUntil: muteData.mutedUntil,
                mutedBy: muteData.mutedBy,
                remainingMinutes: remaining,
            });
            return; // Không gửi tin nhắn
        }

        const chatMsg: ChatMessage = {
            id: `${client.id}_${Date.now()}`,
            roomId,
            username,
            avatarUrl,
            message: message.trim(),
            type: 'msg',
            timestamp: Date.now(),
        };

        // Lưu vào Redis
        await this.redis.lpush(ROOM_CHAT_KEY(roomId), chatMsg, MAX_CHAT_MESSAGES);
        await this.redis.expire(ROOM_CHAT_KEY(roomId), CHAT_TTL);

        // Broadcast cho tất cả trong phòng (kể cả người gửi)
        this.server.to(roomId).emit('newMessage', chatMsg);
    }

     // ─── Admin: Xóa tin nhắn ────────────────────────────────────────────────

    @SubscribeMessage('deleteMessage')
    async handleDeleteMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; messageId: string },
    ) {
        const { roomId, messageId } = data;

        // Lấy thông tin người gọi để kiểm tra quyền admin/host
        const info = this.socketRoomMap.get(client.id);
        if (!info) return;

        const isAdmin = info.role === 'admin';
        const isHost = await this.prisma.room.findUnique({
            where: { id: roomId },
            select: { hostId: true },
        }).then(r => r?.hostId === info.userId);

        if (!isAdmin && !isHost) {
            client.emit('error', 'Bạn không có quyền xóa tin nhắn.');
            return;
        }

        // Lấy danh sách chat từ Redis, lọc bỏ tin nhắn cần xóa
        const chatKey = ROOM_CHAT_KEY(roomId);
        const history = await this.redis.lrange<ChatMessage>(chatKey, 0, -1);
        const filtered = history.filter(m => m.id !== messageId);

        // Rebuild Redis list
        await this.redis.del(chatKey);
        for (let i = filtered.length - 1; i >= 0; i--) {
            await this.redis.lpush(chatKey, filtered[i], MAX_CHAT_MESSAGES);
        }
        if (filtered.length > 0) await this.redis.expire(chatKey, CHAT_TTL);

        // Thông báo cho tất cả người trong phòng để xóa tin nhắn đó khỏi UI
        this.server.to(roomId).emit('messageDeleted', { messageId });
        this.logger.log(`Message ${messageId} deleted by ${info.username} (${isAdmin ? 'admin' : 'host'}) in room ${roomId}`);
    }

    // ─── Admin: Cấm chat user ────────────────────────────────────────────────

    @SubscribeMessage('muteChatUser')
    async handleMuteChatUser(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; targetUsername: string; durationMinutes: number },
    ) {
        const { roomId, targetUsername, durationMinutes } = data;

        // Kiểm tra quyền
        const info = this.socketRoomMap.get(client.id);
        if (!info) return;

        const isAdmin = info.role === 'admin';
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            select: { hostId: true },
        });
        const isHost = room?.hostId === info.userId;

        if (!isAdmin && !isHost) {
            client.emit('error', 'Bạn không có quyền cấm chat.');
            return;
        }

        const mutedUntil = Date.now() + durationMinutes * 60 * 1000;
        const ttlSeconds = durationMinutes * 60;

        await this.redis.set(
            CHAT_MUTE_KEY(roomId, targetUsername),
            { mutedUntil, mutedBy: info.username },
            ttlSeconds,
        );

        // Thông báo cho người bị cấm (nếu đang online)
        this.server.to(roomId).emit('userMuted', {
            username: targetUsername,
            mutedUntil,
            mutedBy: info.username,
            durationMinutes,
        });

        this.logger.log(`User ${targetUsername} muted for ${durationMinutes}min by ${info.username} in room ${roomId}`);
    }

    // ─── Admin: Bỏ cấm chat ──────────────────────────────────────────────────

    @SubscribeMessage('unmuteChatUser')
    async handleUnmuteChatUser(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; targetUsername: string },
    ) {
        const { roomId, targetUsername } = data;

        const info = this.socketRoomMap.get(client.id);
        if (!info) return;

        const isAdmin = info.role === 'admin';
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            select: { hostId: true },
        });
        const isHost = room?.hostId === info.userId;

        if (!isAdmin && !isHost) {
            client.emit('error', 'Bạn không có quyền.');
            return;
        }

        await this.redis.del(CHAT_MUTE_KEY(roomId, targetUsername));

        this.server.to(roomId).emit('userUnmuted', { username: targetUsername });
        this.logger.log(`User ${targetUsername} unmuted by ${info.username} in room ${roomId}`);
    }

    // ─── Emoji Reaction ─────────────────────────────────────────────────────

    @SubscribeMessage('sendEmoji')
    handleSendEmoji(
        @ConnectedSocket() _client: Socket,
        @MessageBody() data: { roomId: string; emoji: string; username: string; x?: number },
    ) {
        const { roomId, emoji, username, x } = data;

        const event: EmojiEvent = {
            roomId,
            emoji,
            username,
            x: x ?? Math.random() * 80 + 10,
        };

        // Broadcast cho tất cả trong phòng
        this.server.to(roomId).emit('emojiReaction', event);
    }

    // ─── Video Synchronization ──────────────────────────────────────────────

    @SubscribeMessage('videoAction')
    async handleVideoAction(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; action: 'play' | 'pause' | 'seek'; currentTime: number; sentAt: number },
    ) {
        const { roomId, action, currentTime, sentAt } = data;
        const info = this.socketRoomMap.get(client.id);
        if (!info) return;

        const videoState: VideoState = {
            isPlaying: action === 'play' || (action === 'seek' ? true : false), // Mặc định seek xong thì play
            currentTime,
            lastUpdated: Date.now(),
        };

        // Nếu là lệnh pause, ta lưu trạng thái pause
        if (action === 'pause') videoState.isPlaying = false;

        // Lưu trạng thái vào Redis
        await this.redis.set(ROOM_VIDEO_STATE_KEY(roomId), videoState, WISHLIST_TTL);

        // Broadcast cho tất cả những người KHÁC trong phòng
        client.to(roomId).emit('videoAction', {
            action,
            currentTime,
            sentAt,
            username: info.username,
        });

        this.logger.log(`Video action [${action}] by ${info.username} in room ${roomId} at ${currentTime}s`);
    }

    @SubscribeMessage('requestVideoSync')
    async handleRequestVideoSync(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string },
    ) {
        const { roomId } = data;
        const videoState = await this.redis.get<VideoState>(ROOM_VIDEO_STATE_KEY(roomId));
        if (videoState) {
            client.emit('videoSync', videoState);
        }
    }

    // ─── NTP-lite Clock Synchronization ──────────────────────────────────────

    @SubscribeMessage('timeSyncRequest')
    handleTimeSync(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { clientSendTime: number },
    ) {
        client.emit('timeSyncResponse', {
            clientSendTime: data.clientSendTime,
            serverTime: Date.now(),
        });
    }


    // ─── Video Wishlist ─────────────────────────────────────────────────────

    @SubscribeMessage('addVideoToWishlist')
    async handleAddVideoToWishlist(
        @ConnectedSocket() _client: Socket,
        @MessageBody()
        data: {
            roomId: string;
            video: { id: string; title: string; thumbnailUrl?: string; duration?: number };
            addedBy: string;
        },
    ) {
        const { roomId, video, addedBy } = data;
        const wishlistKey = ROOM_WISHLIST_KEY(roomId);

        // 1. Kiểm tra xem phòng có đang chiếu phim nào không
        const currentRoom = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: { video: true }
        });

        // 2. Nếu phòng chưa có video hoặc video hiện tại đã bị xóa/không hợp lệ -> Phát luôn
        if (!currentRoom || !currentRoom.videoId) {
            
            // Cập nhật Database
            await this.prisma.room.update({
                where: { id: roomId },
                data: { videoId: video.id }
            });

            // Xóa trạng thái video cũ trong Redis để bắt đầu từ 0
            await this.redis.del(ROOM_VIDEO_STATE_KEY(roomId));

            // Thông báo cho mọi người chuyển phim
            this.server.to(roomId).emit('videoChanged', {
                videoId: video.id,
                title: video.title,
                videoUrl: (video as any).videoUrl,
                thumbnailUrl: video.thumbnailUrl
            });

            const systemMsg: ChatMessage = {
                id: `sys_auto_${Date.now()}`,
                roomId,
                username: 'system',
                message: `Đang phát phim mới: ${video.title}`,
                type: 'status',
                timestamp: Date.now(),
            };
            this.server.to(roomId).emit('newMessage', systemMsg);
            
            return;
        }

        // 3. Nếu đang có phim -> Thêm vào hàng chờ như bình thường
        const existing = await this.redis.lrange<WishlistVideo>(wishlistKey, 0, -1);
        const isDuplicate = existing.some((v) => v.id === video.id);

        if (isDuplicate) {
            _client.emit('wishlistError', { message: 'Video đã có trong danh sách chờ' });
            return;
        }

        const item: WishlistVideo = {
            ...video,
            addedBy,
            addedAt: Date.now(),
        };

        await this.redis.lpush(wishlistKey, item, MAX_WISHLIST_ITEMS);
        await this.redis.expire(wishlistKey, WISHLIST_TTL);

        const wishlist = await this.redis.lrange<WishlistVideo>(wishlistKey, 0, -1);
        this.server.to(roomId).emit('wishlistUpdated', wishlist);

        const systemMsg: ChatMessage = {
            id: `sys_${Date.now()}`,
            roomId,
            username: 'system',
            message: `${addedBy} đã thêm "${video.title}" vào danh sách chờ`,
            type: 'status',
            timestamp: Date.now(),
        };
        await this.redis.lpush(ROOM_CHAT_KEY(roomId), systemMsg, MAX_CHAT_MESSAGES);
        this.server.to(roomId).emit('newMessage', systemMsg);
    }

    @SubscribeMessage('removeVideoFromWishlist')
    async handleRemoveVideoFromWishlist(
        @ConnectedSocket() _client: Socket,
        @MessageBody() data: { roomId: string; videoId: string },
    ) {
        const { roomId, videoId } = data;
        const wishlistKey = ROOM_WISHLIST_KEY(roomId);

        const existing = await this.redis.lrange<WishlistVideo>(wishlistKey, 0, -1);
        const filtered = existing.filter((v) => v.id !== videoId);

        // Rebuild wishlist (xoá key cũ rồi lpush lại theo thứ tự)
        await this.redis.del(wishlistKey);
        for (let i = filtered.length - 1; i >= 0; i--) {
            await this.redis.lpush(wishlistKey, filtered[i], MAX_WISHLIST_ITEMS);
        }
        if (filtered.length > 0) {
            await this.redis.expire(wishlistKey, WISHLIST_TTL);
        }

        this.server.to(roomId).emit('wishlistUpdated', filtered);
    }

    @SubscribeMessage('playVideoFromWishlist')
    async handlePlayVideoFromWishlist(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; videoId: string },
    ) {
        const { roomId, videoId } = data;
        const info = this.socketRoomMap.get(client.id);
        if (!info) return;

        // 1. Kiểm tra quyền Host (Chỉ Host mới có quyền chuyển phim)
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: { host: true }
        });
        if (!room || room.hostId !== info.userId) {
            client.emit('error', 'Chỉ chủ phòng mới có quyền chuyển phim.');
            return;
        }

        // 2. Lấy thông tin video từ wishlist trong Redis
        const wishlistKey = ROOM_WISHLIST_KEY(roomId);
        const existing = await this.redis.lrange<WishlistVideo>(wishlistKey, 0, -1);
        const videoToPlay = existing.find(v => v.id === videoId);
        
        if (!videoToPlay) {
            client.emit('error', 'Không tìm thấy phim trong hàng chờ.');
            return;
        }

        // 3. Cập nhật Database
        await this.prisma.room.update({
            where: { id: roomId },
            data: { videoId: videoToPlay.id }
        });

        // 4. Xóa phim này khỏi wishlist
        const filtered = existing.filter(v => v.id !== videoId);
        await this.redis.del(wishlistKey);
        for (let i = filtered.length - 1; i >= 0; i--) {
            await this.redis.lpush(wishlistKey, filtered[i], MAX_WISHLIST_ITEMS);
        }
        await this.redis.expire(wishlistKey, WISHLIST_TTL);

        // 5. Xóa trạng thái video cũ trong Redis để bắt đầu từ 0
        await this.redis.del(ROOM_VIDEO_STATE_KEY(roomId));

        // 6. Thông báo cho mọi người
        this.server.to(roomId).emit('videoChanged', {
            videoId: videoToPlay.id,
            title: videoToPlay.title,
            thumbnailUrl: videoToPlay.thumbnailUrl
        });
        this.server.to(roomId).emit('wishlistUpdated', filtered);

        const systemMsg: ChatMessage = {
            id: `sys_play_${Date.now()}`,
            roomId,
            username: 'system',
            message: `${info.username} đã bắt đầu phát: ${videoToPlay.title}`,
            type: 'status',
            timestamp: Date.now(),
        };
        this.server.to(roomId).emit('newMessage', systemMsg);
        
        this.logger.log(`Host ${info.username} started playing video ${videoId} from wishlist in room ${roomId}`);
    }

    private async notifyRoomsList(roomId: string) {
        const members = await this.getRoomMembers(roomId);
        this.logger.log(`Notifying global list: Room ${roomId} now has ${members.length} users`);
        this.server.to('global_rooms_list').emit('roomUpdate', { roomId, currentUsers: members.length });
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private async getRoomMembers(roomId: string): Promise<{ userId: string; username: string; avatarUrl?: string; role?: string; joinAt?: number }[]> {
        const keys = await this.redis.keys(`${ROOM_MEMBERS_KEY(roomId)}:socket:*`);
        const members: { userId: string; username: string; avatarUrl?: string; role?: string; joinAt?: number }[] = [];
        const seen = new Set<string>();

        // Lấy thông tin thành viên từ Redis
        const membersData = await Promise.all(
            keys.map(key => this.redis.get<{ userId: string; username: string; avatarUrl?: string; role?: string; joinAt?: number }>(key))
        );

        for (const info of membersData) {
            if (info && !seen.has(info.username)) {
                seen.add(info.username);
                members.push(info);
            }
        }
        return members;
    }

    @SubscribeMessage('kickMember')
    async handleKickMember(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; targetUsername: string },
    ) {
        const { roomId, targetUsername } = data;
        const info = this.socketRoomMap.get(client.id);
        if (!info) return;

        // 1. Kiểm tra xem người gửi có phải là Host không
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            select: { hostId: true }
        });

        if (room?.hostId !== info.userId) {
            this.logger.warn(`User ${info.username} tried to kick ${targetUsername} but is not host`);
            return;
        }

        // 2. Tìm tất cả socketId của người bị kick trong phòng này
        const socketsToKick: string[] = [];
        for (const [sId, sInfo] of this.socketRoomMap.entries()) {
            if (sInfo.roomId === roomId && sInfo.username.toLowerCase() === targetUsername.toLowerCase()) {
                socketsToKick.push(sId);
            }
        }

        if (socketsToKick.length > 0) {
            this.logger.log(`Kicking user ${targetUsername} from room ${roomId}`);

            // Gửi tin nhắn hệ thống thông báo cho cả phòng
            const systemMsg: ChatMessage = {
                id: `sys_kick_${Date.now()}`,
                roomId,
                username: 'system',
                message: `${targetUsername} đã bị mời ra khỏi phòng bởi chủ phòng.`,
                type: 'status',
                timestamp: Date.now(),
            };
            this.server.to(roomId).emit('newMessage', systemMsg);

            // Thông báo riêng cho người bị kick và ngắt kết nối họ
            for (const sId of socketsToKick) {
                this.server.to(sId).emit('kicked');
                const targetSocket = this.server.sockets.sockets.get(sId);
                if (targetSocket) {
                    targetSocket.leave(roomId);
                }
                this.socketRoomMap.delete(sId);
                await this.redis.del(MEMBER_SOCKET_KEY(roomId, sId));
            }

            // Cập nhật lại danh sách thành viên cho những người còn lại
            const members = await this.getRoomMembers(roomId);
            this.server.to(roomId).emit('roomMembers', members);
            this.server.to(roomId).emit('userLeft', targetUsername);
            
            // Xóa location của người bị kick (nếu họ không còn ở phòng nào khác)
            await this.redis.del(USER_LOCATION_KEY(targetUsername));

            // Cập nhật số lượng người xem cho Lobby
            await this.notifyRoomsList(roomId);
        }
    }

    @SubscribeMessage('endRoom')
    async handleEndRoom(
        @ConnectedSocket() client: Socket,
         @MessageBody() data: { roomId: string; reason?: string },
    ) {
        const { roomId, reason } = data;

        // Lấy thông tin người dừng phòng
        const info = this.socketRoomMap.get(client.id);
        const stoppedBy = info?.username || 'unknown';
        const stoppedByRole = info?.role === 'admin' ? 'admin' : 'host';
        // Broadcast cho tất cả người trong phòng biết phòng đã kết thúc
        this.server.to(roomId).emit('roomEnded', { reason, stoppedBy, stoppedByRole });
        // Dọn sạch dữ liệu phòng trên Redis (members, chat, wishlist)
        await this.redis.delPattern(`ww:room:${roomId}:*`);
        this.logger.log(`Room ${roomId} ended by ${stoppedBy} (${stoppedByRole}) and Redis data cleared`);
    }

    @SubscribeMessage('updateHostMediaState')
    handleUpdateHostMediaState(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; mic: boolean; cam: boolean },
    ) {
        const { roomId, mic, cam } = data;
        // Broadcast trạng thái media của host cho tất cả người trong phòng
        client.to(roomId).emit('hostMediaStateUpdate', { mic, cam });
    }
}

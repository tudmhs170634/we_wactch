'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  x: number;
}

export interface WishlistVideo {
  id: string;
  title: string;
  thumbnailUrl?: string;
  duration?: number;
  addedBy: string;
  addedAt: number;
}

export interface RoomMember {
  username: string;
  avatarUrl?: string;
}

export interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
}

export interface VideoActionEvent {
  action: 'play' | 'pause' | 'seek';
  currentTime: number;
  sentAt: number;
  username: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export const useSocket = (
  roomId?: string,
  user?: any,
  password?: string,
  onRoomEnded?: (reason?: string, stoppedBy?: string, stoppedByRole?: string) => void
) => {
  const socketRef = useRef<Socket | null>(null);
  const joinAudioRef = useRef<HTMLAudioElement | null>(null);
  const leaveAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Khởi tạo audio objects
    joinAudioRef.current = new Audio('/join.wav');
    leaveAudioRef.current = new Audio('/out.wav');
    
    if (joinAudioRef.current) joinAudioRef.current.volume = 0.5;
    if (leaveAudioRef.current) leaveAudioRef.current.volume = 0.5;
  }, []);

  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [emojis, setEmojis] = useState<(EmojiEvent & { localId: number })[]>([]);
  const [wishlist, setWishlist] = useState<WishlistVideo[]>([]);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentHostId, setCurrentHostId] = useState<string | null>(null);
  const [currentHostUsername, setCurrentHostUsername] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<VideoState | null>(null);
  const [lastVideoAction, setLastVideoAction] = useState<VideoActionEvent | null>(null);
  const [videoChangeTrigger, setVideoChangeTrigger] = useState(0);
  // username -> mutedUntil (timestamp ms)
  const [mutedUsers, setMutedUsers] = useState<Record<string, number>>({});
  const [chatMuteInfo, setChatMuteInfo] = useState<{ mutedUntil: number; mutedBy: string; remainingMinutes: number } | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const timeSyncSamples = useRef<number[]>([]);
  const [hostMediaState, setHostMediaState] = useState<{ mic: boolean; cam: boolean }>({ mic: true, cam: true });

  useEffect(() => {
    if (!roomId || !user) return;

    setSocketError(null);
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    // ── Connection ──────────────────────────────────────────────────────────
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinRoom', {
        roomId,
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        role: user.role,
        password: password,
      });
     // ── NTP-lite Clock Sync: 3 rounds of ping-pong ──
      timeSyncSamples.current = [];
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          socket.emit('timeSyncRequest', { clientSendTime: Date.now() });
        }, i * 200);
      }
    });

    socket.on('timeSyncResponse', (data: { clientSendTime: number; serverTime: number }) => {
      const now = Date.now();
      const rtt = now - data.clientSendTime;
      const offset = data.serverTime - (data.clientSendTime + rtt / 2);
      timeSyncSamples.current.push(offset);

      if (timeSyncSamples.current.length >= 3) {
        const avg = timeSyncSamples.current.reduce((a, b) => a + b, 0) / timeSyncSamples.current.length;
        setServerTimeOffset(Math.round(avg));
      }
    });

    socket.on('error', (err: string) => {
      setSocketError(err);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // ── Members ─────────────────────────────────────────────────────────────
    socket.on('roomMembers', (membersList: RoomMember[]) => {
      setMembers(membersList);
    });

    socket.on('userJoined', (member: RoomMember) => {
      // Phát tiếng vào phòng
      joinAudioRef.current?.play().catch(() => {});
      
      setMembers((prev) => {
        if (prev.find((m) => m.username === member.username)) return prev;
        return [...prev, member];
      });
    });

    socket.on('userLeft', (username: string) => {
      // Phát tiếng rời phòng
      leaveAudioRef.current?.play().catch(() => {});

      setMembers((prev) => prev.filter((m) => m.username !== username));
    });

    // Lắng nghe khi host/admin kết thúc phòng
    socket.on('roomEnded', (data?: { reason?: string; stoppedBy?: string; stoppedByRole?: string }) => {
      onRoomEnded?.(data?.reason, data?.stoppedBy, data?.stoppedByRole);
    });

    // ── Chat ─────────────────────────────────────────────────────────────────
    socket.on('chatHistory', (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on('newMessage', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    // ── Emoji Reactions ──────────────────────────────────────────────────────
    socket.on('emojiReaction', (event: EmojiEvent) => {
      const localId = Date.now() + Math.random();
      const enriched = { ...event, localId };
      setEmojis((prev) => [...prev, enriched]);
      setTimeout(() => {
        setEmojis((prev) => prev.filter((e) => e.localId !== localId));
      }, 2500);
    });

    // ── Wishlist ─────────────────────────────────────────────────────────────
    socket.on('wishlistSync', (list: WishlistVideo[]) => {
      setWishlist(list);
    });

    socket.on('wishlistUpdated', (list: WishlistVideo[]) => {
      setWishlist(list);
    });

    socket.on('wishlistError', ({ message }: { message: string }) => {
      setWishlistError(message);
      setTimeout(() => setWishlistError(null), 3000);
    });

    socket.on('hostTransferred', ({ newHostId, newHostName }: { newHostName: string, newHostId: string }) => {
      setCurrentHostId(newHostId);
      if (newHostName) {
        setCurrentHostUsername(newHostName);
      }
      
      if (newHostId === user?.id) {
        toast.success('Bạn đã được chuyển quyền làm Host!', {
          description: 'Bạn hiện có toàn quyền điều khiển phòng.',
          duration: 5000,
        });
      } else {
        toast.info(`Quyền Host đã được chuyển cho ${newHostName}.`, {
          duration: 4000,
        });
      }
    });

    // ── Video Sync ──────────────────────────────────────────────────────────
    socket.on('videoSync', (state: VideoState) => {
      setVideoState(state);
    });

    socket.on('videoAction', (event: VideoActionEvent) => {
      setLastVideoAction(event);
    });

    socket.on('videoChanged', (_data: any) => {
      setVideoState(null); // Reset state cũ
      setVideoChangeTrigger(prev => prev + 1);
    });

    // ── Chat Moderation ─────────────────────────────────────────────────────
    // Xóa tin nhắn khỏi UI khi admin/host xóa
    socket.on('messageDeleted', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    // Khi admin mute một user
    socket.on('userMuted', ({ username, mutedUntil }: { username: string; mutedUntil: number; mutedBy: string; durationMinutes: number }) => {
      setMutedUsers((prev) => ({ ...prev, [username]: mutedUntil }));
    });

    // Khi admin bỏ mute
    socket.on('userUnmuted', ({ username }: { username: string }) => {
      setMutedUsers((prev) => {
        const next = { ...prev };
        delete next[username];
        return next;
      });
    });

    // Khi chính user bị cấm cố gửi tin nhắn -> server trả về thông tin mute
    socket.on('chatMuted', (info: { mutedUntil: number; mutedBy: string; remainingMinutes: number }) => {
      setChatMuteInfo(info);
      setTimeout(() => setChatMuteInfo(null), 4000);
    });

    
    socket.on('hostMediaStateUpdate', (state: { mic: boolean; cam: boolean }) => {
      setHostMediaState(state);
    });

    socket.on('kicked', () => {
      toast.error('Bạn đã bị chủ phòng mời ra khỏi phòng.');
      setTimeout(() => {
        window.location.href = '/rooms';
      }, 2000);
    });

    return () => {
      // Thông báo server trước khi disconnect
      if (roomId && user) {
        socket.emit('leaveRoom', { roomId, username: user.username });
      }
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setMembers([]);
    };
  }, [roomId, user?.username]); // eslint-disable-line react-hooks/exhaustive-deps

  const requestVideoSync = useCallback(() => {
    if (!socketRef.current || !roomId) return;
    socketRef.current.emit('requestVideoSync', { roomId });
  }, [roomId]);

  const sendMessage = useCallback(
    (message: string) => {
      if (!socketRef.current || !roomId || !user || !message.trim()) return;
      socketRef.current.emit('sendMessage', {
        roomId,
        message: message.trim(),
        username: user.username,
        avatarUrl: user.avatarUrl,
      });
    },
    [roomId, user],
  );

  const sendEmoji = useCallback(
    (emoji: string, x?: number) => {
      if (!socketRef.current || !roomId || !user) return;
      socketRef.current.emit('sendEmoji', {
        roomId,
        emoji,
        username: user.username,
        x: x ?? Math.random() * 80 + 10,
      });
    },
    [roomId, user],
  );

  const addVideoToWishlist = useCallback(
    (video: { id: string; title: string; thumbnailUrl?: string; duration?: number }) => {
      if (!socketRef.current || !roomId || !user) return;
      socketRef.current.emit('addVideoToWishlist', {
        roomId,
        video,
        addedBy: user.username,
      });
    },
    [roomId, user],
  );

  const removeVideoFromWishlist = useCallback(
    (videoId: string) => {
      if (!socketRef.current || !roomId) return;
      socketRef.current.emit('removeVideoFromWishlist', { roomId, videoId });
    },
    [roomId],
  );

  const sendVideoAction = useCallback(
    (action: 'play' | 'pause' | 'seek', currentTime: number) => {
      if (!socketRef.current || !roomId) return;
      socketRef.current.emit('videoAction', {
        roomId,
        action,
        currentTime,
        sentAt: Date.now() + serverTimeOffset, // NTP-corrected timestamp
      });
    },
    [roomId, serverTimeOffset],
  );

  const updateHostMediaState = useCallback(
    (mic: boolean, cam: boolean) => {
      if (!socketRef.current || !roomId) return;
      socketRef.current.emit('updateHostMediaState', { roomId, mic, cam });
    },
    [roomId],
  );

   const playVideoFromWishlist = useCallback(
    (videoId: string) => {
      if (!socketRef.current || !roomId) return;
      socketRef.current.emit('playVideoFromWishlist', { roomId, videoId });
    },
    [roomId],
  );

  const kickMember = useCallback(
    (targetUsername: string) => {
      if (!socketRef.current || !roomId) return;
      socketRef.current.emit('kickMember', { roomId, targetUsername });
    },
    [roomId],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!socketRef.current || !roomId) return;
      socketRef.current.emit('deleteMessage', { roomId, messageId });
    },
    [roomId],
  );

  const muteChatUser = useCallback(
    (targetUsername: string, durationMinutes: number) => {
      if (!socketRef.current || !roomId) return;
      socketRef.current.emit('muteChatUser', { roomId, targetUsername, durationMinutes });
    },
    [roomId],
  );

  const unmuteChatUser = useCallback(
    (targetUsername: string) => {
      if (!socketRef.current || !roomId) return;
      socketRef.current.emit('unmuteChatUser', { roomId, targetUsername });
    },
    [roomId],
  );

  return {
    socket: socketRef.current,
    isConnected,
    currentHostId,
    currentHostUsername,
    socketError,
    members,
    messages,
    emojis,
    wishlist,
    wishlistError,
    // actions
    sendMessage,
    sendEmoji,
    addVideoToWishlist,
    removeVideoFromWishlist,
    playVideoFromWishlist,
    sendVideoAction,
    requestVideoSync,
    videoState,
    lastVideoAction,
    videoChangeTrigger,
    setCurrentHostId,
    mutedUsers,
    chatMuteInfo,
    deleteMessage,
    muteChatUser,
    unmuteChatUser,
    serverTimeOffset,
    hostMediaState,
    updateHostMediaState,
    kickMember,
  };
};

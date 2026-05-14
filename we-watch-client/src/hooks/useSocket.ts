'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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
  onRoomEnded?: () => void
) => {
  const socketRef = useRef<Socket | null>(null);

  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [emojis, setEmojis] = useState<(EmojiEvent & { localId: number })[]>([]);
  const [wishlist, setWishlist] = useState<WishlistVideo[]>([]);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentHostId, setCurrentHostId] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<VideoState | null>(null);
  const [lastVideoAction, setLastVideoAction] = useState<VideoActionEvent | null>(null);
  const [videoChangeTrigger, setVideoChangeTrigger] = useState(0);

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
      setMembers((prev) => {
        if (prev.find((m) => m.username === member.username)) return prev;
        return [...prev, member];
      });
    });

    socket.on('userLeft', (username: string) => {
      setMembers((prev) => prev.filter((m) => m.username !== username));
    });

    // Lắng nghe khi host kết thúc phòng
    socket.on('roomEnded', () => {
      onRoomEnded?.();
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

    socket.on('hostTransferred', ({ newHostId }: { newHostName: string, newHostId: string }) => {
      setCurrentHostId(newHostId);
    });

    // ── Video Sync ──────────────────────────────────────────────────────────
    socket.on('videoSync', (state: VideoState) => {
      setVideoState(state);
    });

    socket.on('videoAction', (event: VideoActionEvent) => {
      setLastVideoAction(event);
    });

    socket.on('videoChanged', (data: any) => {
      setVideoState(null); // Reset state cũ
      setVideoChangeTrigger(prev => prev + 1);
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
        sentAt: Date.now(),
      });
    },
    [roomId],
  );

  return {
    socket: socketRef.current,
    isConnected,
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
    sendVideoAction,
    requestVideoSync,
    videoState,
    lastVideoAction,
    videoChangeTrigger,
    currentHostId,
    setCurrentHostId,
  };
};

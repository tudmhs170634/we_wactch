'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (roomId?: string, user?: any, onRoomEnded?: () => void) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!roomId || !user) return;

    const newSocket = io('http://localhost:3000', {
      query: { roomId, username: user.username },
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket room:', roomId);
      newSocket.emit('joinRoom', { 
        roomId, 
        username: user.username,
        avatarUrl: user.avatarUrl 
      });
    });

    newSocket.on('roomMembers', (membersList: any[]) => {
      setMembers(membersList);
    });

    newSocket.on('userJoined', (member: any) => {
      setMembers((prev) => {
        if (prev.find((m) => m.username === member.username)) return prev;
        return [...prev, member];
      });
    });

    newSocket.on('userLeft', (username: string) => {
      setMembers((prev) => prev.filter((m) => m.username !== username));
    });

    // Lắng nghe khi host kết thúc phòng
    newSocket.on('roomEnded', () => {
      onRoomEnded?.();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, user]);

  return { socket, members };
};

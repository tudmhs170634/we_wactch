import api from '../lib/axios';

export interface Room {
  id: string;
  name: string;
  type: 'public' | 'private';
  hostId: string;
  videoId?: string;
  createdAt: string;
  host?: {
    username: string;
    avatarUrl?: string;
  };
}

export const getAllRooms = async (type?: string): Promise<Room[]> => {
  const { data } = await api.get('/rooms', { params: { type } });
  return data;
};

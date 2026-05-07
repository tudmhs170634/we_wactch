import api from '../lib/axios';

export interface CreateRoomPayload {
  title: string;
  type?: 'private' | 'public';
  videoId?: string;
  password?: string;
  maxUsers?: number;
}

export const createRoom = async (payload: CreateRoomPayload) => {
  const { data } = await api.post('/rooms', payload);
  return data;
};

export const getRooms = async (page = 1, limit = 10) => {
  const { data } = await api.get('/rooms', { params: { page, limit } });
  return data;
};

export const getRoom = async (id: string) => {
  const { data } = await api.get(`/rooms/${id}`);
  return data;
};

export const getRoomBySlug = async (slug: string) => {
  const { data } = await api.get(`/rooms/slug/${slug}`);
  return data;
};

export const verifyRoomPassword = async (id: string, password: string) => {
  const { data } = await api.post(`/rooms/${id}/verify`, { password });
  return data;
};

export const updateRoom = async (id: string, payload: Partial<CreateRoomPayload> & { isActive?: boolean }) => {
  const { data } = await api.patch(`/rooms/${id}`, payload);
  return data;
};

export const deleteRoom = async (id: string) => {
  const { data } = await api.delete(`/rooms/${id}`);
  return data;
};

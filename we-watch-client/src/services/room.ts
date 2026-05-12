import api from '../lib/axios';

export interface Room {
  id: string;
  title: string;
  type: 'public' | 'private';
  hostId: string;
  videoId?: string;
  image?: string | null;
  createdAt: string;
  host?: {
    username: string;
    avatarUrl?: string;
  };
}

export interface CreateRoomPayload {
  title: string;
  type?: 'private' | 'public';
  videoId?: string;
  password?: string;
  maxUsers?: number;
  imageUrl?: string;
  imageFile?: File;
}

export const createRoom = async (payload: CreateRoomPayload) => {
  const form = new FormData();
  form.append('title', payload.title);
  if (payload.type) form.append('type', payload.type);
  if (payload.videoId) form.append('videoId', payload.videoId);
  if (payload.password) form.append('password', payload.password);
  if (typeof payload.maxUsers === 'number') form.append('maxUsers', String(payload.maxUsers));
  if (payload.imageUrl) form.append('imageUrl', payload.imageUrl);
  if (payload.imageFile) form.append('image', payload.imageFile);

  const { data } = await api.post('/rooms', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getRooms = async (page = 1, limit = 10, type?: string) => {
  const params: any = { page, limit };
  if (type) params.type = type;
  const { data } = await api.get('/rooms', { params });
  return data;
};

// Hàm bổ sung để tương thích với code Admin — trả về mảng rooms thay vì object phân trang
export const getAllRooms = async (type?: string): Promise<Room[]> => {
  const res = await getRooms(1, 100, type);
  return res.rooms ?? [];
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

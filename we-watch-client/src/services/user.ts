import api from '../lib/axios';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
}

export const getAllUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/users');
  return data;
};

export const banUser = async (id: string, isBanned: boolean) => {
  const { data } = await api.patch(`/users/${id}/ban`, { isBanned });
  return data;
};

export const switchRole = async (id: string) => {
  const { data } = await api.patch(`/users/${id}/switch-role`);
  return data;
};

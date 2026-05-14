import api from '../lib/axios';

export const getAdminStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};

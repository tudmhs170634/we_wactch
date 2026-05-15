import api from '../lib/axios';

export const getAdminStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};

export const getViolationReports = async (page = 1, limit = 10) => {
  const { data } = await api.get('/admin/reports', {
    params: { page, limit },
  });
  return data;
};

import api from '../lib/axios';
import axios from 'axios';

export interface VideoPayload {
  title: string;
  description?: string;
  videoUrl: string;
  videoKey: string;
  thumbnailUrl?: string;
  duration: number;
  size: number;
}

export const uploadThumbnail = async (file: File): Promise<{ url: string; publicId: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const { data } = await api.post<{ url: string; publicId: string }>('/upload/thumbnail', formData);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Thumbnail upload failed');
  }
};

export const getPresignedUrl = async (
  mimeType: string,
): Promise<{ presignedUrl: string; key: string; publicUrl: string }> => {
  const { data } = await api.post('/videos/presigned-url', { mimeType });
  return data;
};

export const uploadVideoToSpaces = async (
  presignedUrl: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> => {
  await axios.put(presignedUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (evt) => {
      const pct = Math.round((evt.loaded * 100) / (evt.total ?? 1));
      onProgress?.(pct);
    },
  });
};

export const createVideo = async (payload: VideoPayload) => {
  const { data } = await api.post('/videos', payload);
  return data;
};

export const getVideos = async (page = 1, limit = 12) => {
  const { data } = await api.get('/videos', { params: { page, limit } });
  return data;
};

export const getVideosAdmin = async (page = 1, limit = 50) => {
  const { data } = await api.get('/videos/admin', { params: { page, limit } });
  return data;
};

export const getVideo = async (id: string) => {
  const { data } = await api.get(`/videos/${id}`);
  return data;
};

export const getStreamUrl = async (id: string) => {
  const { data } = await api.get(`/videos/${id}/stream-url`);
  return data;
};

export const updateVideo = async (id: string, payload: Partial<VideoPayload>) => {
  const { data } = await api.patch(`/videos/${id}`, payload);
  return data;
};

export const approveVideo = async (id: string) => {
  const { data } = await api.patch(`/videos/${id}/approve`);
  return data;
};

export const deleteVideo = async (id: string) => {
  const { data } = await api.delete(`/videos/${id}`);
  return data;
};

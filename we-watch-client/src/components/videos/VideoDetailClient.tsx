'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Calendar, HardDrive, Clock } from 'lucide-react';
import Header from '@/src/components/Header';
import Background from '@/src/components/layout/Background';
import VideoPlayer from '@/src/components/videos/VideoPlayer';
import { getVideo } from '@/src/services/video';
import api from '@/src/lib/axios';

const formatDuration = (s: number) => {
  if (!s) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatSize = (bytes: string | number) => {
  const n = Number(bytes);
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} MB`;
  return `${(n / 1e3).toFixed(0)} KB`;
};

export default function VideoDetailClient({ id }: { id: string }) {
  const [video, setVideo] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getVideo(id)
      .then(async (v) => {
        setVideo(v);
        // Lấy presigned URL để stream video private
        const { data } = await api.get(`/videos/${id}/stream-url`);
        setStreamUrl(data.url);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="relative min-h-screen bg-[#0A0A0B] font-sans text-slate-100">
      <Background />
      <Header />

      <div className="relative z-10 mx-auto mt-14 w-full max-w-5xl px-6 pt-28 pb-20">
        {/* Back */}
        <Link
          href="/videos"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>

        {loading && (
          <div className="flex flex-col gap-6 animate-pulse">
            <div className="aspect-video w-full rounded-[24px] bg-white/10" />
            <div className="h-8 w-1/2 rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/10" />
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-lg font-bold text-white">Video không tồn tại.</p>
            <Link href="/videos" className="mt-4 inline-block text-sm text-pink-400 hover:underline">
              Quay lại
            </Link>
          </div>
        )}

        {video && (
          <div className="flex flex-col gap-8">
            {/* Player */}
            {streamUrl && <VideoPlayer src={streamUrl} poster={video.thumbnailUrl} />}

            {/* Info */}
            <div className="glass rounded-[28px] border border-white/10 bg-white/5 p-8">
              <h1 className="text-3xl font-black tracking-tight text-white">{video.title}</h1>

              {/* Meta badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {video.owner && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
                    <User className="h-3 w-3" />
                    {video.owner.username}
                  </span>
                )}
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
                  <Clock className="h-3 w-3" />
                  {formatDuration(video.duration)}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
                  <HardDrive className="h-3 w-3" />
                  {formatSize(video.size)}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
                  <Calendar className="h-3 w-3" />
                  {new Date(video.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              {video.description && (
                <p className="mt-6 text-[15px] leading-7 font-medium text-white/70">
                  {video.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

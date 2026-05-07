'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Plus, Film } from 'lucide-react';
import Header from '@/src/components/Header';
import Background from '@/src/components/layout/Background';
import UploadVideoModal from './UploadVideoModal';
import CreateRoomModal from '@/src/components/rooms/CreateRoomModal';
import { useAuthStore } from '@/src/store/useAuthStore';
import { getVideos } from '@/src/services/video';

type Video = {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  videoUrl: string;
  duration: number;
  size: number | bigint;
  createdAt: string;
  owner?: { username: string; avatarUrl?: string | null };
};

const formatDuration = (seconds: number) => {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatSize = (bytes: number | bigint) => {
  const n = Number(bytes);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} MB`;
  return `${(n / 1e3).toFixed(0)} KB`;
};

type VideosPageClientProps = {
  initialSearch?: string;
};

export default function VideosPageClient({ initialSearch = '' }: VideosPageClientProps) {
  const [query, setQuery] = useState(initialSearch);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVideos(1, 50);
      setVideos(res.videos ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => v.title.toLowerCase().includes(q));
  }, [query, videos]);

  return (
    <main className="relative min-h-screen bg-[#0A0A0B] font-sans text-slate-100">
      <Background />
      <Header />

      <div className="relative z-10 mx-auto mt-14 w-full max-w-7xl px-6 pt-28 pb-20">
        <div className="mb-10 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary h-2 w-2 rounded-full" />
              <h1 className="text-4xl font-black tracking-tighter text-white">
                Tất cả <span className="text-secondary">Videos</span>
              </h1>
            </div>
            <p className="max-w-2xl font-medium text-white/70">
              Trải nghiệm các video đa dạng và phong phú cùng We Watch.
            </p>
          </div>

          <div className="glass flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
            <div className="group/input relative w-full md:max-w-xl">
              <Search className="group-focus-within/input:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter theo title…"
                className="glass focus:border-primary/50 w-full rounded-[18px] bg-transparent py-3 pr-4 pl-12 text-[15px] font-medium text-white placeholder-white/35 outline-none"
              />
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-end">
              <span className="text-xs font-black tracking-widest text-white/60 uppercase">
                {filtered.length} / {total}
              </span>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="hover:text-primary rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black tracking-widest text-white/70 uppercase transition-colors"
              >
                Clear
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-xs font-black tracking-widest text-white uppercase transition-opacity hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Đóng góp
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-[28px] border border-white/10 bg-white/5">
                <div className="aspect-[16/10] rounded-t-[28px] bg-white/10" />
                <div className="p-6 space-y-3">
                  <div className="h-3 w-1/3 rounded bg-white/10" />
                  <div className="h-5 w-2/3 rounded bg-white/10" />
                  <div className="h-3 w-full rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-10 text-center">
            <Film className="mx-auto mb-4 h-12 w-12 text-white/20" />
            <p className="text-lg font-bold text-white">
              {query ? 'Không tìm thấy video phù hợp.' : 'Chưa có video nào.'}
            </p>
            <p className="mt-2 text-sm font-medium text-white/60">
              {query ? 'Thử nhập từ khóa khác.' : 'Hãy là người đầu tiên đóng góp!'}
            </p>
          </div>
        )}

        {/* Video grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((video) => (
              <div key={video.id} className="glass group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 transition-all hover:border-white/20">
                {/* + button overlay */}
                <button
                  onClick={(e) => { e.preventDefault(); setSelectedVideo(video); setRoomModalOpen(true); }}
                  className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  title="Tạo phòng với video này"
                >
                  <Plus className="h-4 w-4" />
                </button>

                <Link href={`/videos/${video.id}`} className="block">
                  <div className="relative aspect-[16/10] w-full bg-white/5">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover opacity-75 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Film className="h-10 w-10 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-90" />
                  </div>

                  <div className="p-6">
                    <div className="text-secondary text-[10px] font-black tracking-[0.2em] uppercase">
                      {video.owner?.username ?? 'Unknown'}
                    </div>
                    <div className="mt-2 line-clamp-1 text-xl font-black text-white">
                      {video.title}
                    </div>
                    <div className="mt-3 line-clamp-2 text-sm font-medium text-white/60">
                      {video.description ?? '—'}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs font-bold tracking-widest text-white/60 uppercase">
                      <span>{formatDuration(video.duration)}</span>
                      <span>{formatSize(video.size)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <UploadVideoModal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          fetchVideos();
        }}
      />
      <CreateRoomModal
        isOpen={roomModalOpen}
        onClose={() => { setRoomModalOpen(false); setSelectedVideo(null); }}
        defaultVideoId={selectedVideo?.id}
        defaultVideoTitle={selectedVideo?.title}
        defaultVideoThumb={selectedVideo?.thumbnailUrl}
      />
    </main>
  );
}

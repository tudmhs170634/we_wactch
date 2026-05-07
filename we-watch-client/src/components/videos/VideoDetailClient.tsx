'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, User, Calendar, HardDrive, Clock, Plus, Film,
} from 'lucide-react';
import Header from '@/src/components/Header';
import Background from '@/src/components/layout/Background';
import VideoPlayer from '@/src/components/videos/VideoPlayer';
import CreateRoomModal from '@/src/components/rooms/CreateRoomModal';
import { getVideo, getVideos } from '@/src/services/video';
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
  const [related, setRelated] = useState<any[]>([]);
  const [roomModalOpen, setRoomModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setStreamUrl(null);

    getVideo(id)
      .then(async (v) => {
        setVideo(v);
        const { data } = await api.get(`/videos/${id}/stream-url`);
        setStreamUrl(data.url);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    // Fetch 4 videos ngẫu nhiên cho phần "Khám phá thêm"
    getVideos(1, 20).then((res) => {
      const all: any[] = res.videos ?? [];
      const others = all.filter((v) => v.id !== id);
      // Shuffle & take 4
      const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 4);
      setRelated(shuffled);
    }).catch(() => {});
  }, [id]);

  return (
    <main className="relative min-h-screen bg-[#0A0A0B] font-sans text-slate-100">
      <Background />
      <Header />

      <div className="relative z-10 mx-auto mt-14 w-full max-w-7xl px-6 pt-28 pb-20">
        {/* Back */}
        <Link
          href="/videos"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>

        {loading && (
          <div className="flex flex-col gap-6 animate-pulse lg:flex-row">
            <div className="hidden lg:block lg:w-[300px] xl:w-[340px] space-y-4 flex-shrink-0">
              <div className="aspect-[2/3] w-full rounded-[24px] bg-white/10" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="aspect-video w-full rounded-[24px] bg-white/10" />
              <div className="h-8 w-1/2 rounded bg-white/10" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-10 text-center">
            <Film className="mx-auto mb-4 h-12 w-12 text-white/20" />
            <p className="text-lg font-bold text-white">Video không tồn tại.</p>
            <Link
              href="/videos"
              className="mt-4 inline-block text-sm text-pink-400 hover:underline"
            >
              Quay lại
            </Link>
          </div>
        )}

        {video && (
          <>
            {/* ── Main layout: sidebar + player ── */}
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              {/* LEFT SIDEBAR */}
              <aside className="flex w-full flex-col gap-6 lg:w-[300px] xl:w-[340px] lg:flex-shrink-0">
                {/* Thumbnail / Poster */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[24px] bg-white/5">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Film className="h-12 w-12 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Info card */}
                <div className="glass rounded-[24px] border border-white/10 bg-white/5 p-6 space-y-4">
                  <h1 className="text-2xl font-black tracking-tight text-white leading-tight">
                    {video.title}
                  </h1>

                  {/* Meta */}
                  <div className="flex flex-col gap-2">
                    {video.owner && (
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="font-bold text-white">{video.owner.username}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <HardDrive className="h-4 w-4 flex-shrink-0" />
                      <span>{formatSize(video.size)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{new Date(video.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {video.description && (
                    <p className="text-sm leading-6 text-white/60 border-t border-white/10 pt-4">
                      {video.description}
                    </p>
                  )}

                  {/* Tạo phòng ngay */}
                  <button
                    onClick={() => setRoomModalOpen(true)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02] hover:opacity-90 active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo phòng ngay
                  </button>
                </div>
              </aside>

              {/* RIGHT: Video player */}
              <div className="flex-1 min-w-0">
                {streamUrl ? (
                  <VideoPlayer src={streamUrl} poster={video.thumbnailUrl} />
                ) : (
                  <div className="aspect-video w-full animate-pulse rounded-[24px] bg-white/10" />
                )}
              </div>
            </div>

            {/* ── Khám phá thêm ── */}
            {related.length > 0 && (
              <div className="mt-16">
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-pink-500" />
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    Khám phá <span className="text-secondary">thêm</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {related.map((v) => (
                    <Link
                      key={v.id}
                      href={`/videos/${v.id}`}
                      className="group glass overflow-hidden rounded-[20px] border border-white/10 bg-white/5 transition-all hover:border-white/20"
                    >
                      <div className="relative aspect-[16/10] w-full bg-white/5">
                        {v.thumbnailUrl ? (
                          <Image
                            src={v.thumbnailUrl}
                            alt={v.title}
                            fill
                            className="object-cover opacity-70 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Film className="h-8 w-8 text-white/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
                      </div>
                      <div className="p-4">
                        <p className="line-clamp-2 text-sm font-bold text-white group-hover:text-pink-400 transition-colors">
                          {v.title}
                        </p>
                        <p className="mt-1 text-xs text-white/40">{formatDuration(v.duration)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreateRoomModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        defaultVideoId={video?.id}
        defaultVideoTitle={video?.title}
        defaultVideoThumb={video?.thumbnailUrl}
      />
    </main>
  );
}

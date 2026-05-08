'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/home/Hero';
import RoomList from '../components/home/RoomList';
import FilmLibrary from '../components/home/FilmLibrary';
import Background from '../components/layout/Background';
import Testimonials from '../components/home/Testimonials';
import CreateRoomModal from '../components/rooms/CreateRoomModal';
import { useAuthStore } from '../store/useAuthStore';
import { MOCK_TESTIMONIALS } from '../constants/mockData';
import { getRooms } from '../services/room';
import { getVideos } from '../services/video';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [preselectedFilm, setPreselectedFilm] = useState<{
    title: string;
  } | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [roomsRes, setRoomsRes] = useState<any[]>([]);
  const [videosRes, setVideosRes] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setRoomsLoading(true);
      setVideosLoading(true);
      try {
        const [roomsData, videosData] = await Promise.all([
          getRooms(1, 12),
          getVideos(1, 12),
        ]);

        if (cancelled) return;
        setRoomsRes(roomsData?.rooms ?? []);
        setVideosRes(videosData?.videos ?? []);
      } catch {
        if (cancelled) return;
        setRoomsRes([]);
        setVideosRes([]);
      } finally {
        if (cancelled) return;
        setRoomsLoading(false);
        setVideosLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const roomsForHome = useMemo(() => {
    const FALLBACK_IMAGES = [
      'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&q=80',
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80',
      'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&q=80',
    ];

    return (roomsRes ?? []).slice(0, 10).map((r: any, idx: number) => ({
      id: Number.isFinite(Number(r.id)) ? Number(r.id) : idx + 1,
      title: r.title ?? r.name ?? 'Untitled room',
      status: r.isActive ? 'Đang phát' : 'Sắp diễn ra',
      listeners: 0,
      episodes: 1,
      tags: [r.type === 'private' ? 'Private' : 'Public'],
      isPrivate: r.type === 'private',
      image:
        r.image ??
        r.video?.thumbnailUrl ??
        FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
    }));
  }, [roomsRes]);

  const filmsForHome = useMemo(() => {
    const heights = ['h-64', 'h-72', 'h-80', 'h-96'] as const;
    const FALLBACK_IMAGES = [
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80',
      'https://images.unsplash.com/photo-1541562232579-512a21360020?w=800&q=80',
    ];

    return (videosRes ?? []).slice(0, 12).map((v: any, idx: number) => ({
      id: Number.isFinite(Number(v.id)) ? Number(v.id) : idx + 1,
      title: v.title ?? 'Untitled video',
      // FilmLibrary đang link theo slug; tạm dùng id để tương thích route /videos/[id]
      slug: String(v.id ?? idx + 1),
      category: v.owner?.username ?? 'Video',
      h: heights[idx % heights.length],
      img: v.thumbnailUrl ?? FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
    }));
  }, [videosRes]);

  return (
    <main className="relative min-h-screen font-sans text-slate-100">
      <Background />

      <Header />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Hero />

        {!isAuthenticated && (
          <div className="mb-10">
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <h2 className="mb-6 text-3xl font-black tracking-tighter text-white">
                Sẵn sàng trải nghiệm cùng bạn bè?
              </h2>
              <p className="mb-10 max-w-lg text-slate-400">
                Hãy đăng nhập để có thể tự tạo phòng chiếu riêng, tham gia cộng
                đồng và lưu lại những khoảnh khắc đáng nhớ.
              </p>
              <a
                href="/login"
                className="bg-primary shadow-primary/30 rounded-full px-12 py-5 text-lg font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                Bắt đầu ngay bây giờ
              </a>
            </div>
          </div>
        )}

        <RoomList
          rooms={roomsLoading ? [] : roomsForHome}
          isAuthenticated={isAuthenticated}
        />
        <FilmLibrary
          films={videosLoading ? [] : filmsForHome}
          onCreateRoom={(film) => {
            setPreselectedFilm(film);
            setRoomModalOpen(true);
          }}
        />

        {!isAuthenticated && (
          <div className="mb-20">
            <Testimonials testimonials={MOCK_TESTIMONIALS} />
          </div>
        )}
      </div>

      <CreateRoomModal
        isOpen={roomModalOpen}
        onClose={() => {
          setRoomModalOpen(false);
          setPreselectedFilm(null);
        }}
        defaultVideoTitle={preselectedFilm?.title}
      />
    </main>
  );
}

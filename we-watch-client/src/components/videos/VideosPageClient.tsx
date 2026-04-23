'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import Header from '@/src/components/Header';
import Background from '@/src/components/layout/Background';
import { MOCK_VIDEOS } from '@/src/constants/mockData';

type VideosPageClientProps = {
  initialSearch?: string;
};

export default function VideosPageClient({
  initialSearch = '',
}: VideosPageClientProps) {
  const [query, setQuery] = useState(initialSearch);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_VIDEOS;
    return MOCK_VIDEOS.filter((video) => video.title.toLowerCase().includes(q));
  }, [query]);

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
                {filtered.length} / {MOCK_VIDEOS.length}
              </span>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="hover:text-primary rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black tracking-widest text-white/70 uppercase transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-lg font-bold text-white">
              Không tìm thấy video phù hợp.
            </p>
            <p className="mt-2 text-sm font-medium text-white/60">
              Thử nhập từ khóa khác (ví dụ: “dark”, “your”).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.slug}`}
                className="glass group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 transition-all hover:border-white/20"
              >
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover opacity-75 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-90" />
                </div>

                <div className="p-6">
                  <div className="text-secondary text-[10px] font-black tracking-[0.2em] uppercase">
                    {video.category}
                  </div>
                  <div className="mt-2 line-clamp-1 text-xl font-black text-white">
                    {video.title}
                  </div>
                  <div className="mt-3 line-clamp-2 text-sm font-medium text-white/60">
                    {video.description}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs font-bold tracking-widest text-white/60 uppercase">
                    <span>{video.duration}</span>
                    <span>{video.size}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}


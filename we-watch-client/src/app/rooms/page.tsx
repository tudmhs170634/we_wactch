'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import Header from '@/src/components/Header';
import Background from '@/src/components/layout/Background';
import { MOCK_ROOMS } from '@/src/constants/mockData';

type RoomTypeFilter = 'all' | 'community' | 'private';
type RoomStatusFilter = 'all' | string;

export default function RoomsPage() {
  const [type, setType] = useState<RoomTypeFilter>('all');
  const [status, setStatus] = useState<RoomStatusFilter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawType = params.get('type');
    if (rawType === 'community' || rawType === 'private' || rawType === 'all') {
      setType(rawType);
    }
  }, []);

  const statusOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const r of MOCK_ROOMS) unique.add(r.status);
    return Array.from(unique);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_ROOMS.filter((r) => {
      const matchesType =
        type === 'all' ? true : type === 'private' ? r.isPrivate : !r.isPrivate;
      const matchesStatus = status === 'all' ? true : r.status === status;
      const matchesTitle = q ? r.title.toLowerCase().includes(q) : true;
      return matchesType && matchesStatus && matchesTitle;
    });
  }, [type, status, query]);

  return (
    <main className="relative min-h-screen font-sans text-slate-100">
      <Background />

      <Header />

      <div className="relative z-10 mx-auto mt-14 w-full max-w-7xl px-6 pt-28 pb-20">
        <div className="mb-10 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary h-2 w-2 rounded-full" />
              <h1 className="text-4xl font-black tracking-tighter text-white">
                Tất cả <span className="text-secondary">Phòng</span>
              </h1>
            </div>
            <p className="max-w-2xl font-medium text-white/70">
              Tìm kiếm phòng chiếu phù hợp với bạn.
            </p>
          </div>

          <div className="glass flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4 lg:w-[240px]">
              <span className="w-full text-center text-xs font-black tracking-widest text-white/60 uppercase">
                Loại phòng
              </span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RoomTypeFilter)}
                className="glass focus:border-primary/50 w-full rounded-[18px] border border-white/10 bg-transparent px-4 py-3 text-sm font-bold text-white outline-none"
              >
                <option value="all" className="bg-[#0A0A0B]">
                  Tất cả
                </option>
                <option value="community" className="bg-[#0A0A0B]">
                  Cộng đồng
                </option>
                <option value="private" className="bg-[#0A0A0B]">
                  Riêng tư
                </option>
              </select>
            </div>

            <div className="group/input relative lg:flex-1">
              <Search className="group-focus-within/input:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter theo title…"
                className="glass focus:border-primary/50 w-full rounded-[18px] bg-transparent py-3 pr-4 pl-12 text-[15px] font-medium text-white placeholder-white/35 outline-none"
              />
            </div>

            <div className="flex items-center justify-between lg:justify-end lg:gap-3">
              <span className="text-xs font-black tracking-widest text-white/60 uppercase">
                {filtered.length} / {MOCK_ROOMS.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setType('all');
                  setStatus('all');
                  setQuery('');
                }}
                className="hover:text-primary rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black tracking-widest text-white/70 uppercase transition-colors"
              >
                Đặt lại
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-lg font-bold text-white">
              Không có phòng phù hợp.
            </p>
            <p className="mt-2 text-sm font-medium text-white/60">
              Thử đổi type hoặc rút gọn từ khóa.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((room) => (
              <div
                key={room.id}
                className="glass group hover:border-primary/30 relative rounded-[24px] border border-white/10 bg-white/5 p-6 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-14 w-14 flex-shrink-0">
                    <Image
                      src={room.image}
                      alt={room.title}
                      fill
                      className="group-hover:ring-primary/50 rounded-2xl object-cover ring-2 ring-white/10 transition-all"
                    />
                    <div className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-[#0A0A0B] bg-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="group-hover:text-primary line-clamp-2 font-bold text-white transition-colors">
                      {room.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black tracking-widest text-white/70 uppercase">
                        {room.isPrivate ? 'Private' : 'Community'}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black tracking-widest text-white/70 uppercase">
                        {room.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-6">
                  <div className="text-[13px] font-bold tracking-widest text-white/90 uppercase">
                    {room.listeners} người xem • {room.episodes} tập
                  </div>
                  <div className="flex gap-1">
                    {room.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="group-hover:border-primary/20 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-widest text-white/90 uppercase transition-all"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

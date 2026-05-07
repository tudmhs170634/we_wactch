'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, Plus, Users, Lock, Globe } from 'lucide-react';
import Header from '@/src/components/Header';
import Background from '@/src/components/layout/Background';
import CreateRoomModal from '@/src/components/rooms/CreateRoomModal';
import JoinRoomModal from '@/src/components/rooms/JoinRoomModal';
import { useAuthStore } from '@/src/store/useAuthStore';
import { getRooms } from '@/src/services/room';
import { useRouter } from 'next/navigation';

type RoomTypeFilter = 'all' | 'public' | 'private';

type Room = {
  id: string;
  title: string;
  slug: string;
  type: 'public' | 'private';
  maxUsers: number;
  isActive: boolean;
  createdAt: string;
  host?: { id: string; username: string; avatarUrl?: string | null };
  video?: { id: string; title: string; thumbnailUrl?: string | null } | null;
};

const FALLBACK_BANNERS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=60',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=60',
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=60',
];

export default function RoomsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [typeFilter, setTypeFilter] = useState<RoomTypeFilter>('all');
  const [query, setQuery] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [joinModalRoom, setJoinModalRoom] = useState<Room | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRooms(1, 50);
      setRooms(res.rooms ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms.filter((r) => {
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      const matchTitle = q ? r.title.toLowerCase().includes(q) : true;
      return matchType && matchTitle;
    });
  }, [rooms, typeFilter, query]);

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
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as RoomTypeFilter)}
                className="glass focus:border-primary/50 w-full rounded-[18px] border border-white/10 bg-transparent px-4 py-3 text-sm font-bold text-white outline-none"
              >
                <option value="all" className="bg-[#0A0A0B]">Tất cả</option>
                <option value="public" className="bg-[#0A0A0B]">Cộng đồng</option>
                <option value="private" className="bg-[#0A0A0B]">Riêng tư</option>
              </select>
            </div>

            <div className="group/input relative lg:flex-1">
              <Search className="group-focus-within/input:text-primary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter theo tên phòng…"
                className="glass focus:border-primary/50 w-full rounded-[18px] bg-transparent py-3 pr-4 pl-12 text-[15px] font-medium text-white placeholder-white/35 outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <span className="text-xs font-black tracking-widest text-white/60 uppercase">
                {filtered.length} / {total}
              </span>
              <button
                type="button"
                onClick={() => { setTypeFilter('all'); setQuery(''); }}
                className="hover:text-primary rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black tracking-widest text-white/70 uppercase transition-colors"
              >
                Đặt lại
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-xs font-black tracking-widest text-white uppercase transition-opacity hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tạo phòng
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-[24px] border border-white/10 bg-white/5 p-6">
                <div className="flex gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-10 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-white/20" />
            <p className="text-lg font-bold text-white">
              {query || typeFilter !== 'all' ? 'Không có phòng phù hợp.' : 'Chưa có phòng nào.'}
            </p>
            <p className="mt-2 text-sm font-medium text-white/60">
              {user ? 'Hãy tạo phòng đầu tiên!' : 'Đăng nhập để tạo phòng.'}
            </p>
          </div>
        )}

        {/* Room grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((room, idx) => (
              <div
                key={room.id}
                onClick={() => {
                  if (room.type === 'private') {
                    setJoinModalRoom(room);
                  } else {
                    router.push(`/private/${room.id}`);
                  }
                }}
                className="glass group hover:border-primary/30 relative rounded-[24px] border border-white/10 bg-white/5 p-6 transition-all cursor-pointer overflow-hidden"
              >
                {/* Join Overlay Button on Hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-10">
                   <button className="bg-pink-600 text-white font-black px-6 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all">
                     Tham gia ngay
                   </button>
                </div>

                <div className="flex items-start gap-4">
                  <div className="relative h-14 w-14 flex-shrink-0">
                    <Image
                      src={room.video?.thumbnailUrl ?? FALLBACK_BANNERS[idx % 3]}
                      alt={room.title}
                      fill
                      className="group-hover:ring-primary/50 rounded-2xl object-cover ring-2 ring-white/10 transition-all"
                    />
                    <div className={`absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-[#0A0A0B] ${room.isActive ? 'bg-green-500' : 'bg-white/20'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="group-hover:text-primary line-clamp-2 font-bold text-white transition-colors">
                      {room.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black tracking-widest text-white/70 uppercase">
                        {room.type === 'private' ? <><Lock className="h-2.5 w-2.5" /> Private</> : <><Globe className="h-2.5 w-2.5" /> Public</>}
                      </span>
                      {room.video && (
                        <span className="line-clamp-1 max-w-[120px] rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black text-white/70">
                          {room.video.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-white/60">
                    <Users className="h-3 w-3" />
                    Tối đa {room.maxUsers} người
                  </div>
                  <div className="text-[10px] font-bold text-white/40">
                    {room.host?.username ?? 'Unknown'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateRoomModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          fetchRooms();
        }}
      />

      <JoinRoomModal
        room={joinModalRoom}
        onClose={() => setJoinModalRoom(null)}
      />
    </main>
  );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Room {
  id: number;
  title: string;
  status: string;
  listeners: number;
  episodes: number;
  tags: string[];
  isPrivate: boolean;
  image: string;
}

interface RoomListProps {
  rooms: Room[];
  isAuthenticated?: boolean;
}

const RoomList = ({ rooms, isAuthenticated = true }: RoomListProps) => {
  const [activeTab, setActiveTab] = useState<'community' | 'private'>(
    'community'
  );

  const filteredRooms = rooms.filter((r) =>
    activeTab === 'community' ? !r.isPrivate : r.isPrivate
  );

  const visibleRooms = filteredRooms.slice(0, 5);

  return (
    <motion.section
      id="rooms"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mx-auto w-full max-w-7xl px-6 py-10"
    >
      <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-primary h-2 w-2 rounded-full" />
            <h2 className="text-4xl font-black tracking-tighter text-white">
              Phòng Đang <span className="text-secondary">Chiếu</span>
            </h2>
          </div>
          <p className="ml-5 font-medium text-white/90">
            Mỗi phòng là một vibe — bước vào và cảm nhận
          </p>
        </div>

        <div className="h-px flex-1 bg-white/20" />

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setActiveTab('community')}
            className={`rounded-xl px-6 py-2 text-sm font-bold transition-all ${activeTab === 'community' ? 'bg-primary text-white shadow-lg' : 'text-white/90 hover:text-slate-300'}`}
          >
            Cộng đồng
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`rounded-xl px-6 py-2 text-sm font-bold transition-all ${activeTab === 'private' ? 'bg-primary text-white shadow-lg' : 'text-white/90 hover:text-slate-300'}`}
          >
            Riêng tư
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleRooms.map((room) => (
          <motion.div
            key={room.id}
            whileHover={{ y: -5 }}
            className="glass group hover:border-primary/30 relative rounded-[24px] border border-white/5 p-6 transition-all"
          >
            <Link
              href={
                isAuthenticated
                  ? `/rooms?type=${room.isPrivate ? 'private' : 'community'}`
                  : '/login'
              }
              className="absolute inset-0 z-10"
              aria-label={`Vào phòng: ${room.title}`}
            />
            <div className="flex items-start gap-4 pt-5">
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
                <h3 className="group-hover:text-primary line-clamp-1 font-bold text-white transition-colors">
                  {room.title}
                </h3>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-slate-800"
                  >
                    <Image
                      src={`https://i.pravatar.cc/100?u=${i + room.id}`}
                      alt="user"
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  </div>
                ))}
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-white/10 text-[8px] font-black">
                  +{room.listeners}
                </div>
              </div>
              <div className="text-[13px] font-bold tracking-widest text-white/90 uppercase">
                {room.listeners} người xem • {room.episodes} tập
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-6">
              <span className="text-lg font-bold text-white/50 transition-all group-hover:text-white">
                Xem cùng
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="group-hover:bg-primary flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all group-hover:text-white"
              >
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </div>

            <div className="absolute top-4 right-4 flex gap-1">
              {room.tags.map((tag) => (
                <span
                  key={tag}
                  className="group-hover:border-primary/20 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black tracking-widest text-white/90 uppercase transition-all"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}

        <motion.div whileHover={{ y: -5 }}>
          <Link
            href={isAuthenticated ? `/rooms?type=${activeTab}` : '/login'}
            className="glass group hover:border-primary/30 relative flex min-h-full cursor-pointer flex-col items-center justify-center gap-4 rounded-[24px] border border-white/5 p-6 transition-all"
          >
            <div className="group-hover:bg-primary/20 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 transition">
              <ArrowRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" />
            </div>
            <span className="group-hover:text-primary text-base font-bold text-white transition">
              Xem tất cả
            </span>
            <span className="text-xs text-white/50">
              {filteredRooms.length} phòng
            </span>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default RoomList;

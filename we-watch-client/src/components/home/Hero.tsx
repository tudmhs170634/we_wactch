'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Search, Users, Shield, Plus } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import CreateRoomModal from '../rooms/CreateRoomModal';

const Hero = () => {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchText.trim();
    if (!q) {
      router.push('/videos');
      return;
    }
    router.push(`/videos?search=${encodeURIComponent(q)}`);
  };

  const handleCreateRoomClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsCreateRoomModalOpen(true);
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pt-48 pb-20 text-center"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -z-10 h-[500px] w-full -translate-x-1/2 rounded-full bg-[#C800DF]/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <h1 className="text-6xl leading-none font-black tracking-tighter text-white md:text-8xl">
          We Watch <br />
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mt-8 max-w-2xl text-lg font-medium text-white/90 md:text-xl"
      >
        Nền tảng giúp bạn xem nội dung số đồng bộ và tương tác real-time với bạn
        bè qua Audio, Video và Chat. Kết nối không giới hạn, dù bạn ở bất cứ
        đâu.
      </motion.p>

      {/* SEARCH BAR */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="group relative mt-12 w-full max-w-2xl"
        onSubmit={handleSearch}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
          <Search className="h-5 w-5 text-white/90 transition-colors group-focus-within:text-[#C800DF]" />
        </div>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Tìm kiếm phòng, video, bạn bè..."
          className="glass placeholder-white-500 hidden w-full rounded-full py-4 pr-32 pl-14 text-lg text-white shadow-xl transition-all outline-none focus:border-[#C800DF]/50 focus:bg-white/10 md:block"
        />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Tìm kiếm phòng..."
          className="glass placeholder-white-500 w-full rounded-full py-4 pr-32 pl-14 text-lg text-white shadow-xl transition-all outline-none focus:border-[#C800DF]/50 focus:bg-white/10 md:hidden"
        />
        <button
          type="submit"
          className="absolute inset-y-2 right-2 cursor-pointer rounded-full bg-[#C800DF] px-6 text-xs font-bold text-white shadow-lg shadow-[#C800DF]/20 transition-transform hover:scale-105"
        >
          TÌM KIẾM
        </button>
      </motion.form>

      {/* 2 MAIN CALL TO ACTION OPTIONS */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mt-20 grid w-full max-w-6xl grid-cols-1 gap-8 px-4 md:grid-cols-2"
      >
        {/* Option 1: We Watch (Private) */}
        <div
          onClick={handleCreateRoomClick}
          className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-10 shadow-2xl backdrop-blur-2xl transition-all hover:border-[#C800DF]/50 hover:bg-black/60"
        >
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#C800DF]/10 blur-[100px] transition-opacity group-hover:opacity-100" />

          <div className="relative z-10 flex flex-col items-start text-left">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C800DF]/20 text-[#C800DF]">
              <Shield size={28} />
            </div>
            <h3 className="text-3xl font-[950] tracking-tighter text-white uppercase">
              Phòng Riêng Tư
            </h3>
            <p className="mt-4 text-base leading-relaxed font-medium text-white/60">
              Không gian bảo mật tuyệt đối cho nhóm bạn thân. Mọi người đều có
              quyền điều khiển video.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {['Bảo mật', 'Full-Sync', 'Video Call'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold tracking-widest text-white/40 uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="group/btn mt-12 flex items-center gap-4 text-[13px] font-black tracking-widest text-white uppercase">
              Bắt đầu ngay
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all group-hover/btn:translate-x-2 group-hover/btn:bg-[#C800DF]">
                <Plus size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Option 2: Community (Live) */}
        <div
          onClick={handleCreateRoomClick}
          className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-10 shadow-2xl backdrop-blur-2xl transition-all hover:border-white/30 hover:bg-black/60"
        >
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/5 blur-[100px] transition-opacity group-hover:opacity-100" />

          <div className="relative z-10 flex flex-col items-start text-left">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Users size={28} />
            </div>
            <h3 className="text-3xl font-[950] tracking-tighter text-white uppercase">
              Phòng Cộng Đồng
            </h3>
            <p className="mt-4 text-base leading-relaxed font-medium text-white/60">
              Phát sóng trực tiếp nội dung cho hàng chục người xem. Tương tác
              qua Emoji và Chat audio.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {['Public', 'Host-Only', 'Emoji Rain'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold tracking-widest text-white/40 uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="group/btn mt-12 flex items-center gap-4 text-[13px] font-black tracking-widest text-white uppercase">
              Khám phá phòng live
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all group-hover/btn:translate-x-2 group-hover/btn:bg-white group-hover/btn:text-black">
                <ArrowRight size={18} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CREATE ROOM MODAL */}
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
      />
    </motion.section>
  );
};

export default Hero;

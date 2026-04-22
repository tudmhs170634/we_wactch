'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Search } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const Hero = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pt-48 pb-20 text-center"
    >
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-6xl leading-none font-black tracking-tighter text-white md:text-8xl"
      >
        We Watch <br />
      </motion.h1>

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="group relative mt-12 w-full max-w-2xl"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
          <Search className="h-5 w-5 text-white/90 transition-colors group-focus-within:text-[#C800DF]" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm phòng, phim, bạn bè..."
          className="glass placeholder-white-500 hidden w-full rounded-full py-4 pr-32 pl-14 text-lg text-white shadow-xl transition-all outline-none focus:border-[#C800DF]/50 focus:bg-white/10 md:block"
        />
        <input
          type="text"
          placeholder="Tìm kiếm phòng..."
          className="glass placeholder-white-500 w-full rounded-full py-4 pr-32 pl-14 text-lg text-white shadow-xl transition-all outline-none focus:border-[#C800DF]/50 focus:bg-white/10 md:hidden"
        />
        <button className="bg-primary shadow-primary/20 absolute inset-y-2 right-2 cursor-pointer rounded-full px-6 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105">
          <Search className="text-white-400 h-5 w-5 transition-colors" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mt-20 grid w-full max-w-7xl grid-cols-1 gap-8 px-4 md:grid-cols-2"
      >
        <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/60 p-10 shadow-2xl backdrop-blur-xl transition-all hover:border-[#C800DF]/50">
          <div className="pointer-events-none absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105">
            <Image
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKQ8GIEPZq9eTqgPvdjNzNXqgJ8OsHIJrA8w&s"
              alt="We Watch Mode background"
              fill
              className="object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/60 to-transparent" />
          </div>
          <div className="absolute -top-24 -right-24 z-10 h-64 w-64 rounded-full bg-[#C800DF]/15 blur-[100px] transition-opacity group-hover:opacity-100" />
          <div className="relative z-20 flex h-full flex-col justify-between">
            <div>
              <h3 className="text-3xl font-[950] tracking-tighter text-white uppercase">
                Phòng riêng tư
              </h3>
              <p className="mt-4 text-[17px] font-medium text-slate-200">
                Không gian xem phim riêng tư, bảo mật dành cho nhóm thân thiết.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Tối đa 5 thành viên đồng thời',
                  'Full-sync: Mọi người đều có quyền điều khiển',
                  'Hỗ trợ Video Call & Audio thời gian thực',
                  'Độ trễ thấp với công nghệ WebRTC',
                ].map((text) => (
                  <li
                    key={text}
                    className="flex items-center gap-3 text-[15px] font-semibold tracking-wide text-white"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white">
                      <Check className="h-3 w-3" strokeWidth={4} />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={isAuthenticated ? '/rooms/create/private' : '/login'}
              className="group/btn mt-10 flex items-center gap-3 text-left text-[14px] font-[950] tracking-[0.2em] text-white uppercase"
            >
              <span className="relative">
                Tạo phòng riêng ngay
                <span className="absolute -bottom-1 left-0 h-[2px] w-full scale-x-0 bg-[#C800DF] transition-transform group-hover/btn:scale-x-100" />
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
            </Link>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/60 p-10 shadow-2xl backdrop-blur-xl transition-all hover:border-white/30">
          <div className="pointer-events-none absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105">
            <Image
              src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80"
              alt="Community Mode background"
              fill
              className="object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/60 to-transparent" />
          </div>
          <div className="absolute -top-24 -right-24 z-10 h-64 w-64 rounded-full bg-white/5 blur-[100px] transition-opacity group-hover:opacity-100" />
          <div className="relative z-20 flex h-full flex-col justify-between">
            <div>
              <h3 className="text-3xl font-[950] tracking-tighter text-white uppercase">
                Phòng Cộng đồng
              </h3>
              <p className="mt-4 text-[17px] font-medium text-slate-200">
                Trải nghiệm phát sóng trực tiếp và tương tác với nhiều người
                xem.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Sức chứa lên tới 20 người xem',
                  'Host-driven Sync: Điều khiển bởi chủ phòng',
                  'Tính năng Sub-group: Chat audio nhóm riêng',
                  'Hệ thống Emoji Rain & Chat thời gian thực',
                ].map((text) => (
                  <li
                    key={text}
                    className="flex items-center gap-3 text-[15px] font-semibold tracking-wide text-white"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C800DF]/20 bg-white/20 text-white">
                      <Check className="h-3 w-3" strokeWidth={4} />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/community"
              className="group/btn mt-10 flex items-center gap-3 text-left text-[14px] font-[950] tracking-[0.2em] text-white uppercase transition-colors"
            >
              <span className="relative">
                Khám phá cộng đồng
                <span className="absolute -bottom-1 left-0 h-[2px] w-full scale-x-0 bg-white transition-transform group-hover/btn:scale-x-100 group-hover/btn:bg-[#C800DF]" />
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default Hero;

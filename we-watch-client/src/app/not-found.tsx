'use client';

import { Search, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6 text-slate-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0B] p-12 shadow-2xl shadow-fuchsia-500/5">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[80px]" />

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-fuchsia-500/10 text-[#C800DF]">
            <Search size={48} />
          </div>

          <h1 className="font-display mb-4 text-4xl font-black tracking-tight text-white md:text-5xl">
            404
          </h1>

          <h2 className="font-display mb-4 text-2xl font-bold text-white">
            Không tìm thấy trang
          </h2>

          <p className="mb-10 max-w-xs font-sans text-lg text-slate-400">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị chuyển sang một
            chiều không gian khác.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#C800DF] px-8 py-4 font-sans font-semibold text-white transition-all hover:bg-[#A600B8] active:scale-95"
            >
              <Home size={20} />
              Quay về trang chủ
            </Link>

            <button
              onClick={() =>
                typeof window !== 'undefined' && window.history.back()
              }
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-sans font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
            >
              <ArrowLeft size={20} />
              Quay lại trang trước
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

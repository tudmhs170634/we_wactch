'use client';

import { div } from 'framer-motion/client';
import Link from 'next/link';
import Background from '../components/layout/Background';

export default function NotFound() {
  return (
    <div>
      <Background />
      <div className="flex min-h-[70vh] items-center justify-center px-6 text-slate-200">
        <div className="glass w-full max-w-md rounded-[24px] border border-white/10 p-8 text-center">
          <h1 className="text-4xl font-black tracking-tighter text-white">
            404
          </h1>
          <p className="mt-3 text-sm font-medium text-white/65">
            Trang bạn tìm không tồn tại.
          </p>
          <Link
            href="/"
            className="bg-primary mt-6 inline-flex rounded-full px-6 py-3 text-sm font-black tracking-widest text-white uppercase transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

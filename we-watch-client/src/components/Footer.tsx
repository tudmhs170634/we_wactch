'use client';

import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';

const Footer = () => {
  const pathname = usePathname();

  if (
    pathname?.includes('/private/') ||
    pathname?.includes('/community/') ||
    pathname?.includes('/admin')
  ) {
    return null;
  }

  return (
    <footer className="relative z-20 border-t border-white/5 bg-[#050506] px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
            WE WATCH
          </span>
        </div>

        {/* Tagline */}
        <p className="mb-10 max-w-xl text-center leading-relaxed font-medium text-slate-300">
          "Có những bộ phim, xem một mình thì bình thường —{' '}
          <br className="hidden md:block" />
          xem cùng nhau lại thành kỷ niệm."
        </p>

        {/* Nav Links */}
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm font-bold text-slate-300">
          <Link href="#" className="hover:text-primary transition-colors">
            Về chúng tôi
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Blog
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Chính sách bảo mật
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Điều khoản
          </Link>
        </div>

        <div className="mt-20 flex w-full flex-col items-center justify-between gap-6 border-t border-white/5 pt-5 md:flex-row">
          <p className="text-[10px] font-black tracking-widest text-slate-300 uppercase italic">
            WE_WATCH_V2 &bull; BUILT BY TRUNG TÚ HIẾU
          </p>
          <div className="flex gap-6 text-slate-300">
            <span className="text-[10px] font-bold">NEXT.JS 15</span>
            <span className="text-[10px] font-bold">TAILWIND 4</span>
            <span className="text-[10px] font-bold">
              2026 &copy; ALL RIGHTS RESERVED
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

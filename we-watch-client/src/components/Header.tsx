'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuthStore } from '../store/useAuthStore';
import { logout } from '../services/auth';
import Image from 'next/image';
import { LogOut, PlusSquare } from 'lucide-react';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="fixed top-6 left-0 z-50 flex h-fit w-full justify-center px-6">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="glass flex h-16 w-full max-w-5xl items-center justify-between rounded-full border border-white/10 bg-white/5 px-8 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-sans text-xl font-black tracking-tighter text-white">
              WE{' '}
              <span className="bg-gradient-to-r from-[#C800DF] to-[#E60076] bg-clip-text text-transparent">
                WATCH
              </span>
            </span>
          </Link>
        </div>

        <div className="hidden items-center gap-10 text-sm font-bold tracking-wider text-white/90 uppercase md:flex">
          <Link
            href="/"
            className="hover:text-primary text-white transition-colors"
          >
            Trang chủ
          </Link>
          <Link href="/films" className="hover:text-primary transition-colors">
            Phim
          </Link>
          <Link
            href="/rooms"
            className="hover:text-primary transition-colors"
          >
            Phòng
          </Link>
          <Link
            href="/community"
            className="hover:text-primary transition-colors"
          >
            Cộng đồng
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-full border border-white/5 bg-white/5 p-1 pr-4 transition-all hover:bg-white/10">
                <div className="relative h-8 w-8 overflow-hidden rounded-full border border-[#C800DF]/50">
                  <Image 
                    src={user?.avatarUrl || 'https://i.pravatar.cc/100'} 
                    alt="User avatar" 
                    fill 
                    className="object-cover"
                  />
                </div>
                <span className="max-w-[100px] truncate text-xs font-bold text-white/80">
                  {user?.username}
                </span>
              </div>
              
              <button
                onClick={() => logout()}
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
                title="Đăng xuất"
              >
                <LogOut size={16} className="transition-transform group-hover:scale-110" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-6 py-2 text-sm font-bold text-white/80 transition-all hover:text-white"
              >
                Đăng nhập
              </Link>
              <Link
                href="/login"
                className="bg-primary shadow-primary/20 flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
              >
                <PlusSquare size={16} />
                Tạo phòng
              </Link>
            </>
          )}
        </div>
      </motion.nav>
    </div>
  );
};

export default Header;

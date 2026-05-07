'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { logout } from '../services/auth';
import Image from 'next/image';
import {
  LogOut,
  PlusSquare,
  User as UserIcon,
  ChevronDown,
  Bell,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import CreateRoomModal from './rooms/CreateRoomModal';

const Header = () => {
  const router = useRouter();
  const {
    user: realUser,
    logout: logoutStore,
    isAuthenticated,
  } = useAuthStore();

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] =
    React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const mockUser = {
    username: 'trungne',
    email: 'nguyenthetrunq@gmail.com',
    avatarUrl:
      'https://i.pinimg.com/736x/2b/f0/b0/2bf0b0feecc5c890ea47f90c7c7c775d.jpg',
    role: 'admin',
  };

  const user = realUser || mockUser;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    console.log('realUser', realUser);

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <Link href="/videos" className="hover:text-primary transition-colors">
            Video
          </Link>
          <Link href="/rooms" className="hover:text-primary transition-colors">
            Phòng
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 md:gap-5">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-all hover:bg-white/5 hover:text-white">
                <Bell size={20} />
                <span className="bg-primary absolute top-2 right-2 h-2 w-2 rounded-full border-2 border-[#0A0A0B]" />
              </button>

              <button
                onClick={() => setIsCreateRoomModalOpen(true)}
                className="bg-primary shadow-primary/20 flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
              >
                <PlusSquare size={16} />
                Tạo phòng
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`group flex items-center gap-3 rounded-full border p-1 pr-3 transition-all duration-300 ${
                    isMenuOpen
                      ? 'border-[#C800DF] bg-[#C800DF]/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/10">
                    <Image
                      src={
                        user?.avatarUrl ||
                        'https://res.cloudinary.com/dzjmyqqdh/image/upload/v1778045397/wewatch/avatars/avatar_1.webp'
                      }
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="hidden max-w-[100px] truncate text-sm font-bold text-white/90 md:block">
                    {user?.username}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-white/40 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 10, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 w-55 overflow-hidden rounded-[24px] border border-white/10 bg-[#0A0A0B]/70 shadow-xl backdrop-blur-xl"
                    >
                      {/* User Info Header */}
                      <div className="border-b border-white/5 p-5">
                        <p className="text-base font-bold text-white">
                          {user?.username}
                        </p>
                        <p className="max-w-[160px] truncate text-xs font-medium text-white/40">
                          @{user?.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          href="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/70 transition-all hover:bg-white/5 hover:text-white"
                        >
                          <UserIcon size={18} className="text-[#C800DF]" />
                          Hồ sơ của tôi
                        </Link>

                        {user?.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="mt-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/70 transition-all hover:bg-white/5 hover:text-white"
                          >
                            <Settings size={18} className="text-[#C800DF]" />
                            Bảng điều khiển
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            logout();
                          }}
                          className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500/10 hover:text-red-500"
                        >
                          <LogOut size={18} />
                          Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-all hover:bg-white/5 hover:text-white md:hidden"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-full px-6 py-2 text-sm font-bold text-white/80 transition-all hover:text-white md:block"
              >
                Đăng nhập
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-all hover:bg-white/5 hover:text-white md:hidden"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link
                href="/login"
                className="bg-primary shadow-primary/20 flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
              >
                <PlusSquare size={16} />
                Tạo phòng
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] h-screen w-screen bg-[#0A0A0B] p-8 md:hidden"
            >
              <div className="flex justify-end">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mt-12 flex flex-col gap-8 text-center">
                {['Trang chủ', 'Videos', 'Phòng'].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item === 'Trang chủ' ? '/' : `/${item.toLowerCase()}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-3xl font-black tracking-tighter text-white/40 transition-all hover:text-white"
                  >
                    {item}
                  </Link>
                ))}

                {!isAuthenticated && (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-primary text-3xl font-black tracking-tighter"
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>

              <div className="absolute right-0 bottom-12 left-0 text-center">
                <span className="font-sans text-xl font-black tracking-tighter text-white/20">
                  WE WATCH
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
      />
    </div>
  );
};

export default Header;

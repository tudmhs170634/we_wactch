'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Header from '@/src/components/Header';
import Background from '@/src/components/layout/Background';
import Image from 'next/image';
import {
  User,
  Mail,
  Calendar,
  Settings,
  Shield,
  Award,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { UserResponse } from '@/src/types/auth';

const ProfilePage = () => {
  // Mock data matching the Header's mock data
  const mockUser: UserResponse = {
    username: 'trungne',
    email: 'nguyenthetrunq@gmail.com',
    avatarUrl:
      'https://i.pinimg.com/736x/2b/f0/b0/2bf0b0feecc5c890ea47f90c7c7c775d.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    isHost: false,
    role: 'USER',
  };

  const {
    user: realUser,
    logout: logoutStore,
    isAuthenticated,
  } = useAuthStore();

  const user: UserResponse = realUser || mockUser;

  return (
    <main className="relative min-h-screen font-sans text-slate-200">
      <Background />
      <Header />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {/* Main Profile Card */}
          <div className="glass col-span-1 flex flex-col items-center rounded-[32px] p-8 md:col-span-1">
            <div className="group relative h-32 w-32 overflow-hidden rounded-full border-4 border-[#C800DF]/30 p-1">
              <div className="relative h-full w-full overflow-hidden rounded-full">
                <Image
                  src={user.avatarUrl || ''}
                  alt="Avatar"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            </div>

            <h1 className="mt-6 text-2xl font-black tracking-tight text-white">
              {user.username}
            </h1>
            <p className="text-sm font-medium text-white/40">
              @{user.username.toLowerCase()}
            </p>

            <div className="mt-8 flex w-full flex-col gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                <Mail size={18} className="text-[#C800DF]" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                <Calendar size={18} className="text-[#C800DF]" />
                <span className="text-sm font-medium">
                  Tham gia: {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button className="bg-primary mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all hover:opacity-90">
              <Settings size={18} />
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default ProfilePage;

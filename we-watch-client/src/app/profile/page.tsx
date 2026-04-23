'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Header from '@/src/components/Header';
import Background from '@/src/components/layout/Background';
import Image from 'next/image';
import { User, Mail, Calendar, Settings, Shield, Award, Clock } from 'lucide-react';

const ProfilePage = () => {
  // Mock data matching the Header's mock data
  const user = {
    username: 'trungne',
    email: 'nguyenthetrunq@gmail.com',
    avatarUrl: 'https://i.pinimg.com/736x/2b/f0/b0/2bf0b0feecc5c890ea47f90c7c7c775d.jpg',
    joinDate: 'Tháng 4, 2024',
    level: 'Cấp 12',
    exp: 85,
    stats: [
      { label: 'Phòng đã tạo', value: '12', icon: Shield },
      { label: 'Giờ xem', value: '128h', icon: Clock },
      { label: 'Thành tựu', value: '8', icon: Award },
    ]
  };

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
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              </div>
            </div>
            
            <h1 className="mt-6 text-2xl font-black tracking-tight text-white">{user.username}</h1>
            <p className="text-sm font-medium text-white/40">@{user.username.toLowerCase()}</p>
            
            <div className="mt-8 flex w-full flex-col gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                <Mail size={18} className="text-[#C800DF]" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                <Calendar size={18} className="text-[#C800DF]" />
                <span className="text-sm font-medium">Tham gia: {user.joinDate}</span>
              </div>
            </div>

            <button className="bg-primary mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all hover:opacity-90">
              <Settings size={18} />
              Chỉnh sửa hồ sơ
            </button>
          </div>

          {/* Stats & Activity Section */}
          <div className="col-span-1 space-y-6 md:col-span-2">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {user.stats.map((stat, i) => (
                <div key={i} className="glass rounded-[28px] p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C800DF]/10 text-[#C800DF]">
                    <stat.icon size={24} />
                  </div>
                  <p className="mt-4 text-sm font-bold text-white/40">{stat.label}</p>
                  <p className="mt-1 text-2xl font-black text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Experience Card */}
            <div className="glass rounded-[32px] p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Cấp độ người dùng</h2>
                <span className="text-primary font-black uppercase">{user.level}</span>
              </div>
              <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${user.exp}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-[#C800DF] to-[#E60076] h-full"
                />
              </div>
              <p className="mt-3 text-right text-xs font-bold text-white/40">{user.exp}/100 EXP</p>
            </div>

            {/* Placeholder for Recent Activity */}
            <div className="glass rounded-[32px] p-8">
              <h2 className="mb-6 text-xl font-bold text-white">Hoạt động gần đây</h2>
              <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                <Clock size={48} className="mb-4" />
                <p className="text-sm font-medium">Bạn chưa có hoạt động nào gần đây.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default ProfilePage;

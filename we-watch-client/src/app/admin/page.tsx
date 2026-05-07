'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Tv,
  Activity,
  AlertCircle,
  TrendingUp,
  UserPlus,
  PlayCircle,
  Settings,
  Search,
  MoreVertical,
  ChevronRight,
} from 'lucide-react';
import Header from '@/src/components/Header';
import Background from '@/src/components/layout/Background';
import Image from 'next/image';

const AdminDashboard = () => {
  // Mock Stats
  const stats = [
    {
      label: 'Tổng người dùng',
      value: '2,845',
      change: '+12%',
      icon: Users,
      color: '#C800DF',
    },
    {
      label: 'Phòng mở',
      value: '142',
      change: '+5%',
      icon: PlayCircle,
      color: '#E60076',
    },
    {
      label: 'Lượt xem hôm nay',
      value: '18.5K',
      change: '+24%',
      icon: Tv,
      color: '#4F46E5',
    },
    {
      label: 'Báo cáo vi phạm',
      value: '12',
      change: '-2%',
      icon: AlertCircle,
      color: '#EF4444',
    },
  ];

  // Mock Recent Users
  const recentUsers = [
    {
      name: 'Nguyễn Văn A',
      email: 'vana@gmail.com',
      role: 'User',
      status: 'Online',
      avatar: 'https://i.pravatar.cc/150?u=1',
    },
    {
      name: 'Trần Thị B',
      email: 'thib@gmail.com',
      role: 'User',
      status: 'Offline',
      avatar: 'https://i.pravatar.cc/150?u=2',
    },
    {
      name: 'Lê Văn C',
      email: 'vanc@gmail.com',
      role: 'Moderator',
      status: 'Online',
      avatar: 'https://i.pravatar.cc/150?u=3',
    },
    {
      name: 'Phạm Thị D',
      email: 'thid@gmail.com',
      role: 'User',
      status: 'Busy',
      avatar: 'https://i.pravatar.cc/150?u=4',
    },
  ];

  return (
    <main className="relative min-h-screen font-sans text-slate-200">
      <Background />
      <Header />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-20">
        {/* Page Header */}
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black tracking-tight text-white"
            >
              Quản trị{' '}
              <span className="bg-gradient-to-r from-[#C800DF] to-[#E60076] bg-clip-text text-transparent">
                Hệ thống
              </span>
            </motion.h1>
            <p className="mt-2 text-white/50">
              Chào mừng trở lại, Admin. Đây là tổng quan về We Watch hôm nay.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass relative flex items-center rounded-2xl px-4 py-2">
              <Search size={18} className="text-white/30" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="bg-transparent px-3 py-1 text-sm outline-none placeholder:text-white/20"
              />
            </div>
            <button className="glass flex h-11 w-11 items-center justify-center rounded-2xl transition-colors hover:bg-white/10">
              <Settings size={20} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass group relative overflow-hidden rounded-[32px] p-6 transition-all hover:translate-y-[-4px]"
            >
              <div
                className="absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-10 blur-2xl"
                style={{ backgroundColor: stat.color }}
              />
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/80 transition-colors group-hover:bg-white/10">
                  <stat.icon size={24} style={{ color: stat.color }} />
                </div>
                <span
                  className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}
                >
                  {stat.change}
                </span>
              </div>
              <div className="mt-6">
                <p className="text-sm font-bold tracking-wider text-white/40 uppercase">
                  {stat.label}
                </p>
                <h3 className="mt-1 text-3xl font-black text-white">
                  {stat.value}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Recent Users Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass col-span-1 flex flex-col rounded-[32px] p-8 lg:col-span-2"
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Người dùng mới nhất
              </h2>
              <button className="text-primary text-sm font-bold hover:underline">
                Xem tất cả
              </button>
            </div>

            <div className="space-y-4">
              {recentUsers.map((user, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white/10">
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{user.name}</h4>
                      <p className="text-xs text-white/40">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="hidden sm:block">
                      <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-white/60 uppercase">
                        {user.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          user.status === 'Online'
                            ? 'bg-green-500'
                            : user.status === 'Busy'
                              ? 'bg-yellow-500'
                              : 'bg-white/20'
                        }`}
                      />
                      <span className="hidden text-xs font-medium text-white/50 md:block">
                        {user.status}
                      </span>
                    </div>
                    <button className="text-white/20 transition-colors hover:text-white">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Activity Timeline Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass flex flex-col rounded-[32px] p-8"
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Hoạt động</h2>
              <Activity size={20} className="text-primary" />
            </div>

            <div className="relative space-y-8 before:absolute before:top-2 before:left-[11px] before:h-[calc(100%-16px)] before:w-[2px] before:bg-white/5">
              {[
                {
                  time: '10 phút trước',
                  action: 'Video "Inception" được báo cáo',
                  type: 'warning',
                },
                {
                  time: '25 phút trước',
                  action: 'Phòng "Chilling Together" đã đóng',
                  type: 'info',
                },
                {
                  time: '1 giờ trước',
                  action: 'User @trungne vừa đăng ký',
                  type: 'success',
                },
                {
                  time: '2 giờ trước',
                  action: 'Bảo trì hệ thống hoàn tất',
                  type: 'system',
                },
              ].map((item, i) => (
                <div key={i} className="relative pl-10">
                  <div
                    className={`absolute top-1 left-0 h-6 w-6 rounded-full border-4 border-[#0A0A0B] bg-white/10 ${
                      item.type === 'warning'
                        ? 'bg-red-500'
                        : item.type === 'success'
                          ? 'bg-green-500'
                          : 'bg-primary'
                    }`}
                  />
                  <p className="text-xs font-bold text-white/30 uppercase">
                    {item.time}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/80">
                    {item.action}
                  </p>
                </div>
              ))}
            </div>

            <button className="group mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-4 text-sm font-bold text-white transition-all hover:bg-white/10">
              Xem nhật ký hệ thống
              <ChevronRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;

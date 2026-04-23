'use client';

import React from 'react';
import Header from '../components/Header';
import Hero from '../components/home/Hero';
import RoomList from '../components/home/RoomList';
import FilmLibrary from '../components/home/FilmLibrary';
import Background from '../components/layout/Background';
import Testimonials from '../components/home/Testimonials';
import { useAuthStore } from '../store/useAuthStore';
import {
  MOCK_ROOMS,
  MOCK_FILMS,
  MOCK_TESTIMONIALS,
} from '../constants/mockData';

export default function HomePage() {
  //const { isAuthenticated } = useAuthStore();
  const isAuthenticated = true;

  return (
    <main className="relative min-h-screen font-sans text-slate-100">
      <Background />

      <Header />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Hero />

        {!isAuthenticated && (
          <div className="mb-10">
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <h2 className="mb-6 text-3xl font-black tracking-tighter text-white">
                Sẵn sàng trải nghiệm cùng bạn bè?
              </h2>
              <p className="mb-10 max-w-lg text-slate-400">
                Hãy đăng nhập để có thể tự tạo phòng chiếu riêng, tham gia cộng
                đồng và lưu lại những khoảnh khắc đáng nhớ.
              </p>
              <a
                href="/login"
                className="bg-primary shadow-primary/30 rounded-full px-12 py-5 text-lg font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                Bắt đầu ngay bây giờ
              </a>
            </div>
          </div>
        )}

        <RoomList rooms={MOCK_ROOMS} isAuthenticated={isAuthenticated} />
        <FilmLibrary films={MOCK_FILMS} />

        {!isAuthenticated && (
          <div className="mb-20">
            <Testimonials testimonials={MOCK_TESTIMONIALS} />
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, PlayCircle, Heart, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Film {
  id: number;
  title: string;
  slug: string;
  category: string;
  h: string;
  img: string;
}

interface FilmLibraryProps {
  films: Film[];
}

const FilmLibrary = ({ films }: FilmLibraryProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mx-auto w-full max-w-7xl px-6 py-20 pt-10"
    >
      <div className="mb-12 flex items-center gap-4">
        <div className="bg-primary h-2 w-2 rounded-full" />
        <h2 className="text-4xl font-black tracking-tighter text-white">
          Thư viện <span className="text-secondary">Phim</span>
        </h2>
        <div className="h-px flex-1 bg-white/20" />
        <Link
          href="/videos"
          className="flex items-center gap-2 text-xs font-bold text-white/90 hover:text-white"
        >
          Xem tất cả <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
        {films.map((film) => (
          <motion.div
            key={film.id}
            whileHover={{ scale: 1.02 }}
            className={`relative ${film.h} glass group mb-6 w-full cursor-pointer break-inside-avoid overflow-hidden rounded-[30px] border border-white/10`}
          >
            <Link
              href={`/videos/${film.slug}`}
              className="absolute inset-0 z-10"
              aria-label={`Xem chi tiết: ${film.title}`}
            />

            <Image
              src={film.img}
              alt={film.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="rounded-[30px] object-cover opacity-60 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-40" />

            <div className="absolute bottom-0 left-0 w-full p-6">
              <span className="text-secondary mb-1 block text-[10px] font-black tracking-[0.2em] uppercase">
                {film.category}
              </span>
              <h3 className="text-xl font-black text-white transition-transform duration-300 group-hover:translate-x-2">
                {film.title}
              </h3>

              <div className="mt-4 flex translate-y-4 items-center gap-4 opacity-0 transition-opacity duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <button className="relative z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg">
                  <PlayCircle className="h-5 w-5" />
                </button>
                <button className="relative z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md">
                  <Heart className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white opacity-0 backdrop-blur-md transition-all group-hover:opacity-100">
              <ArrowRight className="h-5 w-5 rotate-[-45deg]" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default FilmLibrary;

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  content: string;
  avatar: string;
  rating: number;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
}

const Testimonials = ({ testimonials }: TestimonialsProps) => {
  return (
    <motion.section
      id="testimonials"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mx-auto mb-20 w-full max-w-7xl px-6 py-10"
    >
      <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-primary h-2 w-2 rounded-full" />
            <h2 className="text-4xl font-black tracking-tighter text-white">
              Cộng Đồng <span className="text-secondary">Đánh Giá</span>
            </h2>
          </div>
          <p className="ml-5 font-medium text-white/90">
            Trải nghiệm Social Entertainment đích thực
          </p>
        </div>

        <div className="h-px flex-1 bg-white/20" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((testimonial, idx) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            whileHover={{ y: -5 }}
            className="glass group hover:border-primary/30 relative flex flex-col justify-between rounded-[32px] border border-white/5 p-8 transition-all"
          >
            <Quote className="group-hover:text-primary/20 absolute top-6 right-6 h-8 w-8 text-white/5 transition-all" />

            <div className="mb-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < testimonial.rating ? 'text-primary fill-primary' : 'text-white/20'}`}
                  />
                ))}
              </div>
              <p className="line-clamp-4 text-sm leading-relaxed font-medium text-white/80">
                "{testimonial.content}"
              </p>
            </div>

            <div className="mt-auto flex items-center gap-4 border-t border-white/5 pt-4">
              <div className="relative h-12 w-12 flex-shrink-0">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  fill
                  className="group-hover:ring-primary/50 rounded-full object-cover ring-2 ring-white/10 transition-all"
                />
              </div>
              <div>
                <h4 className="group-hover:text-primary text-sm font-bold text-white transition-colors">
                  {testimonial.name}
                </h4>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default Testimonials;

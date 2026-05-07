'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { verifyRoomPassword } from '@/src/services/room';
import { useRouter } from 'next/navigation';

interface JoinRoomModalProps {
  room: { id: string; title: string; type: string } | null;
  onClose: () => void;
}

export default function JoinRoomModal({ room, onClose }: JoinRoomModalProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyRoomPassword(room.id, password);
      toast.success('Mật khẩu chính xác!');
      router.push(`/private/${room.id}`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sai mật khẩu phòng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0B]/90 shadow-2xl backdrop-blur-xl p-8"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col items-center text-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/20 text-pink-500">
              <Lock size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Yêu cầu mật khẩu</h3>
              <p className="text-sm text-white/60 mt-1">
                Phòng <span className="text-white font-bold">{room.title}</span> là phòng riêng tư.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu phòng..."
                className="w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm font-medium text-white outline-none focus:border-pink-500/50"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Vào phòng
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

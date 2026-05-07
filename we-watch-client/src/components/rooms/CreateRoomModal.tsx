'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  Globe,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Loader2,
  Search,
  Film,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/src/store/useAuthStore';
import Image from 'next/image';
import { toast } from 'sonner';
import { createRoom } from '@/src/services/room';
import { getVideos } from '@/src/services/video';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (room: any) => void;
  defaultVideoId?: string;
  defaultVideoTitle?: string;
  defaultVideoThumb?: string | null;
}

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80',
  'https://images.unsplash.com/photo-1541562232579-512a21360020?w=800&q=80',
  'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=800&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
];

export default function CreateRoomModal({
  isOpen,
  onClose,
  onCreated,
  defaultVideoId,
  defaultVideoTitle,
  defaultVideoThumb,
}: CreateRoomModalProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const hostId = user?.username || 'user_123';

  const [tab, setTab] = useState<'private' | 'public'>('private');
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string;
    title: string;
    thumbnailUrl?: string | null;
  } | null>(
    defaultVideoId
      ? {
          id: defaultVideoId,
          title: defaultVideoTitle ?? '',
          thumbnailUrl: defaultVideoThumb,
        }
      : null
  );
  const [videoSearch, setVideoSearch] = useState('');
  const [videoList, setVideoList] = useState<any[]>([]);
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [roomName, setRoomName] = useState('');
  const [slug, setSlug] = useState('');
  const [customSlug, setCustomSlug] = useState(false);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [bannerMode, setBannerMode] = useState<'upload' | 'preset'>('preset');
  const [selectedBanner, setSelectedBanner] = useState(PRESET_BANNERS[0]);

  const [maxUsers, setMaxUsers] = useState(5);

  useEffect(() => {
    if (!customSlug) {
      setSlug(
        roomName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  }, [roomName, customSlug]);

  // Sync default video when props change (e.g. opened from video card)
  useEffect(() => {
    if (defaultVideoId) {
      setSelectedVideo({
        id: defaultVideoId,
        title: defaultVideoTitle ?? '',
        thumbnailUrl: defaultVideoThumb,
      });
    }
  }, [defaultVideoId, defaultVideoTitle, defaultVideoThumb]);

  // Fetch video list for picker
  useEffect(() => {
    if (!videoPickerOpen) return;
    getVideos(1, 50)
      .then((res) => setVideoList(res.videos ?? []))
      .catch(() => {});
  }, [videoPickerOpen]);

  // Close picker when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setVideoPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return toast.error('Vui lòng nhập tên phòng.');
    if (tab === 'private' && !password.trim())
      return toast.error('Phòng private cần mật khẩu.');

    setLoading(true);
    try {
      const room = await createRoom({
        title: roomName.trim(),
        type: tab,
        password: tab === 'private' ? password : undefined,
        maxUsers,
        videoId: selectedVideo?.id,
      });
      console.log('Room created:', room);
      toast.success('Tạo phòng thành công!');
      onCreated?.(room);
      // Dùng window.location để đảm bảo redirect ngay lập tức
      window.location.href = `/private/${room.id}`;
    } catch (err: any) {
      console.error('Create room error:', err);
      toast.error(
        err.response?.data?.message ||
          'Tạo phòng thất bại. Vui lòng đăng nhập lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0B]/90 shadow-2xl backdrop-blur-xl"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="flex h-16 w-full items-center border-b border-white/10">
            <button
              onClick={() => setTab('private')}
              className={`flex h-full flex-1 items-center justify-center gap-2 font-bold transition-all ${
                tab === 'private'
                  ? 'text-primary border-b-2 border-[#C800DF] bg-white/5'
                  : 'text-white/40 grayscale hover:text-white/60'
              }`}
            >
              <Lock size={18} />
              We Watch
            </button>
            <button
              onClick={() => setTab('public')}
              className={`flex h-full flex-1 items-center justify-center gap-2 font-bold transition-all ${
                tab === 'public'
                  ? 'text-primary border-b-2 border-[#C800DF] bg-white/5'
                  : 'text-white/40 grayscale hover:text-white/60'
              }`}
            >
              <Globe size={18} />
              Community
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">
                Tên phòng
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Nhập tên phòng..."
                className="w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white outline-none focus:border-[#C800DF]/50"
                required
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-white/40">
                  wewatch.app/{tab === 'private' ? 'p' : 'community'}/
                  <span className="text-white/80">{slug || '...'}</span>
                </span>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/60 transition-colors hover:text-white">
                  <input
                    type="checkbox"
                    checked={customSlug}
                    onChange={(e) => setCustomSlug(e.target.checked)}
                    className="accent-[#C800DF]"
                  />
                  Tùy chỉnh đường dẫn
                </label>
              </div>
              {customSlug && (
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="custom-slug"
                  className="mt-2 w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white outline-none focus:border-[#C800DF]/50"
                  required
                />
              )}
            </div>

            {tab === 'private' && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white/80">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu phòng..."
                    className="w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm font-medium text-white outline-none focus:border-[#C800DF]/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Video Picker */}
            <div className="flex flex-col gap-2" ref={pickerRef}>
              <label className="text-sm font-bold text-white/80">
                Video chiếu{' '}
                <span className="font-normal text-white/30">(tùy chọn)</span>
              </label>
              {selectedVideo ? (
                <div className="flex items-center gap-3 rounded-[16px] border border-[#C800DF]/30 bg-[#C800DF]/5 px-4 py-2.5">
                  {selectedVideo.thumbnailUrl ? (
                    <div className="relative h-9 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={selectedVideo.thumbnailUrl}
                        alt={selectedVideo.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <Film className="h-5 w-5 text-[#C800DF]" />
                  )}
                  <span className="line-clamp-1 flex-1 text-sm font-bold text-white">
                    {selectedVideo.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedVideo(null)}
                    className="text-white/40 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setVideoPickerOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Film size={16} />
                  Chọn video...
                </button>
              )}

              <AnimatePresence>
                {videoPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="z-50 max-h-56 overflow-hidden rounded-[16px] border border-white/10 bg-[#12121A] shadow-2xl"
                  >
                    <div className="sticky top-0 flex items-center gap-2 border-b border-white/10 bg-[#12121A] px-3 py-2">
                      <Search size={14} className="text-white/40" />
                      <input
                        autoFocus
                        value={videoSearch}
                        onChange={(e) => setVideoSearch(e.target.value)}
                        placeholder="Tìm video..."
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                      />
                    </div>
                    <div className="scrollbar-hide max-h-40 overflow-y-auto">
                      {videoList
                        .filter((v) =>
                          v.title
                            .toLowerCase()
                            .includes(videoSearch.toLowerCase())
                        )
                        .map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setSelectedVideo(v);
                              setVideoPickerOpen(false);
                              setVideoSearch('');
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5"
                          >
                            {v.thumbnailUrl ? (
                              <div className="relative h-8 w-12 flex-shrink-0 overflow-hidden rounded-md">
                                <Image
                                  src={v.thumbnailUrl}
                                  alt={v.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <Film size={16} className="text-white/30" />
                            )}
                            <span className="line-clamp-1 flex-1 text-sm font-medium text-white">
                              {v.title}
                            </span>
                            {selectedVideo?.id === v.id && (
                              <Check size={14} className="text-[#C800DF]" />
                            )}
                          </button>
                        ))}
                      {videoList.filter((v) =>
                        v.title
                          .toLowerCase()
                          .includes(videoSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="px-4 py-3 text-xs text-white/30">
                          Không tìm thấy video.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">Banner</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBannerMode('upload')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                    bannerMode === 'upload'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <Upload size={14} />
                  Tải ảnh lên
                </button>
                <button
                  type="button"
                  onClick={() => setBannerMode('preset')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                    bannerMode === 'preset'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <ImageIcon size={14} />
                  Chọn ảnh có sẵn
                </button>
              </div>

              {bannerMode === 'upload' ? (
                <div className="mt-2 flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-white/20 bg-white/5 transition-all hover:border-white/40 hover:bg-white/10">
                  <Upload size={20} className="text-white/40" />
                  <span className="text-xs text-white/40">
                    Nhấp để tải ảnh lên (Max 2MB)
                  </span>
                </div>
              ) : (
                <div className="scrollbar-hide mt-2 flex gap-3 overflow-x-auto pb-2">
                  {PRESET_BANNERS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedBanner(url)}
                      className={`relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        selectedBanner === url
                          ? 'border-[#C800DF]'
                          : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`Preset ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-sm font-bold text-white/80">
                  Host ID
                </label>
                <div className="flex w-full items-center gap-2 rounded-[16px] border border-white/10 bg-black/40 px-4 py-3 opacity-60">
                  <Lock size={16} className="text-white/40" />
                  <span className="text-sm font-medium text-white">
                    {hostId}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <label className="flex items-center justify-between text-sm font-bold text-white/80">
                  Số người tối đa
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white">
                    {maxUsers}
                  </span>
                </label>
                <div className="flex h-[46px] items-center">
                  <input
                    type="range"
                    min={2}
                    max={tab === 'private' ? 7 : 20}
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(Number(e.target.value))}
                    className="w-full accent-[#C800DF]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C800DF] to-[#E60076] py-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {tab === 'private' ? 'Tạo Phòng We Watch' : 'Tạo Phòng Community'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Camera,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { UserResponse } from '@/src/types/auth';
import { uploadImage, updateProfile } from '@/src/services/auth';
import { compressImage } from '@/src/lib/imageUtils';
import { toast } from 'sonner';

const ProfilePage = () => {
  const {
    user: realUser,
    isAuthenticated,
    login: updateStoreUser,
  } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [editData, setEditData] = useState({
    username: realUser?.username || '',
    email: realUser?.email || '',
    avatarUrl: realUser?.avatarUrl || '',
    avatarPublicId: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 400, 0.6);
      const res = await uploadImage(compressed);
      setEditData((prev) => ({
        ...prev,
        avatarUrl: res.url,
        avatarPublicId: res.publicId,
      }));
      toast.success('Đã tải ảnh lên!');
    } catch (error: any) {
      toast.error('Lỗi upload ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await updateProfile({
        username: editData.username,
        avatarUrl: editData.avatarUrl,
        avatarPublicId: editData.avatarPublicId,
      });

      const { user: updatedUser, accessToken } = res;

      // Lưu Token mới vào LocalStorage ngay lập tức
      localStorage.setItem('token', accessToken);

      // Cập nhật vào Zustand store với Token mới
      updateStoreUser(updatedUser, accessToken);

      // Đồng bộ lại editData với dữ liệu mới nhất
      setEditData({
        username: updatedUser.username,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl || '',
        avatarPublicId: '',
      });

      setIsEditing(false);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  if (!realUser && !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Vui lòng đăng nhập...
      </div>
    );
  }

  const user = realUser!;

  return (
    <main className="relative min-h-screen font-sans text-slate-200">
      <Background />
      <Header />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
        >
          {/* Main Profile Card */}
          <div className="glass col-span-1 flex flex-col items-center rounded-[40px] border border-white/10 bg-black/40 p-10 backdrop-blur-xl md:col-span-1">
            <div className="group relative">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-[#C800DF]/30 p-1 transition-transform duration-500 group-hover:scale-105">
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <Image
                    src={isEditing ? editData.avatarUrl : user.avatarUrl || ''}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary absolute right-0 bottom-0 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>

            {isEditing ? (
              <div className="mt-8 w-full space-y-4">
                <div className="space-y-1">
                  <label className="pl-2 text-[10px] font-bold tracking-widest text-white/40 uppercase">
                    Username
                  </label>
                  <input
                    value={editData.username}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    className="focus:border-primary/50 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isLoading || isUploading}
                    className="bg-primary flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Lưu
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 text-xs font-bold text-white transition-all hover:bg-white/20"
                  >
                    <X size={16} />
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="mt-6 text-2xl font-black tracking-tight text-white">
                  {user.username}
                </h1>
                <p className="text-sm font-medium text-white/40">
                  @{user.username.toLowerCase()}
                </p>

                <div className="mt-8 flex w-full flex-col gap-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                    <Mail size={18} className="text-[#C800DF]" />
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                    <Calendar size={18} className="text-[#C800DF]" />
                    <span className="text-sm font-medium">
                      Tham gia: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-primary group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(200,0,223,0.2)] transition-all hover:opacity-90 hover:shadow-[0_0_30px_rgba(200,0,223,0.4)]"
                >
                  <Settings
                    size={18}
                    className="transition-transform group-hover:rotate-45"
                  />
                  Chỉnh sửa hồ sơ
                </button>
              </>
            )}
          </div>

          {/* Stats / Activity Area */}
          <div className="col-span-1 flex flex-col gap-6 md:col-span-2">
            <div className="glass flex flex-1 items-center justify-center rounded-[40px] border border-white/10 bg-black/40 p-10 backdrop-blur-xl">
              <div className="text-center">
                <Award size={48} className="mx-auto mb-4 text-white/20" />
                <p className="text-sm font-bold tracking-widest text-white/30 uppercase">
                  Chưa có hoạt động nào
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default ProfilePage;

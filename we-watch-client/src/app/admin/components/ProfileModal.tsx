import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, Camera, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  editName: string;
  setEditName: (name: string) => void;
  editAvatar: string;
  isUpdating: boolean;
  onAvatarClick: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  editName,
  setEditName,
  editAvatar,
  isUpdating,
  onAvatarClick,
  onAvatarChange,
  onSubmit,
  fileInputRef,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl"
      >
        <div className="relative h-32 bg-gradient-to-r from-red-600 to-red-400">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-white transition-colors hover:bg-black/20"
          >
            <XCircle size={20} />
          </button>
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="group relative h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl">
              <Image 
                src={editAvatar || 'https://i.pravatar.cc/150'} 
                alt="Avatar" 
                fill 
                className="object-cover" 
              />
              <button 
                type="button"
                onClick={onAvatarClick} 
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Camera size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={onAvatarChange} 
              />
            </div>
          </div>
        </div>
        <form onSubmit={onSubmit} className="px-8 pt-16 pb-8">
          <div className="mb-8 text-center">
            <h3 className="text-xl font-black text-gray-900">Chỉnh sửa hồ sơ</h3>
            <p className="text-xs font-medium text-gray-400 mt-1">Cập nhật thông tin nhận diện của bạn</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="ml-3 text-[10px] font-black tracking-widest text-gray-400 uppercase">Tên hiển thị</label>
              <input 
                type="text" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                className="h-12 w-full rounded-xl border-2 border-transparent bg-gray-50 px-5 text-sm font-bold text-gray-900 transition-all outline-none focus:border-red-100" 
              />
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 rounded-xl bg-gray-100 py-3.5 text-xs font-black tracking-widest text-gray-400 uppercase transition-colors hover:bg-gray-200"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              disabled={isUpdating} 
              className="flex flex-1 items-center justify-center rounded-xl bg-red-600 py-3.5 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-50"
            >
              {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileModal;

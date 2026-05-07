'use client';

import React, { useRef, useState } from 'react';
import { X, Film, ImageIcon, CheckCircle2, Upload } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  uploadThumbnail,
  getPresignedUrl,
  uploadVideoToSpaces,
  createVideo,
} from '@/src/services/video';

interface UploadVideoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UploadVideoModal({ open, onClose }: UploadVideoModalProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'uploading' | 'saving' | 'done'>('idle');

  const reset = () => {
    setTitle(''); setDescription('');
    setVideoFile(null); setThumbFile(null);
    setThumbPreview(null); setThumbUrl(null);
    setProgress(0); setStage('idle');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleThumbSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));

    // Upload lên Cloudinary ngay khi chọn
    setThumbUploading(true);
    try {
      const result = await uploadThumbnail(file);
      setThumbUrl(result.url);
      toast.success('Thumbnail đã upload (WebP)');
    } catch {
      toast.error('Upload thumbnail thất bại');
      setThumbPreview(null);
      setThumbFile(null);
    } finally {
      setThumbUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !title.trim() || !description.trim() || !thumbUrl) {
      toast.error('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    try {
      setStage('uploading');
      setProgress(0);

      const { presignedUrl, key, publicUrl } = await getPresignedUrl(videoFile.type);
      await uploadVideoToSpaces(presignedUrl, videoFile, setProgress);

      setStage('saving');
      await createVideo({
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl: publicUrl,
        videoKey: key,
        thumbnailUrl: thumbUrl ?? undefined,
        duration: 0,
        size: videoFile.size,
      });

      setStage('done');
      toast.success('Video đã được tải lên thành công!');
      setTimeout(handleClose, 1500);
    } catch {
      toast.error('Upload thất bại. Vui lòng thử lại.');
      setStage('idle');
      setProgress(0);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-lg rounded-[28px] border border-white/10 bg-[#111113] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/10">
              <Film className="h-4 w-4 text-pink-400" />
            </div>
            <h2 className="text-lg font-black text-white">Đóng góp Video</h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black tracking-widest text-white/50 uppercase">
              Tiêu đề <span className="text-pink-400">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Inception (2010)"
              className="w-full rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder-white/30 outline-none transition-colors focus:border-pink-500/50"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black tracking-widest text-white/50 uppercase">Mô tả <span className="text-pink-400">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu ngắn về video…"
              rows={2}
              required
              className="w-full resize-none rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder-white/30 outline-none transition-colors focus:border-pink-500/50"
            />
          </div>

          {/* Thumbnail upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black tracking-widest text-white/50 uppercase">
              <ImageIcon className="mr-1 inline h-3 w-3" /> Thumbnail <span className="text-pink-400">*</span>
            </label>

            {thumbPreview ? (
              <div className="relative h-36 w-full overflow-hidden rounded-[14px] border border-white/10">
                <Image src={thumbPreview} alt="thumbnail preview" fill className="object-cover" />
                {thumbUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-white">
                    Đang upload…
                  </div>
                )}
                {!thumbUploading && thumbUrl && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-green-500/80 px-2 py-1 text-[10px] font-black text-white">
                    <CheckCircle2 className="h-3 w-3" /> WebP ✓
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setThumbPreview(null); setThumbFile(null); setThumbUrl(null); }}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-[14px] border border-dashed border-white/20 bg-white/5 px-4 py-4 text-sm font-medium text-white/60 transition-colors hover:border-pink-500/40 hover:text-white"
              >
                <Upload className="h-5 w-5 flex-shrink-0" />
                <span>Chọn ảnh thumbnail…</span>
              </button>
            )}
            <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbSelect} className="hidden" />
          </div>

          {/* Video file picker */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black tracking-widest text-white/50 uppercase">
              File Video <span className="text-pink-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-[14px] border border-dashed border-white/20 bg-white/5 px-4 py-4 text-sm font-medium text-white/60 transition-colors hover:border-pink-500/40 hover:text-white"
            >
              <Upload className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{videoFile ? videoFile.name : 'Chọn file MP4, MKV, MOV…'}</span>
            </button>
            <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} className="hidden" />
          </div>

          {/* Progress */}
          {stage === 'uploading' && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold text-white/50">
                <span>Đang upload video lên cloud…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {stage === 'saving' && (
            <p className="text-center text-sm font-medium text-white/60">Đang lưu thông tin video…</p>
          )}
          {stage === 'done' && (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-bold">Upload thành công!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleClose} className="flex-1 rounded-[14px] border border-white/10 py-3 text-sm font-bold text-white/60 transition-colors hover:bg-white/5">
              Hủy
            </button>
            <button
              type="submit"
              disabled={stage !== 'idle' || !videoFile || !title.trim() || !description.trim() || !thumbUrl || thumbUploading}
              className="flex-1 rounded-[14px] bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-sm font-black text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {stage === 'idle' ? 'Tải lên' : 'Đang xử lý…'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

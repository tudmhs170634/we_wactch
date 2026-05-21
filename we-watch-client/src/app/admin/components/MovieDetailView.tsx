import React from 'react';
import Image from 'next/image';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { AdminMovie } from './MoviesView';

interface MovieDetailViewProps {
  movie: AdminMovie;
  streamUrl: string | null;
  onBack: () => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}

const formatSize = (bytes: number | bigint) => {
  const n = Number(bytes);
  if (!n) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} MB`;
  return `${(n / 1e3).toFixed(0)} KB`;
};

const MovieDetailView: React.FC<MovieDetailViewProps> = ({
  movie,
  streamUrl,
  onBack,
  onApprove,
  onDelete,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-black tracking-widest text-gray-400 uppercase transition-colors hover:text-white"
      >
        <ArrowLeft size={16} /> Quay lại danh sách
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-2xl">
            {streamUrl ? (
              <video
                src={streamUrl}
                className="h-full w-full object-contain"
                controls
                autoPlay
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 size={48} className="animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="rounded-3xl bg-[#111113] border border-white/5 p-8 shadow-sm">
            <h2 className="text-2xl font-black text-white">{movie.title}</h2>
            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white/10">
                  <Image
                    src={
                      movie.uploaderAvatar ||
                      `https://i.pravatar.cc/150?u=${movie.uploader}`
                    }
                    alt="Uploader"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                    Người tải lên
                  </p>
                  <p className="text-sm font-bold text-white">
                    {movie.uploader}
                  </p>
                </div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                  Dung lượng
                </p>
                <p className="text-sm font-bold text-white">
                  {formatSize(movie.size)}
                </p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                  Ngày tải lên
                </p>
                <p className="text-sm font-bold text-white">
                  {movie.createdAt}
                </p>
              </div>
            </div>
            <div className="mt-8 border-t border-white/5 pt-8">
              <h4 className="mb-4 text-sm font-black tracking-widest text-white uppercase">
                Mô tả chi tiết
              </h4>
              <p className="text-sm leading-relaxed text-gray-400">
                {movie.description || 'Không có mô tả.'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-[#111113] border border-white/5 p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-black text-white">
              Thao tác kiểm duyệt
            </h3>
            <div className="mt-8 space-y-3">
              {movie.status === 'Pending' ? (
                <>
                  <button
                    onClick={() => onApprove(movie.id)}
                    className="w-full rounded-2xl bg-primary py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-primary/20 transition-all hover:brightness-110"
                  >
                    Phê duyệt video
                  </button>
                  <button
                    onClick={() => onDelete(movie.id)}
                    className="w-full rounded-2xl bg-white/5 py-4 text-xs font-black tracking-widest text-white uppercase transition-all hover:bg-white/10"
                  >
                    Từ chối & Thông báo
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onDelete(movie.id)}
                  className="w-full rounded-2xl bg-primary/20 py-4 text-xs font-black tracking-widest text-primary uppercase transition-all hover:bg-red-100"
                >
                  Gỡ bỏ video
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailView;

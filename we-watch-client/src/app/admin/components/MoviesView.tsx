import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Film, Eye, UserCircle, Loader2 } from 'lucide-react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getVideosAdmin } from '@/src/services/video';

export interface AdminMovie {
  id: string;
  title: string;
  uploader?: string;
  uploaderAvatar?: string;
  duration: number;
  size: number | bigint;
  status: 'Pending' | 'Approved' | 'Rejected';
  thumbnailUrl: string;
  createdAt: string;
  description?: string;
  videoUrl: string;
}

interface MoviesViewProps {
  type: 'all' | 'queue';
  globalSearchTerm: string;
  onSelectMovie: (movie: AdminMovie) => void;
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

const MoviesView: React.FC<MoviesViewProps> = ({
  type,
  globalSearchTerm,
  onSelectMovie,
  onApprove,
  onDelete,
}) => {
  const [page, setPage] = useState(1);
  const cleanSearch = globalSearchTerm?.trim() || '';

  // Khi search term thay đổi, đưa về trang 1
  useEffect(() => {
    setPage(1);
  }, [cleanSearch]);

  // Tự gọi API thông qua React Query
  const { data, isLoading } = useQuery({
    queryKey: ['admin-movies', type, page, 10, cleanSearch],
    queryFn: () => getVideosAdmin(page, 10, cleanSearch || undefined),
    placeholderData: keepPreviousData,
  });

  const videoList = data?.videos || [];

  // Ánh xạ data từ Backend sang dạng UI
  const formattedMovies: AdminMovie[] = videoList.map((v: any) => ({
    id: v.id,
    title: v.title,
    uploader: v.uploader?.username || 'Unknown',
    uploaderAvatar: v.uploader?.avatarUrl,
    duration: v.duration,
    size: v.size || 0,
    status: v.isActive ? 'Approved' : 'Pending',
    thumbnailUrl: v.thumbnailUrl || '/placeholder-movie.jpg',
    createdAt: new Date(v.createdAt).toLocaleString('vi-VN'),
    description: v.description,
    videoUrl: v.videoUrl,
  }));

  const filteredMovies =
    type === 'queue'
      ? formattedMovies.filter((m) => m.status === 'Pending')
      : formattedMovies;
  const title =
    type === 'queue' ? 'Hàng chờ duyệt video' : 'Quản lý tất cả video';
  const subtitle =
    type === 'queue'
      ? 'Kiểm tra và xác minh nội dung mới tải lên'
      : 'Quản lý toàn bộ nội dung video trên hệ thống';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-2xl font-black text-white">{title}</h4>
          <p className="text-sm font-medium text-gray-400">{subtitle}</p>
        </div>
        <div className="bg-primary/20 text-primary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black tracking-widest uppercase">
          <Film size={14} /> {filteredMovies.length}{' '}
          {type === 'queue' ? 'Chờ duyệt' : 'Tổng số'}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-[#111113] py-20 shadow-sm">
          <Loader2 size={40} className="text-primary mb-4 animate-spin" />
          <p className="text-sm font-bold tracking-widest text-gray-400 uppercase">
            Đang tải nội dung...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              className="group hover:shadow-primary/5 flex overflow-hidden rounded-3xl border border-white/5 bg-[#111113] shadow-sm transition-all hover:shadow-lg"
            >
              <div className="relative aspect-video w-72 overflow-hidden bg-white/10">
                <Image
                  src={movie.thumbnailUrl}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => onSelectMovie(movie)}
                    className="text-primary flex h-12 w-12 scale-75 transform items-center justify-center rounded-full border border-white/5 bg-[#111113] shadow-xl transition-transform group-hover:scale-100"
                  >
                    <Eye size={24} />
                  </button>
                </div>
                <div className="absolute right-3 bottom-3 rounded-md bg-black/80 px-2 py-1 text-[10px] font-black text-white">
                  {formatSize(movie.size)}
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-8">
                <div>
                  <button
                    onClick={() => onSelectMovie(movie)}
                    className="hover:text-primary line-clamp-1 text-left text-lg font-black text-white transition-colors"
                  >
                    {movie.title}
                  </button>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-400">
                    <UserCircle size={14} /> Tải lên bởi{' '}
                    <span className="font-bold text-white">
                      {movie.uploader}
                    </span>{' '}
                    • {movie.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {movie.status === 'Pending' ? (
                    <>
                      <button
                        onClick={() => onApprove(movie.id)}
                        className="bg-primary shadow-primary/20 w-25 rounded-xl py-2.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:brightness-110"
                      >
                        Duyệt video
                      </button>
                      <button
                        onClick={() => onDelete(movie.id)}
                        className="w-25 rounded-xl bg-white/5 py-2.5 text-[10px] font-black tracking-widest text-gray-400 uppercase transition-all hover:bg-white/10 hover:text-white"
                      >
                        Từ chối
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onDelete(movie.id)}
                      className="bg-primary/20 text-primary w-25 rounded-xl py-2.5 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-red-100"
                    >
                      Gỡ bỏ
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredMovies.length === 0 && (
            <div className="rounded-3xl border border-white/5 bg-[#111113] py-20 text-center font-bold tracking-widest text-gray-400 uppercase shadow-sm">
              Không tìm thấy video nào
            </div>
          )}
        </div>
      )}
      {/* PAGINATION */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-center border-t border-white/5 p-6">
          <div className="flex items-center gap-1.5">
            {/* Nút Back */}
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-8 items-center justify-center gap-1 rounded-md border border-white/10 bg-transparent px-3 text-xs font-medium text-white transition-colors hover:bg-white/5 disabled:pointer-events-none disabled:opacity-40"
            >
              <span className="text-gray-500">&lt;</span> Back
            </button>

            {/* Các số trang */}
            {(() => {
              const total = data.totalPages;
              let pages = [];

              // Thuật toán hiển thị tối đa 5 trang xung quanh trang hiện tại
              if (total <= 5) {
                pages = Array.from({ length: total }, (_, i) => i + 1);
              } else if (page <= 3) {
                pages = [1, 2, 3, 4, 5];
              } else if (page >= total - 2) {
                pages = [total - 4, total - 3, total - 2, total - 1, total];
              } else {
                pages = [page - 2, page - 1, page, page + 1, page + 2];
              }

              return pages.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-8 min-w-[32px] items-center justify-center rounded-md border text-xs font-bold transition-colors ${
                    page === p
                      ? 'border-white bg-white text-black shadow-sm'
                      : 'border-white/10 bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ));
            })()}

            {/* Nút Next */}
            <button
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              className="flex h-8 items-center justify-center gap-1 rounded-md border border-white/10 bg-transparent px-3 text-xs font-medium text-white transition-colors hover:bg-white/5 disabled:pointer-events-none disabled:opacity-40"
            >
              Next <span className="text-gray-500">&gt;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviesView;

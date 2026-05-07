import React from 'react';
import Image from 'next/image';
import { Film, Eye, UserCircle, Loader2 } from 'lucide-react';

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
  movies: AdminMovie[];
  isLoading: boolean;
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
  movies, 
  isLoading, 
  onSelectMovie, 
  onApprove, 
  onDelete 
}) => {
  const filteredMovies = type === 'queue' ? movies.filter((m) => m.status === 'Pending') : movies;
  const title = type === 'queue' ? 'Hàng chờ duyệt phim' : 'Quản lý tất cả phim';
  const subtitle = type === 'queue' ? 'Kiểm tra và xác minh nội dung mới tải lên' : 'Quản lý toàn bộ nội dung phim trên hệ thống';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-2xl font-black text-gray-900">{title}</h4>
          <p className="text-sm font-medium text-gray-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-black tracking-widest text-red-600 uppercase">
          <Film size={14} /> {filteredMovies.length} {type === 'queue' ? 'Chờ duyệt' : 'Tổng số'}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 shadow-sm">
          <Loader2 size={40} className="mb-4 animate-spin text-red-600" />
          <p className="text-sm font-bold tracking-widest text-gray-400 uppercase">Đang tải nội dung...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredMovies.map((movie) => (
            <div key={movie.id} className="group flex overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:shadow-xl hover:shadow-gray-100">
              <div className="relative aspect-video w-72 overflow-hidden bg-gray-100">
                <Image src={movie.thumbnailUrl} alt={movie.title} fill className="object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                  <button 
                    onClick={() => onSelectMovie(movie)} 
                    className="flex h-12 w-12 scale-75 transform items-center justify-center rounded-full bg-white text-red-600 shadow-xl transition-transform group-hover:scale-100"
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
                  <button onClick={() => onSelectMovie(movie)} className="line-clamp-1 text-left text-lg font-black text-gray-900 transition-colors hover:text-red-600">
                    {movie.title}
                  </button>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-400">
                    <UserCircle size={14} /> Tải lên bởi <span className="font-bold text-gray-900">{movie.uploader}</span> • {movie.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {movie.status === 'Pending' ? (
                    <>
                      <button onClick={() => onApprove(movie.id)} className="flex-1 rounded-xl bg-red-600 py-2.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-red-100 transition-all hover:bg-red-700">Duyệt phim</button>
                      <button onClick={() => onDelete(movie.id)} className="flex-1 rounded-xl bg-gray-50 py-2.5 text-[10px] font-black tracking-widest text-gray-400 uppercase transition-all hover:bg-gray-100 hover:text-gray-900">Từ chối</button>
                    </>
                  ) : (
                    <button onClick={() => onDelete(movie.id)} className="flex-1 rounded-xl bg-red-50 py-2.5 text-[10px] font-black tracking-widest text-red-600 uppercase transition-all hover:bg-red-100">Gỡ bỏ</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredMovies.length === 0 && (
            <div className="rounded-3xl bg-white py-20 text-center shadow-sm text-gray-400 font-bold uppercase tracking-widest">
              Không tìm thấy phim nào
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MoviesView;

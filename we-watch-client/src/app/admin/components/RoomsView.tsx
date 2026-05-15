import React, { useState, useEffect } from 'react';
import { PlayCircle, Trash2, MonitorPlay, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { getRooms, deleteRoom, terminateRoom, Room } from '@/src/services/room';
import { toast } from 'sonner';

interface RoomsViewProps {
  globalSearchTerm: string;
  filterType: string;
  onFilterChange: (type: string) => void;
}

const RoomsView: React.FC<RoomsViewProps> = ({
  globalSearchTerm,
  filterType,
  onFilterChange,
}) => {
  const [page, setPage] = useState(1);
  const cleanSearch = globalSearchTerm?.trim() || '';

  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [cleanSearch, filterType]);

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng này không?')) return;
    try {
      await deleteRoom(roomId);
      toast.success('Xóa phòng thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Xóa phòng thất bại');
    }
  };

  const handleTerminateRoom = async (roomId: string) => {
    const reason = window.prompt(
      'Lý do dừng phòng này vì vi phạm (ví dụ: Bản quyền)?'
    );
    if (!reason) return;

    try {
      await terminateRoom(roomId, reason);
      toast.success('Đã dừng phòng vì vi phạm!');
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể dừng phòng');
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rooms', filterType, page, 9, cleanSearch],
    queryFn: () =>
      getRooms(page, 9, filterType || undefined, cleanSearch || undefined),
    placeholderData: keepPreviousData,
  });

  const roomsList: Room[] = data?.rooms || [];
  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-2xl font-black text-white">Quản lý phòng xem</h4>
          <p className="text-sm font-medium text-gray-400">
            Giám sát các phòng đang phát sóng trực tiếp
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111113] p-1 shadow-sm">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'public', label: 'Cộng đồng' },
              { id: 'private', label: 'Riêng tư' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onFilterChange(t.id === 'all' ? '' : t.id)}
                className={`rounded-lg px-4 py-1.5 text-xs font-black transition-all ${
                  filterType === t.id || (t.id === 'all' && !filterType)
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roomsList.map((room) => (
          <div
            key={room.id}
            className="group overflow-hidden rounded-3xl border border-white/5 bg-[#111113] shadow-sm transition-all hover:shadow-xl"
          >
            {/* Image Container */}
            <div className="relative aspect-video overflow-hidden bg-white/5">
              {/* Hiển thị ảnh Thumbnail nếu có, nếu không hiện fallback UI */}
              {room.image ? (
                <img
                  src={room.image}
                  alt={room.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-[#111113]">
                  <MonitorPlay size={40} className="mb-2 text-gray-600" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    No Preview
                  </span>
                </div>
              )}

              {/* Overlay Badge */}
              <div className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase backdrop-blur-sm">
                {room.type === 'public' ? 'Cộng đồng' : 'Riêng tư'}
              </div>

              {/* Hover Play Button */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <PlayCircle size={48} className="text-white" />
              </div>
            </div>

            <div className="p-6">
              <h4 className="line-clamp-1 text-lg font-black text-white">
                {room.title}
              </h4>
              <p className="mt-1 text-xs font-medium text-gray-400">
                Chủ phòng:{' '}
                <span className="text-primary">
                  @{room.host?.username || 'Ẩn danh'}
                </span>
              </p>

              <div className="mt-6 flex gap-3">
                <Link
                  href={`/${room.type === 'public' ? 'community' : 'private'}/${room.id}?monitor=true`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gray-900 py-3 text-[10px] font-black tracking-widest text-white uppercase transition-colors hover:bg-gray-800"
                >
                  <MonitorPlay size={13} /> Giám sát
                </Link>
                <button
                  onClick={() => handleDeleteRoom(room.id)}
                  className="rounded-2xl bg-red-500/10 px-4 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                  title="Xóa phòng"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {roomsList.length === 0 && (
          <div className="col-span-full rounded-3xl border border-white/5 bg-[#111113] py-20 text-center font-bold tracking-widest text-gray-400 uppercase shadow-sm">
            Không có phòng nào đang hoạt động
          </div>
        )}
      </div>
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

export default RoomsView;

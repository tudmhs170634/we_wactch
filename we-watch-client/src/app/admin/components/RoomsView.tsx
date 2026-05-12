import React from 'react';
import { PlayCircle, Trash2, MonitorPlay } from 'lucide-react'; // Thêm icon dự phòng
import Link from 'next/link';
import Image from 'next/image'; // Sử dụng Next Image để tối ưu hiệu năng
import { Room } from '@/src/services/room';

interface RoomsViewProps {
  rooms: Room[];
  filterType: string;
  onFilterChange: (type: string) => void;
}

const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  filterType,
  onFilterChange,
}) => {
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
        {rooms.map((room) => (
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
                  href={`/${room.type === 'public' ? 'community' : 'private'}/${room.id}`}
                  className="flex flex-1 items-center justify-center rounded-2xl bg-gray-900 py-3 text-[10px] font-black tracking-widest text-white uppercase transition-colors hover:bg-gray-800"
                >
                  Giám sát
                </Link>
                <button className="rounded-2xl bg-red-500/10 px-4 text-red-500 transition-colors hover:bg-red-500 hover:text-white">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {rooms.length === 0 && (
          <div className="col-span-full rounded-3xl border border-white/5 bg-[#111113] py-20 text-center font-bold tracking-widest text-gray-400 uppercase shadow-sm">
            Không có phòng nào đang hoạt động
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsView;

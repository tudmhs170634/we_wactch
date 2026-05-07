import React from 'react';
import { PlayCircle, Trash2, Filter } from 'lucide-react';
import { Room } from '@/src/services/room';

interface RoomsViewProps {
  rooms: Room[];
  filterType: string;
  onFilterChange: (type: string) => void;
}

const RoomsView: React.FC<RoomsViewProps> = ({ rooms, filterType, onFilterChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-2xl font-black text-gray-900">Quản lý phòng xem</h4>
          <p className="text-sm font-medium text-gray-400">Giám sát các phòng đang phát sóng trực tiếp</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-100 p-1 shadow-sm">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'public', label: 'Cộng đồng' },
              { id: 'private', label: 'Riêng tư' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onFilterChange(t.id === 'all' ? '' : t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  (filterType === t.id || (t.id === 'all' && !filterType))
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <div key={room.id} className="group overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:shadow-xl">
            <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
              <PlayCircle size={48} className="text-gray-200" />
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 rounded-full text-[10px] font-black text-white uppercase tracking-widest backdrop-blur-sm">
                {room.type === 'public' ? 'Cộng đồng' : 'Riêng tư'}
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-lg font-black text-gray-900">{room.name}</h4>
              <p className="mt-1 text-xs font-medium text-gray-400">
                Chủ phòng: <span className="text-red-600">@{room.host?.username || 'Ẩn danh'}</span>
              </p>
              <div className="mt-6 flex gap-3">
                <button className="flex-1 rounded-2xl bg-gray-900 py-3 text-[10px] font-black tracking-widest text-white uppercase transition-colors hover:bg-gray-800">
                  Giám sát
                </button>
                <button className="rounded-2xl bg-red-50 px-4 text-red-600 transition-colors hover:bg-red-100">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {rooms.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl shadow-sm text-gray-400 font-bold uppercase tracking-widest">
            Không có phòng nào đang hoạt động
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsView;

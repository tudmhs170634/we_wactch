import React from 'react';
import { Users, PlayCircle, Film, Clock } from 'lucide-react';

interface DashboardViewProps {
  stats: {
    usersCount: number;
    roomsCount: number;
    moviesCount: number;
    pendingCount: number;
  };
}

const DashboardView: React.FC<DashboardViewProps> = ({ stats }) => {
  const cards = [
    {
      label: 'TỔNG NGƯỜI DÙNG',
      value: stats.usersCount,
      change: '+12%',
      icon: Users,
      trend: 'up',
    },
    {
      label: 'PHÒNG ĐANG HOẠT ĐỘNG',
      value: stats.roomsCount,
      change: '+5%',
      icon: PlayCircle,
      trend: 'up',
    },
    {
      label: 'TỔNG SỐ VIDEO',
      value: stats.moviesCount,
      change: '+8%',
      icon: Film,
      trend: 'up',
    },
    {
      label: 'PHIM ĐANG CHỜ DUYỆT',
      value: stats.pendingCount,
      change: '0%',
      icon: Clock,
      trend: 'neutral',
    },
  ];

  return (
    <div className="space-y-10">
      <h2 className="text-3xl font-black tracking-tight text-gray-900">
        Tổng quan hiệu suất
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat, i) => (
          <div
            key={i}
            className="group relative rounded-3xl bg-white p-8 shadow-sm transition-all hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <stat.icon size={24} />
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-black ${
                  stat.trend === 'up'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-50 text-gray-400'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <div className="mt-8">
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                {stat.label}
              </p>
              <h3 className="mt-2 text-3xl font-black text-gray-900">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardView;

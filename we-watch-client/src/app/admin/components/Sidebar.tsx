import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  PlaySquare,
  Film,
  Clock,
  LogOut,
  TrendingUp,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'users'
  | 'rooms'
  | 'all_movies'
  | 'movie_queue';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  setSelectedMovie: (movie: any) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  setSelectedMovie,
  onLogout,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
    { id: 'users', label: 'Người dùng', icon: Users },
    { id: 'rooms', label: 'Phòng xem', icon: PlaySquare },
    { id: 'all_movies', label: 'Video', icon: Film },
    { id: 'movie_queue', label: 'Hàng chờ video', icon: Clock },
  ];

  return (
    <div className="fixed top-0 left-0 h-screen w-64 border-r border-gray-100 bg-white px-6 py-8">
      <div className="mb-12 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-200">
          <TrendingUp size={24} />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-gray-900">
            We Watch
          </h1>
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
            Hệ thống xem chung
          </p>
        </div>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as TabType);
              setSelectedMovie(null);
            }}
            className={`group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === item.id
                ? 'bg-gray-50 text-red-600'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute top-0 left-0 h-full w-1 rounded-r-full bg-red-600"
              />
            )}
            <item.icon
              size={20}
              className={
                activeTab === item.id
                  ? 'text-red-600'
                  : 'text-gray-400 group-hover:text-gray-900'
              }
            />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="absolute right-6 bottom-8 left-6">
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-gray-400 transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={20} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

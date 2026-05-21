import React from 'react';
import Image from 'next/image';
import { Search, Bell, HelpCircle } from 'lucide-react';

interface TopNavProps {
  user: any;
  onProfileClick: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  placeholder?: string;
}

const TopNav: React.FC<TopNavProps> = ({ user, onProfileClick, searchTerm, onSearchChange, placeholder = 'Tìm kiếm dữ liệu...' }) => {
  return (
    <div className="mb-10 flex items-center justify-between">
      <div className="group relative w-96">
        <Search 
          size={18} 
          className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary" 
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-full bg-white/10 pr-4 pl-11 text-sm font-medium transition-all outline-none focus:bg-[#111113] border border-white/5 focus:ring-2 focus:ring-red-100"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-gray-400 transition-colors hover:text-white">
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white bg-primary" />
        </button>
        <button className="text-gray-400 transition-colors hover:text-white">
          <HelpCircle size={20} />
        </button>
        <div className="h-8 w-px bg-white/10" />
        <button 
          onClick={onProfileClick} 
          className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
        >
          <div className="text-right">
            <p className="text-xs font-bold text-white">{user?.username || 'Admin'}</p>
            <p className="text-[10px] font-medium tracking-tighter text-gray-400 uppercase">
              {user?.role === 'admin' ? 'Quản trị viên' : user?.role || 'Nhân viên'}
            </p>
          </div>
          <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white/10 shadow-sm">
            <Image 
              src={user?.avatarUrl || 'https://i.pravatar.cc/150?u=admin'} 
              alt="Admin" 
              fill 
              className="object-cover" 
            />
          </div>
        </button>
      </div>
    </div>
  );
};

export default TopNav;

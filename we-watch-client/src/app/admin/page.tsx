'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Store & Services
import { useAuthStore } from '@/src/store/useAuthStore';
import {
  getVideosAdmin,
  approveVideo,
  deleteVideo,
  getStreamUrl,
} from '@/src/services/video';
import { updateProfile, uploadImage, logout } from '@/src/services/auth';
import { getAllUsers, banUser, switchRole, User } from '@/src/services/user';
import { getAllRooms, Room } from '@/src/services/room';
import { useDebounce } from '@/src/hooks/useDebounce';

// Components
import Sidebar, { TabType } from './components/Sidebar';
import TopNav from './components/TopNav';
import DashboardView from './components/DashboardView';
import UsersView from './components/UsersView';
import MoviesView, { AdminMovie } from './components/MoviesView';
import MovieDetailView from './components/MovieDetailView';
import RoomsView from './components/RoomsView';
import ReportsView from './components/ReportsView';
import ProfileModal from './components/ProfileModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminStats } from '@/src/services/admin';

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedMovie, setSelectedMovie] = useState<AdminMovie | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Data States

  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const debouncedSearch = useDebounce(globalSearchTerm, 500);
  const cleanSearch = debouncedSearch.trim();

  // Auth Store
  const { user, login: updateLocalUser } = useAuthStore();

  // --- Fetchers ---

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    enabled: activeTab === 'dashboard',
    staleTime: 60 * 1000, // Nhớ cache lại 1 phút cho mượt
  });

  // Initial Load & Tab Change

  // Security Link Fetcher
  useEffect(() => {
    if (selectedMovie) {
      getStreamUrl(selectedMovie.id)
        .then((res) => setCurrentStreamUrl(res.url))
        .catch(() => toast.error('Không thể tải link video bảo mật'));
    } else {
      setCurrentStreamUrl(null);
    }
  }, [selectedMovie]);

  // --- Actions ---

  const handleApproveMovie = async (id: string) => {
    try {
      await approveVideo(id);
      toast.success('Duyệt video thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (selectedMovie?.id === id) setSelectedMovie(null);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi duyệt video');
    }
  };

  const handleDeleteMovie = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa video này?')) return;
    try {
      await deleteVideo(id);
      toast.success('Xóa video thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (selectedMovie?.id === id) setSelectedMovie(null);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xóa video');
    }
  };

  const handleBanUser = async (id: string, isBanned: boolean) => {
    try {
      await banUser(id, isBanned);
      toast.success(isBanned ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xử lý người dùng');
    }
  };

  const handleSwitchRole = async (id: string) => {
    try {
      await switchRole(id);
      toast.success('Đã thay đổi vai trò thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi đổi vai trò');
    }
  };

  // Profile Modal Logic
  const [editName, setEditName] = useState(user?.username || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Tên không được để trống');
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const response = await updateProfile({
        username: editName,
        avatarUrl: editAvatar,
      });
      updateLocalUser(response.user, response.accessToken);
      toast.success('Cập nhật hồ sơ thành công');
      setIsProfileModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const loadingToast = toast.loading('Đang tải ảnh lên...');
    try {
      const { url } = await uploadImage(file);
      setEditAvatar(url);
      toast.success('Tải ảnh lên thành công', { id: loadingToast });
    } catch (error) {
      toast.error('Tải ảnh lên thất bại', { id: loadingToast });
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'users':
        return 'Tìm username hoặc email...';
      case 'rooms':
        return 'Tìm tên phòng chiếu...';
      case 'all_movies':
      case 'movie_queue':
        return 'Tìm tiêu đề video...';
      default:
        return 'Tìm kiếm dữ liệu...';
    }
  };

  return (
    <main className="bg-background min-h-screen font-sans text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setGlobalSearchTerm('');
          setActiveTab(tab);
        }}
        setSelectedMovie={setSelectedMovie}
        onLogout={() => logout()}
      />

      <div className="ml-64 min-h-screen p-10">
        <TopNav
          user={user}
          onProfileClick={() => {
            setEditName(user?.username || '');
            setEditAvatar(user?.avatarUrl || '');
            setIsProfileModalOpen(true);
          }}
          searchTerm={globalSearchTerm}
          onSearchChange={setGlobalSearchTerm}
          placeholder={getSearchPlaceholder()}
        />

        <AnimatePresence mode="wait">
          {selectedMovie ? (
            <motion.div
              key="movie-detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MovieDetailView
                movie={selectedMovie}
                streamUrl={currentStreamUrl}
                onBack={() => setSelectedMovie(null)}
                onApprove={handleApproveMovie}
                onDelete={handleDeleteMovie}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {isLoading && (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-[#111113] py-20 shadow-sm">
                  <Loader2
                    size={40}
                    className="text-primary mb-4 animate-spin"
                  />
                  <p className="text-xs font-black tracking-widest text-gray-400 uppercase">
                    Đang tải dữ liệu hệ thống...
                  </p>
                </div>
              )}
              {!isLoading && (
                <>
                  {activeTab === 'dashboard' && (
                    <DashboardView
                      stats={
                        stats || {
                          usersCount: 0,
                          roomsCount: 0,
                          moviesCount: 0,
                          pendingCount: 0,
                        }
                      }
                    />
                  )}
                  {activeTab === 'users' && (
                    <UsersView
                      globalSearchTerm={globalSearchTerm}
                      onBanUser={handleBanUser}
                      onSwitchRole={handleSwitchRole}
                    />
                  )}
                  {activeTab === 'all_movies' && (
                    <MoviesView
                      type="all"
                      globalSearchTerm={cleanSearch}
                      onSelectMovie={setSelectedMovie}
                      onApprove={handleApproveMovie}
                      onDelete={handleDeleteMovie}
                    />
                  )}
                  {activeTab === 'movie_queue' && (
                    <MoviesView
                      type="queue"
                      globalSearchTerm={cleanSearch}
                      onSelectMovie={setSelectedMovie}
                      onApprove={handleApproveMovie}
                      onDelete={handleDeleteMovie}
                    />
                  )}
                  {activeTab === 'rooms' && (
                    <RoomsView
                      globalSearchTerm={cleanSearch}
                      filterType={roomFilter}
                      onFilterChange={setRoomFilter}
                    />
                  )}
                  {activeTab === 'reports' && (
                    <ReportsView />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        editName={editName}
        setEditName={setEditName}
        editAvatar={editAvatar}
        isUpdating={isUpdatingProfile}
        onAvatarClick={() => fileInputRef.current?.click()}
        onAvatarChange={handleAvatarUpload}
        onSubmit={handleUpdateProfileSubmit}
        fileInputRef={fileInputRef}
      />
    </main>
  );
};

export default AdminDashboard;

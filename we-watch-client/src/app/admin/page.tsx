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

// Components
import Sidebar, { TabType } from './components/Sidebar';
import TopNav from './components/TopNav';
import DashboardView from './components/DashboardView';
import UsersView from './components/UsersView';
import MoviesView, { AdminMovie } from './components/MoviesView';
import MovieDetailView from './components/MovieDetailView';
import RoomsView from './components/RoomsView';
import ProfileModal from './components/ProfileModal';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedMovie, setSelectedMovie] = useState<AdminMovie | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Data States
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState('');

  // Auth Store
  const { user, login: updateLocalUser } = useAuthStore();

  // --- Fetchers ---

  const fetchMovies = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getVideosAdmin(1, 100);
      const videoList = data.videos || [];
      const mappedMovies = videoList.map((v: any) => ({
        id: v.id,
        title: v.title,
        uploader: v.owner?.username || 'Ẩn danh',
        uploaderAvatar: v.owner?.avatarUrl || '',
        duration: v.duration,
        size: v.size || 0,
        status: v.isActive ? 'Approved' : 'Pending',
        thumbnailUrl: v.thumbnailUrl || '/placeholder-movie.jpg',
        createdAt: new Date(v.createdAt).toLocaleString('vi-VN'),
        description: v.description,
        videoUrl: v.videoUrl,
      }));
      setMovies(mappedMovies);
    } catch (error) {
      toast.error('Không thể tải danh sách video');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRooms = useCallback(async (type?: string) => {
    setIsLoading(true);
    try {
      const data = await getAllRooms(type);
      setRooms(data);
    } catch (error) {
      toast.error('Không thể tải danh sách phòng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Load & Tab Change
  useEffect(() => {
    if (activeTab === 'dashboard') {
      // Fetch everything for dashboard stats
      Promise.all([fetchMovies(), fetchUsers(), fetchRooms()]);
    } else if (activeTab === 'all_movies' || activeTab === 'movie_queue') {
      fetchMovies();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'rooms') {
      fetchRooms(roomFilter);
    }
  }, [activeTab, roomFilter, fetchMovies, fetchUsers, fetchRooms]);

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
      fetchMovies();
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
      fetchMovies();
      if (selectedMovie?.id === id) setSelectedMovie(null);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xóa video');
    }
  };

  const handleBanUser = async (id: string, isBanned: boolean) => {
    try {
      await banUser(id, isBanned);
      toast.success(isBanned ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xử lý người dùng');
    }
  };

  const handleSwitchRole = async (id: string) => {
    try {
      await switchRole(id);
      toast.success('Đã thay đổi vai trò thành công');
      fetchUsers();
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

  return (
    <main className="min-h-screen bg-background font-sans text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
                <div className="flex flex-col items-center justify-center rounded-3xl bg-[#111113] border border-white/5 py-20 shadow-sm">
                  <Loader2
                    size={40}
                    className="mb-4 animate-spin text-primary"
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
                      stats={{
                        usersCount: users.length,
                        roomsCount: rooms.length,
                        moviesCount: movies.length,
                        pendingCount: movies.filter(
                          (m) => m.status === 'Pending'
                        ).length,
                      }}
                    />
                  )}
                  {activeTab === 'users' && (
                    <UsersView
                      users={users}
                      onBanUser={handleBanUser}
                      onSwitchRole={handleSwitchRole}
                    />
                  )}
                  {activeTab === 'all_movies' && (
                    <MoviesView
                      type="all"
                      movies={movies}
                      isLoading={isLoading}
                      onSelectMovie={setSelectedMovie}
                      onApprove={handleApproveMovie}
                      onDelete={handleDeleteMovie}
                    />
                  )}
                  {activeTab === 'movie_queue' && (
                    <MoviesView
                      type="queue"
                      movies={movies}
                      isLoading={isLoading}
                      onSelectMovie={setSelectedMovie}
                      onApprove={handleApproveMovie}
                      onDelete={handleDeleteMovie}
                    />
                  )}
                  {activeTab === 'rooms' && (
                    <RoomsView
                      rooms={rooms}
                      filterType={roomFilter}
                      onFilterChange={setRoomFilter}
                    />
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

'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { MOCK_VIDEOS } from '@/src/constants/mockData';
import Image from 'next/image';
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  Send,
  Copy,
  Mic,
  MicOff,
  Video,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Smile,
  RefreshCw,
  Check,
  X,
  Settings,
  ScreenShare,
  UserMinus,
  LogOut,
  Users,
  VideoOff,
  Loader2,
  Search,
  Heart,
  ThumbsUp,
  Flame,
  FileImage,
  ShieldAlert,
  StopCircle,
} from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRoom, getRoomBySlug, terminateRoom } from '@/src/services/room';
import { getVideos } from '@/src/services/video';
import { toast } from 'sonner';
import { useSocket } from '@/src/hooks/useSocket';
import { useAuthStore } from '@/src/store/useAuthStore';
import LiveKitRoom from '@/src/components/rooms/LiveKitRoom';
import { ConfirmationModal } from '@/src/components/rooms/ConfirmationModal';
import api from '@/src/lib/axios';
import VideoPlayer from '@/src/components/videos/VideoPlayer';

export default function WeWatchRoomPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isHostCamOn, setIsHostCamOn] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [visibleStatusIds, setVisibleStatusIds] = useState<Set<string>>(
    new Set()
  );
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedQueueVideo, setSelectedQueueVideo] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  const searchParams = useSearchParams();
  const isMonitorMode = searchParams.get('monitor') === 'true';
  const [isEndRoomModalOpen, setIsEndRoomModalOpen] = useState(false);
  const [endRoomReason, setEndRoomReason] = useState('Vi phạm bản quyền');

  const [room, setRoom] = useState<any>(null);
  const [password, setPassword] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Lấy mật khẩu đã nhập từ sessionStorage (nếu có)
    const savedPassword = sessionStorage.getItem(`room_pwd_${params.slug}`);
    if (savedPassword) setPassword(savedPassword);
  }, [params.slug]);
  const {
    socket,
    members: socketMembers,
    messages,
    emojis,
    wishlist: socketWishlist,
    wishlistError,
    sendMessage,
    sendEmoji,
    addVideoToWishlist,
    removeVideoFromWishlist,
    playVideoFromWishlist,
    socketError,
    currentHostId,
    currentHostUsername,
    setCurrentHostId,
    sendVideoAction,
    lastVideoAction,
    videoChangeTrigger,
    videoState,
    requestVideoSync,
    serverTimeOffset,
    kickMember,
  } = useSocket(room?.id, user, password, (reason?: string, stoppedBy?: string, stoppedByRole?: string) => {
    const amIHost = room?.host?.username === user?.username || room?.hostId === user?.id;

    if (amIHost && stoppedByRole === 'admin') {
      const reasonText = reason ? ` Lý do: "${reason}".` : '';
      toast.error(`Phiên live của bạn đã bị Admin dừng bởi ${reasonText}`, {
        duration: 6000,
        description: 'Bạn sẽ được chuyển về trang danh sách phòng.',
      });
      setTimeout(() => router.push('/rooms'), 3000);
    } else if (!amIHost) {
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        toast.info('Phiên live đã kết thúc.', {
          description:
            stoppedByRole === 'admin'
              ? `Phiên đã bị Admin dừng. Bạn sẽ được chuyển về danh sách phòng.`
              : 'Host đã dừng phiên. Bạn sẽ được chuyển về danh sách phòng.',
          duration: 4000,
        });
      }
      setTimeout(() => router.push('/rooms'), 1500);
    } else {
      router.push('/rooms');
    }
  });
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
  const [isFilmsOpen, setIsFilmsOpen] = useState(true);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [liveKitToken, setLiveKitToken] = useState<string>('');

  // Real DB Library State
  const [libraryFilms, setLibraryFilms] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [libPage, setLibPage] = useState(1);
  const [hasMoreLib, setHasMoreLib] = useState(true);
  const [isLoadingLib, setIsLoadingLib] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0);

  // New Chat Feature States
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Click outside to close pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatContainerRef.current &&
        !chatContainerRef.current.contains(event.target as Node)
      ) {
        setIsEmojiPickerOpen(false);
        setIsGifPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Wishlist error toast
  useEffect(() => {
    if (wishlistError) toast.error(wishlistError);
  }, [wishlistError]);

  // Handle Socket errors (e.g. Join Room blocked)
  useEffect(() => {
    if (socketError) {
      toast.error(socketError, { id: 'socket-error' });
      router.push('/rooms');
    }
  }, [socketError, router]);

  // Security Guard: Check if user came from the rooms list join flow
  useEffect(() => {
    const authFlag = sessionStorage.getItem(`ww_auth_${params.slug}`);
    if (!authFlag) {
      // Nếu không có flag và không phải host/admin thì chặn (sẽ check kỹ hơn khi room load xong)
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
  }, [params.slug]);

  const fetchLibraryData = async (
    page: number,
    search: string,
    isNewSearch = false
  ) => {
    if (isLoadingLib) return;
    setIsLoadingLib(true);
    try {
      const data = await getVideos(page, 10, search);
      if (isNewSearch) {
        setLibraryFilms(data.videos || []);
      } else {
        setLibraryFilms((prev) => [...prev, ...(data.videos || [])]);
      }
      setHasMoreLib(data.videos?.length === 10);
    } catch (error) {
      console.error('Fetch library error:', error);
    } finally {
      setIsLoadingLib(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLibraryData(1, '', true);
  }, []);

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setLibPage(1);
      fetchLibraryData(1, searchQuery, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (hasMoreLib && !isLoadingLib) {
      const nextPage = libPage + 1;
      setLibPage(nextPage);
      fetchLibraryData(nextPage, searchQuery);
    }
  };
  useEffect(() => {
    const fetchRoom = async () => {
      if (!params.slug) return;
      try {
        setLoading(true);
        let data;
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            params.slug
          );

        if (isUuid) {
          try {
            data = await getRoom(params.slug);
          } catch {
            data = await getRoomBySlug(params.slug);
          }
        } else {
          data = await getRoomBySlug(params.slug);
        }
        setRoom(data);

        // Fetch stream URL if video exists
        if (data.videoId) {
          try {
            const res = await api.get(`/videos/${data.videoId}/stream-url`);
            setStreamUrl(res.data.url);
          } catch (e) {
            console.error('Fetch stream URL error:', e);
          }
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          toast.error('Phòng không tồn tại hoặc đã bị đóng.');
          router.push('/rooms');
        } else {
          toast.error('Không thể tải thông tin phòng.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [params.slug, videoChangeTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine host
  useEffect(() => {
    if (room && user) {
      // Ưu tiên host từ socket (real-time), nếu chưa có thì dùng từ room data (initial)
      const effectiveHostId = currentHostId || room.hostId || room.host?.id;
      const isRoomHost = effectiveHostId === user.id;
      setIsHost(isRoomHost);

      // Sync initial hostId to socket state
      if (!currentHostId && (room.hostId || room.host?.id)) {
        setCurrentHostId(room.hostId || room.host?.id);
      }

      // Final security check once room/user is loaded
      const isAdmin = user.role === 'admin';
      const authFlag = sessionStorage.getItem(`ww_auth_${params.slug}`);

      if (!isRoomHost && !isAdmin && !authFlag) {
        toast.error('Bạn chỉ có thể tham gia phòng từ danh sách phòng chiếu.');
        router.push('/rooms');
      }
    }
  }, [room, user, currentHostId, setCurrentHostId, params.slug, router]);

  // Handle disappearing status messages in Chat tab
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.type === 'status') {
      setVisibleStatusIds((prev) => new Set(prev).add(lastMsg.id));
      const timer = setTimeout(() => {
        setVisibleStatusIds((prev) => {
          const next = new Set(prev);
          next.delete(lastMsg.id);
          return next;
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  useEffect(() => {
    if (room) {
      console.log('Room loaded in UI:', room);
      console.log('Video URL:', room.video?.videoUrl);

      // Fetch LiveKit Token
      const fetchLKToken = async () => {
        try {
          const res = await api.get(`/livekit/token?roomName=${room.id}`);
          setLiveKitToken(res.data.token);
        } catch (err) {
          console.error('Failed to fetch LiveKit token:', err);
        }
      };
      fetchLKToken();
    }
  }, [room]);

  useEffect(() => {
    if (chatScrollRef.current) {
      const timer = setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, activeTab, visibleStatusIds]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  const handleSync = () => {
    setIsSyncing(true);
    requestVideoSync(); // Thực hiện đồng bộ thật
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2000);
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  // Admin: Dừng phiên live từ chế độ giám sát
  const handleEndRoomAsAdmin = () => {
    if (!room) return;
    setIsEndRoomModalOpen(true);
  };

  const confirmEndRoomAsAdmin = async () => {
    if (!room) return;
    try {
      socket?.emit('endRoom', { roomId: room.id, reason: endRoomReason });
      await terminateRoom(room.id, endRoomReason);
      toast.success('Đã dừng phiên live vì vi phạm thành công!');
    } catch (err) {
      console.error('Admin end room error:', err);
      toast.error('Không thể dừng phiên live');
    } finally {
      setIsEndRoomModalOpen(false);
      router.push('/admin');
    }
  };

  const handleAddToRequest = (film: any) => {
    addVideoToWishlist({
      id: film.id,
      title: film.title,
      thumbnailUrl: film.thumbnailUrl,
      duration: film.duration,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.url) {
        sendMessage(res.data.url);
      }
    } catch (err) {
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchGifs = async (query = '') => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GIF_API_KEY || 'LIVDSRZULELA';
      const provider = process.env.NEXT_PUBLIC_GIF_PROVIDER || 'tenor';

      let endpoint = '';
      if (provider === 'tenor') {
        endpoint = query
          ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=20`
          : `https://tenor.googleapis.com/v2/featured?key=${apiKey}&limit=20`;
      } else {
        endpoint = query
          ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20&rating=g`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      let formattedGifs = [];
      if (provider === 'tenor') {
        formattedGifs = (data.results || []).map((g: any) => ({
          id: g.id,
          images: {
            fixed_height_small: { url: g.media_formats.tinygif.url },
            original: { url: g.media_formats.gif.url },
          },
        }));
      } else {
        formattedGifs = (data.data || []).map((g: any) => ({
          id: g.id,
          images: {
            fixed_height_small: { url: g.images.fixed_height_small.url },
            original: { url: g.images.original.url },
          },
        }));
      }
      setGifs(formattedGifs);
    } catch (err) {
      console.error('Fetch GIFs error:', err);
    }
  };

  useEffect(() => {
    if (isGifPickerOpen) {
      fetchGifs(gifSearch);
    }
  }, [isGifPickerOpen, gifSearch]);

  const onEmojiClick = (emojiData: any) => {
    setChatInput((prev) => prev + emojiData.emoji);
    setIsEmojiPickerOpen(false);
  };

  const [kickTarget, setKickTarget] = useState<string | null>(null);

  const handleKick = (name: string) => {
    setKickTarget(name);
  };

  const effectiveHostUsername = currentHostUsername || room?.host?.username;

  return (
    <main className="scrollbar-hide flex h-screen w-screen flex-col overflow-auto bg-[#0A0A0B] font-sans text-slate-100">
      {/* CUSTOM ROOM HEADER */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/5 bg-white/5 px-6">
        <Link href="/" className="flex items-center gap-4">
          <span className="font-sans text-lg font-black tracking-tighter text-white">
            WE <span className="text-[#C800DF]">WATCH</span>
          </span>
          <div className="h-4 w-px bg-white/20"></div>
          <h1 className="text-sm font-bold text-white">
            {loading
              ? 'Đang tải phòng...'
              : room
                ? room.title
                : 'Không tìm thấy phòng'}
          </h1>
          {room && (
            isMonitorMode ? (
              <span className="flex items-center gap-1 rounded-md bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400 uppercase">
                <ShieldAlert size={10} /> Giám sát
              </span>
            ) : (
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60 uppercase">
                {room.type}
              </span>
            )
          )}
        </Link>
        <div className="flex items-center gap-3">
          {/* Nút Dừng phiên live — chỉ hiện khi admin đang giám sát */}
          {isMonitorMode && (
            <button
              onClick={handleEndRoomAsAdmin}
              className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105 hover:bg-red-600"
            >
              <StopCircle size={14} /> Dừng phiên live
            </button>
          )}
          {/* Nút Back về Admin */}
          {isMonitorMode && (
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/10"
            >
              <ShieldAlert size={14} /> Admin
            </Link>
          )}

          {room?.type === 'private' && room?.password && !isMonitorMode && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#C800DF]/50 bg-[#C800DF]/10 px-3 py-1.5">
              <span className="font-mono text-xs font-black text-[#C800DF]">
                Mật khẩu: {room.password}
              </span>
            </div>
          )}

          {!isMonitorMode && (
            <>
              {!isHost && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold transition-all hover:bg-white/10 ${isSyncing ? 'animate-pulse' : ''}`}
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <div className="flex flex-col items-start leading-tight">
                    <span>
                      {isSyncing
                        ? 'Đang đồng bộ...'
                        : syncDone
                          ? 'Đã đồng bộ!'
                          : 'Đồng bộ với Host'}
                    </span>
                    {Math.abs(timeOffset) > 1.5 && !isSyncing && (
                      <span
                        className={`text-[9px] ${Math.abs(timeOffset) > 5 ? 'text-red-400' : 'text-yellow-400'}`}
                      >
                        Lệch: {timeOffset > 0 ? '+' : ''}
                        {timeOffset.toFixed(1)}s
                      </span>
                    )}
                  </div>
                </button>
              )}

              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/30"
              >
                <LogOut size={14} />
                {isHost ? 'Rời phòng' : 'Rời phòng'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Monitor Mode Banner */}
      {isMonitorMode && (
        <div className="flex h-8 flex-shrink-0 items-center gap-2 border-b border-orange-500/20 bg-orange-500/5 px-6">
          <ShieldAlert size={12} className="text-orange-400" />
          <span className="text-[11px] font-bold text-orange-400">
            Chế độ Giám sát Admin — Bạn đang theo dõi phòng này. Click vào tin nhắn để xoá hoặc cấm chat.
          </span>
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* LEFT SIDEBAR */}
        <div className="flex w-[280px] flex-shrink-0 flex-col gap-4 overflow-hidden">
          {/* List Video */}
          <div
            className={`glass flex flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5 transition-all duration-300 ${isFilmsOpen ? 'flex-1' : 'h-fit flex-none'}`}
          >
            <div
              className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 hover:bg-white/5"
              onClick={() => setIsFilmsOpen(!isFilmsOpen)}
            >
              <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                Thư viện video
              </h3>
              {isFilmsOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>

            <AnimatePresence initial={false}>
              {isFilmsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-1 flex-col overflow-hidden"
                >
                  {/* Search Bar */}
                  <div className="px-4 pt-4 pb-2">
                    <div className="relative">
                      <Search
                        className="absolute top-1/2 left-3 -translate-y-1/2 text-white/20"
                        size={14}
                      />
                      <input
                        type="text"
                        placeholder="Tìm phim..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-white/5 py-2 pr-4 pl-9 text-[11px] text-white placeholder-white/20 outline-none focus:border-[#C800DF]/50"
                      />
                    </div>
                  </div>

                  <div
                    className="scrollbar-hide flex flex-1 flex-col gap-3 overflow-y-auto p-4"
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      if (
                        target.scrollHeight - Math.ceil(target.scrollTop) <=
                        target.clientHeight + 10
                      ) {
                        handleLoadMore();
                      }
                    }}
                  >
                    {libraryFilms.map((film) => (
                      <div
                        key={film.id}
                        className="group relative flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-all hover:bg-white/5"
                      >
                        <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={
                              film.thumbnailUrl || MOCK_VIDEOS[0].thumbnailUrl
                            }
                            alt={film.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col overflow-hidden">
                          <span className="line-clamp-1 text-xs font-bold text-white">
                            {film.title}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {film.duration
                              ? Math.floor(film.duration / 60) + ' phút'
                              : '--'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddToRequest(film)}
                          className="text-[#C800DF] opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}

                    {isLoadingLib && (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-[#C800DF]" />
                      </div>
                    )}

                    {!isLoadingLib && libraryFilms.length === 0 && (
                      <div className="py-8 text-center text-[11px] font-bold text-white/20 italic">
                        Không tìm thấy phim nào
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Yêu cầu */}
          <div
            className={`glass flex flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5 transition-all duration-300 ${isQueueOpen ? 'flex-1' : 'h-fit flex-none'}`}
          >
            <div
              className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 hover:bg-white/5"
              onClick={() => setIsQueueOpen(!isQueueOpen)}
            >
              <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                Video đang chờ
              </h3>
              {isQueueOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
            <AnimatePresence initial={false}>
              {isQueueOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="scrollbar-hide flex flex-1 flex-col gap-4 overflow-y-auto p-4"
                >
                  {/* Current Video from DB */}
                  {room?.video && (
                    <div className="flex flex-col gap-2 rounded-2xl border border-[#C800DF]/30 bg-[#C800DF]/5 p-2">
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                        <Image
                          src={
                            room.video.thumbnailUrl ||
                            MOCK_VIDEOS[0].thumbnailUrl
                          }
                          alt={room.video.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <div className="absolute top-2 left-2 rounded-md bg-[#C800DF] px-2 py-0.5 text-[10px] font-black text-white uppercase shadow-lg">
                          Đang chiếu
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <h4 className="line-clamp-1 text-sm font-black text-white">
                          {room.video.title}
                        </h4>
                        <p className="mt-0.5 text-[10px] font-bold text-white/40">
                          Thời lượng:{' '}
                          {room.video.duration
                            ? Math.floor(room.video.duration / 60) + ' phút'
                            : '--'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="my-1 h-px w-full bg-white/5"></div>
                  <div className="pl-1 text-[10px] font-black tracking-widest text-white/20 uppercase">
                    Danh sách chờ ({socketWishlist.length})
                  </div>

                  {socketWishlist.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => setSelectedQueueVideo(vid)}
                      className="group relative flex cursor-pointer flex-col gap-2 rounded-xl p-2 transition-all hover:bg-white/5"
                    >
                      <div className="relative h-24 w-full overflow-hidden rounded-lg">
                        <Image
                          src={vid.thumbnailUrl || MOCK_VIDEOS[0].thumbnailUrl}
                          alt={vid.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeVideoFromWishlist(vid.id);
                          }}
                          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/80"
                        >
                          <UserMinus size={12} />
                        </button>
                      </div>
                      <div className="px-1">
                        <h4 className="line-clamp-1 text-xs font-bold text-white/90">
                          {vid.title}
                        </h4>
                        <p className="text-[10px] text-white/30">
                          bởi {vid.addedBy}
                        </p>
                      </div>
                    </div>
                  ))}

                  {socketWishlist.length === 0 && (
                    <div className="py-6 text-center text-[11px] font-bold text-white/20 italic">
                      Chưa có video nào trong hàng chờ
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cài đặt phòng (Host only) */}
          {isHost && (
            <div
              className={`glass flex flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5 transition-all duration-300 ${isSettingsOpen ? 'h-fit min-h-[140px]' : 'h-fit flex-none'}`}
            >
              <div
                className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 hover:bg-white/5"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <div className="flex items-center gap-2">
                  <Settings size={16} className="text-[#C800DF]" />
                  <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                    Cài đặt phòng
                  </h3>
                </div>
                {isSettingsOpen ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
              <AnimatePresence initial={false}>
                {isSettingsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-3 p-4"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-white/60">
                      <span>Phòng công khai</span>
                      <div className="h-4 w-8 rounded-full bg-white/10 p-0.5">
                        <div className="h-3 w-3 rounded-full bg-white/40"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium text-white/60">
                      <span>Chat tự do</span>
                      <div className="flex h-4 w-8 justify-end rounded-full bg-[#C800DF] p-0.5">
                        <div className="h-3 w-3 rounded-full bg-white"></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* CENTER: Video + Member Cams */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <div className="group relative aspect-video w-full overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-2xl">
            {streamUrl ? (
              <VideoPlayer
                src={streamUrl}
                poster={room?.video?.thumbnailUrl}
                onAction={sendVideoAction}
                lastAction={lastVideoAction}
                initialState={videoState}
                onOffsetChange={setTimeOffset}
                serverTimeOffset={serverTimeOffset}
              />
            ) : room?.video ? (
              <div className="flex h-full w-full animate-pulse items-center justify-center bg-white/5">
                <Loader2 className="h-10 w-10 animate-spin text-white/20" />
              </div>
            ) : (
              <Image
                src={MOCK_VIDEOS[0].backdrop}
                alt="Video"
                fill
                className="object-cover opacity-80"
              />
            )}
          </div>

          {/* Member Cameras Section (LiveKit) */}
          <div className="relative flex h-36 w-full flex-shrink-0 items-center gap-3 px-4">
            <LiveKitRoom
              roomName={room?.id || params.slug}
              token={liveKitToken}
              onDisconnect={() => setLiveKitToken('')}
            />
          </div>
        </div>

        {/* RIGHT SIDEBAR: Participants & Chat */}
        <div className="glass relative flex w-[340px] flex-shrink-0 flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5">
          {/* Participants Header (Collapsible) */}
          <div
            className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 transition-colors hover:bg-white/5"
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tighter text-white uppercase">
                Đang nghe
              </span>
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                {socketMembers.length} online
              </div>
            </div>
            <div className="rounded-lg border border-white/10 p-1 text-white/60">
              {isParticipantsOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {isParticipantsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: '33.33%', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-col overflow-hidden border-b border-white/5"
              >
                {!room ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-40">
                    <Loader2
                      className="animate-spin text-[#C800DF]"
                      size={20}
                    />
                    <span className="mt-2 text-[10px] font-black tracking-widest uppercase">
                      Đang tải...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="scrollbar-hide flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                      {socketMembers.map((m, idx) => (
                        <div
                          key={m.username || idx}
                          className="group flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-white/10">
                              {m.avatarUrl ? (
                                <Image
                                  src={m.avatarUrl}
                                  alt={m.username}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-white/10">
                                  <Users size={12} className="text-white/40" />
                                </div>
                              )}
                            </div>

                            <span className="text-sm font-medium text-white/80">
                              {m.username}
                              {m.username === user?.username && ' (Bạn)'}
                            </span>
                          </div>
                          {isHost && m.username !== effectiveHostUsername && (
                            <button
                              onClick={() => handleKick(m.username)}
                              className="text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:scale-125"
                            >
                              <UserMinus size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      {socketMembers.length === 0 && (
                        <div className="py-4 text-center text-[11px] text-white/20 italic">
                          Chưa có ai trong phòng
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Header with Tabs */}
          <div className="flex items-center justify-between border-b border-white/5 p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('chat')}
                className={`text-sm font-bold tracking-tighter uppercase transition-colors ${
                  activeTab === 'chat' ? 'text-white' : 'text-white/20'
                }`}
              >
                Trò chuyện
              </button>
              <div className="h-4 w-px bg-white/10"></div>
              <button
                onClick={() => setActiveTab('history')}
                className={`text-sm font-bold tracking-tighter uppercase transition-colors ${
                  activeTab === 'history' ? 'text-white' : 'text-white/20'
                }`}
              >
                Lịch sử
              </button>
            </div>
            <div className="flex gap-3 text-white/40">
              <Volume2 size={16} className="cursor-pointer hover:text-white" />
              <Maximize size={16} className="cursor-pointer hover:text-white" />
            </div>
          </div>

          {/* Floating Emojis Layer */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <AnimatePresence>
              {emojis.map((e) => (
                <motion.div
                  key={e.localId}
                  initial={{ opacity: 1, y: 80, x: `${e.x}%`, scale: 0.5 }}
                  animate={{ opacity: 0, y: -100, x: `${e.x}%`, scale: 1.8 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 4.5, ease: 'easeOut' }}
                  className="absolute bottom-16 text-2xl"
                >
                  {e.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Chat Messages / History */}
          {!room ? (
            <div className="flex flex-1 flex-col items-center justify-center opacity-40">
              <Loader2 className="animate-spin text-[#C800DF]" size={24} />
              <span className="mt-3 text-xs font-black tracking-widest uppercase">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : (
            <div
              ref={chatScrollRef}
              className="scrollbar-hide flex-1 space-y-4 overflow-y-auto p-4"
            >
              {messages
                .filter((msg) =>
                  activeTab === 'history'
                    ? msg.type === 'status'
                    : msg.type === 'msg' || visibleStatusIds.has(msg.id)
                )
                .map((msg) => (
                  <React.Fragment key={msg.id}>
                    {msg.type === 'status' ? (
                      <div className="flex w-full justify-center px-4 py-2">
                        <span className="line-clamp-1 max-w-[90%] text-center text-[12px] font-bold tracking-tight text-white/30 italic">
                          {msg.message}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`flex items-start gap-3 ${msg.username === user?.username ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full shadow-lg">
                          {msg.avatarUrl ? (
                            <Image
                              src={msg.avatarUrl}
                              alt={msg.username}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-white/10 text-xs font-black text-white/40">
                              {msg.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div
                          className={`flex flex-col ${msg.username === user?.username ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black tracking-tighter uppercase ${
                                msg.username === room?.host?.username
                                  ? 'text-[#C800DF]'
                                  : 'text-white/40'
                              }`}
                            >
                              {msg.username}
                              {msg.username === user?.username && ' (Bạn)'}
                            </span>
                          </div>
                          <div
                            className={`mt-0.5 px-3 py-1.5 text-[14px] leading-tight ${
                              msg.username === user?.username
                                ? 'rounded-2xl rounded-tr-none border border-[#C800DF]/20 bg-[#C800DF]/20 text-white shadow-[0_0_10px_rgba(200,0,223,0.1)]'
                                : 'text-white/90'
                            }`}
                          >
                            {msg.message?.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) ||
                            msg.message?.includes('cloudinary.com') ||
                            msg.message?.includes('giphy.com') ||
                            msg.message?.includes('tenor.com') ||
                            msg.message?.includes('tenor.googleapis.com') ? (
                              <div
                                className="relative mt-1 cursor-zoom-in overflow-hidden rounded-lg transition-opacity hover:opacity-90"
                                onClick={() => setSelectedImage(msg.message)}
                              >
                                <img
                                  src={msg.message}
                                  alt="Chat media"
                                  className="max-h-60 w-full object-contain"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              msg.message
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="border-t border-white/5 p-4" ref={chatContainerRef}>
            {/* Emoji Reactions */}
            <div className="mb-3 flex items-center justify-center gap-5">
              {[
                ['❤️', 'text-red-400'],
                ['👍', 'text-blue-400'],
                ['😂', 'text-yellow-400'],
                ['🔥', 'text-orange-400'],
              ].map(([emoji, cls]) => (
                <button
                  key={emoji}
                  onClick={() => sendEmoji(emoji)}
                  className={`${cls} transition-transform hover:scale-150 active:scale-125`}
                >
                  <span className="text-xl">{emoji}</span>
                </button>
              ))}
            </div>
            <form
              onSubmit={handleSendMessage}
              className="flex flex-col gap-2 rounded-[20px] border border-white/10 bg-black/60 p-2 shadow-inner"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn gì đó..."
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-white/20 outline-none"
              />
              <div className="relative flex items-center justify-between px-3 pb-2 text-white/40">
                <div className="flex items-center gap-4">
                  {/* Emoji Button */}
                  <div className="relative">
                    <Smile
                      size={18}
                      className={`cursor-pointer transition-colors hover:text-white ${isEmojiPickerOpen ? 'text-[#C800DF]' : ''}`}
                      onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    />
                    <AnimatePresence>
                      {isEmojiPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className="absolute bottom-10 left-0 z-50 shadow-2xl"
                        >
                          <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            theme={Theme.DARK}
                            lazyLoadEmojis={true}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* GIF Button */}
                  <div className="relative">
                    <span
                      onClick={() => setIsGifPickerOpen(!isGifPickerOpen)}
                      className={`cursor-pointer text-[11px] font-black tracking-widest uppercase transition-colors hover:text-white ${isGifPickerOpen ? 'text-[#C800DF]' : ''}`}
                    >
                      GIF
                    </span>
                    <AnimatePresence>
                      {isGifPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-10 left-0 z-50 flex h-80 w-72 flex-col rounded-2xl border border-white/10 bg-[#121214] p-3 shadow-2xl"
                        >
                          <input
                            type="text"
                            placeholder="Tìm GIF..."
                            value={gifSearch}
                            onChange={(e) => setGifSearch(e.target.value)}
                            className="mb-3 w-full rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs outline-none focus:border-[#C800DF]"
                            autoFocus
                          />
                          <div className="scrollbar-hide grid flex-1 grid-cols-2 gap-2 overflow-y-auto">
                            {gifs.map((gif: any) => (
                              <img
                                key={gif.id}
                                src={gif.images.fixed_height_small.url}
                                alt="gif"
                                className="h-24 w-full cursor-pointer rounded-lg object-cover transition-transform hover:scale-105"
                                onClick={() => {
                                  sendMessage(gif.images.original.url);
                                  setIsGifPickerOpen(false);
                                }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Image Button */}
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    {isUploading ? (
                      <Loader2
                        size={18}
                        className="animate-spin text-[#C800DF]"
                      />
                    ) : (
                      <ImageIcon
                        size={18}
                        className="cursor-pointer transition-colors hover:text-white"
                        onClick={() => fileInputRef.current?.click()}
                      />
                    )}
                  </div>

                  <Mic
                    size={18}
                    className="cursor-pointer transition-colors hover:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="text-[#C800DF] transition-all hover:scale-110 disabled:text-white/10"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Leave Confirmation Modal */}
      <AnimatePresence>
        {isLeaveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLeaveModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-[#121214] p-8 shadow-2xl"
            >
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                  <LogOut size={32} />
                </div>
              </div>
              <h3 className="mb-2 text-center text-xl font-bold text-white">
                Rời khỏi phòng?
              </h3>
              <p className="mb-8 text-center text-sm leading-relaxed text-white/60">
                Bạn có chắc chắn muốn rời khỏi phòng này? Các thông tin của bạn
                sẽ được xóa ngay lập tức.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push('/rooms')}
                  className="w-full rounded-2xl bg-red-500 py-4 text-sm font-bold text-white transition-all hover:bg-red-600 active:scale-95"
                >
                  Xác nhận rời phòng
                </button>
                <button
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="w-full rounded-2xl bg-white/5 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-95"
                >
                  Ở lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Queue Video Confirmation Popup */}
      <AnimatePresence>
        {selectedQueueVideo && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedQueueVideo(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1D] shadow-2xl"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={selectedQueueVideo.thumbnailUrl || MOCK_VIDEOS[0].thumbnailUrl}
                  alt={selectedQueueVideo.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1D] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="line-clamp-2 text-sm font-bold text-white">
                    {selectedQueueVideo.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-white/50">
                    Thêm bởi: {selectedQueueVideo.addedBy}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 p-4">
                {isHost ? (
                  <button
                    onClick={() => {
                      playVideoFromWishlist(selectedQueueVideo.id);
                      setSelectedQueueVideo(null);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C800DF] py-3 text-sm font-bold text-white transition-all hover:bg-[#a000b3] active:scale-95"
                  >
                    <Play size={16} fill="currentColor" />
                    Phát ngay
                  </button>
                ) : (
                  <p className="text-center text-xs text-white/40 italic">
                    Chỉ chủ phòng mới có thể chuyển phim
                  </p>
                )}
                <button
                  onClick={() => setSelectedQueueVideo(null)}
                  className="w-full rounded-xl bg-white/5 py-3 text-sm font-bold text-white/60 transition-all hover:bg-white/10 active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-[210] max-h-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/80"
              >
                <X size={20} />
              </button>
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="max-h-[85vh] w-full object-contain"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Queue Video Confirmation Popup */}
      <AnimatePresence>
        {selectedQueueVideo && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedQueueVideo(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1D] shadow-2xl"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={
                    selectedQueueVideo.thumbnailUrl ||
                    MOCK_VIDEOS[0].thumbnailUrl
                  }
                  alt={selectedQueueVideo.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1D] via-transparent to-transparent" />
                <div className="absolute right-3 bottom-3 left-3">
                  <h3 className="line-clamp-2 text-sm font-bold text-white">
                    {selectedQueueVideo.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-white/50">
                    Thêm bởi: {selectedQueueVideo.addedBy}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 p-4">
                {isHost ? (
                  <button
                    onClick={() => {
                      playVideoFromWishlist(selectedQueueVideo.id);
                      setSelectedQueueVideo(null);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C800DF] py-3 text-sm font-bold text-white transition-all hover:bg-[#a000b3] active:scale-95"
                  >
                    <Play size={16} fill="currentColor" />
                    Phát ngay
                  </button>
                ) : (
                  <p className="text-center text-xs text-white/40 italic">
                    Chỉ chủ phòng mới có thể chuyển phim
                  </p>
                )}
                <button
                  onClick={() => setSelectedQueueVideo(null)}
                  className="w-full rounded-xl bg-white/5 py-3 text-sm font-bold text-white/60 transition-all hover:bg-white/10 active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* End Room Reason Modal (Admin) */}
      <AnimatePresence>
        {isEndRoomModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEndRoomModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass relative w-full max-w-md overflow-hidden rounded-[32px] border border-red-500/30 bg-[#121214] p-8 shadow-2xl shadow-red-900/20"
            >
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                  <ShieldAlert size={32} />
                </div>
              </div>
              <h3 className="mb-2 text-center text-xl font-bold text-white">
                Dừng phiên live
              </h3>
              <p className="mb-6 text-center text-sm leading-relaxed text-white/60">
                Vui lòng chọn lý do dừng phiên live của phòng "{room?.title}".
                Người xem sẽ bị đưa ra ngoài ngay lập tức.
              </p>

              <div className="mb-6 flex flex-col gap-2">
                {[
                  'Vi phạm bản quyền',
                  'Nội dung bạo lực, máu me, đánh nhau',
                  'Nội dung 18+',
                  'Livestream cờ bạc, cá độ',
                  'Chửi bới cực đoan',
                  'Lý do khác',
                ].map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      endRoomReason === reason
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        endRoomReason === reason
                          ? 'border-red-500'
                          : 'border-white/40'
                      }`}
                    >
                      {endRoomReason === reason && (
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    <span className="text-sm text-white/90">{reason}</span>
                    <input
                      type="radio"
                      name="endRoomReason"
                      value={reason}
                      checked={endRoomReason === reason}
                      onChange={(e) => setEndRoomReason(e.target.value)}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmEndRoomAsAdmin}
                  className="w-full rounded-2xl bg-red-500 py-4 text-sm font-bold text-white transition-all hover:bg-red-600 active:scale-95"
                >
                  Xác nhận dừng phiên live
                </button>
                <button
                  onClick={() => setIsEndRoomModalOpen(false)}
                  className="w-full rounded-2xl bg-white/5 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-95"
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!kickTarget}
        onClose={() => setKickTarget(null)}
        onConfirm={() => kickTarget && kickMember(kickTarget)}
        title="Mời ra khỏi phòng"
        message={`Bạn có chắc chắn muốn mời ${kickTarget} ra khỏi phòng không?`}
        confirmText="Mời ra"
        type="danger"
      />
    </main>
  );
}

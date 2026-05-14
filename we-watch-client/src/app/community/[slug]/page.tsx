'use client';

import React, { useState, useEffect, useRef, use, useMemo } from 'react';
import { useSocket } from '@/src/hooks/useSocket';
import { useAuthStore } from '@/src/store/useAuthStore';
import { MOCK_VIDEOS, MOCK_ROOMS } from '@/src/constants/mockData';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Select from '@/src/components/ui/Select';
import {
  getRoom,
  getRoomBySlug,
  deleteRoom,
  terminateRoom,
} from '@/src/services/room';
import api from '@/src/lib/axios';
import VideoPlayer from '@/src/components/videos/VideoPlayer';
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  Send,
  Smile,
  Heart,
  ThumbsUp,
  Flame,
  Users,
  Share2,
  LogOut,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  UserMinus,
  Settings,
  Check,
  Copy,
  UserPlus,
  Loader2,
  RefreshCw,
  FileImage,
  X,
  MonitorPlay,
  ShieldAlert,
  StopCircle,
} from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function CommunityRoomPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = use(paramsPromise);
  const searchParams = useSearchParams();
  const isMonitorMode = searchParams.get('monitor') === 'true';
  const { user } = useAuthStore();
  const router = useRouter();
  // Flag ngăn các API call sau khi phòng đã kết thúc
  const isRoomEnded = useRef(false);

  // --- STATE DỬ LIỆU PHÒNG ---
  const [room, setRoom] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchRoom = async () => {
      if (!params.slug) return;
      if (isRoomEnded.current) return; // Phòng đã kết thúc, không fetch nữa
      try {
        setLoading(true);
        let data;
        try {
          data = await getRoom(params.slug);
        } catch {
          data = await getRoomBySlug(params.slug);
        }
        setRoom(data);

        if (data.videoId) {
          try {
            const res = await api.get(`/videos/${data.videoId}/stream-url`);
            setStreamUrl(res.data.url);
          } catch (e) {
            console.error('Fetch stream error:', e);
          }
        }
      } catch (err) {
        if (!isRoomEnded.current) console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [params.slug]);
  const [chatInput, setChatInput] = useState('');
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(true);

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isHost, setIsHost] = useState(false); // Sẽ được tính lại sau khi có room + user
  const [isHostMicOn, setIsHostMicOn] = useState(true);
  const [isHostCamOn, setIsHostCamOn] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [visibleStatusIds, setVisibleStatusIds] = useState<Set<string>>(
    new Set()
  );
  const [timeOffset, setTimeOffset] = useState(0);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isEndRoomModalOpen, setIsEndRoomModalOpen] = useState(false);
  const [endRoomReason, setEndRoomReason] = useState('Vi phạm bản quyền');

  // --- Admin Chat Moderation States ---
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    messageId: string;
    messageUsername: string;
  } | null>(null);
  const [muteDialog, setMuteDialog] = useState<{ username: string } | null>(
    null
  );
  const isAdmin = user?.role === 'admin';

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

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const {
    socket,
    members: socketMembers,
    messages,
    emojis,
    wishlist: socketWishlist,
    wishlistError,
    sendMessage,
    sendEmoji,
    socketError,
    currentHostId,
    setCurrentHostId,
    sendVideoAction,
    lastVideoAction,
    videoChangeTrigger,
    videoState,
    requestVideoSync,
    mutedUsers,
    chatMuteInfo,
    deleteMessage,
    muteChatUser,
    unmuteChatUser,
  } = useSocket(
    room?.id,
    user,
    undefined,
    (reason?: string, stoppedBy?: string, stoppedByRole?: string) => {
      // Đánh dấu phòng đã kết thúc → ngăn mọi API fetch tiếp theo
      isRoomEnded.current = true;

      // Dùng closure user & room đã có sẵn
      const amIHost = room?.host?.username === user?.username;

      if (amIHost && stoppedByRole === 'admin') {
        // Host bị admin dừng phiên → cần thông báo rõ ràng
        const reasonText = reason ? ` Lý do: "${reason}".` : '';
        toast.error(`Phiên live của bạn đã bị Admin dừng bởi ${reasonText}`, {
          duration: 6000,
          description: 'Bạn sẽ được chuyển về trang danh sách phòng.',
        });
        setTimeout(() => router.push('/rooms'), 3000);
      } else if (!amIHost) {
        // User bình thường nhận thông báo
        toast.info('Phiên live đã kết thúc.', {
          description:
            stoppedByRole === 'admin'
              ? `Phiên đã bị Admin dừng. Bạn sẽ được chuyển về danh sách phòng.`
              : 'Host đã dừng phiên. Bạn sẽ được chuyển về danh sách phòng.',
          duration: 4000,
        });
        setTimeout(() => router.push('/rooms'), 1500);
      } else {
        // Host tự dừng (stoppedByRole === 'host') — redirect ngay, đã biết việc mình làm
        router.push('/rooms');
      }
    }
  );

  const viewers = useMemo(() => {
    if (!socketMembers) return [];
    return socketMembers.filter((m) => m.username !== room?.host?.username);
  }, [socketMembers, room?.host?.username]);

  // Load room by slug (secondary — chỉ chạy để cập nhật host info khi user thay đổi)
  useEffect(() => {
    if (!params.slug) return;
    if (isRoomEnded.current) return; // Phòng đã kết thúc, không fetch nữa
    getRoomBySlug(params.slug)
      .then((data) => {
        setRoom(data);
        if (user && data?.host?.username === user.username) setIsHost(true);
      })
      .catch(() => {}); // 404 khi phòng bị xóa — im lặng
  }, [params.slug, user]);

  // Determine host
  useEffect(() => {
    if (room && user) {
      const effectiveHostId = currentHostId || room.hostId || room.host?.id;
      setIsHost(
        effectiveHostId === user.id || room.host?.username === user.username
      );

      if (!currentHostId && (room.hostId || room.host?.id)) {
        setCurrentHostId(room.hostId || room.host?.id);
      }

      // Final security check once room/user is loaded
      const isAdmin = user.role === 'admin';
      const authFlag = sessionStorage.getItem(`ww_auth_${params.slug}`);

      if (
        effectiveHostId !== user.id &&
        room.host?.username !== user.username &&
        !isAdmin &&
        !authFlag
      ) {
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

  // Tính isHost thật dựa trên user đang đăng nhập vs host của phòng
  useEffect(() => {
    if (room && user) {
      setIsHost(room.host?.username === user.username);
    }
  }, [room, user]);

  const handleLeaveRoom = () => {
    if (!room || !user) return;
    socket?.emit('leaveRoom', { roomId: room.id, username: user.username });
    router.push('/rooms');
  };

  const handleEndRoom = async () => {
    if (!room || !user) return;
    if (
      !window.confirm(
        'Bạn có chắc muốn kết thúc phòng? Tất cả người xem sẽ bị đưa ra ngoài.'
      )
    )
      return;
    try {
      // Notify tất cả người trong phòng trước
      socket?.emit('endRoom', { roomId: room.id });
      // Xóa phòng trên server
      await deleteRoom(room.id);
    } catch (err) {
      console.error('End room error:', err);
    } finally {
      // Host cũng redirect về /rooms
      router.push('/rooms');
    }
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const spawnEmoji = (emoji: string) => {
    sendEmoji(emoji);
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
      const apiKey = 'LIVDSRZULELA';
      const provider = 'tenor';

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

  const handleSync = () => {
    setIsSyncing(true);
    requestVideoSync();
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2000);
    }, 1000);
  };

  const handleKick = (name: string) => {
    alert(`Đã kích ${name} khỏi phòng cộng đồng!`);
  };

  const handleShareScreen = () => {
    alert('Bắt đầu chia sẻ màn hình...');
  };

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
            {loading ? 'Đang tải...' : room?.title || 'Phòng Cộng Đồng'}
          </h1>
          {isMonitorMode ? (
            <span className="flex items-center gap-1 rounded-md bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400 uppercase">
              <MonitorPlay size={10} /> Giám sát
            </span>
          ) : (
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60 uppercase">
              Community
            </span>
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
          {/* Các nút bình thường — ẩn khi giám sát */}
          {!isMonitorMode && (
            <>
              <button className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/10">
                <Share2 size={14} /> Chia sẻ
              </button>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold transition-all hover:bg-white/10 ${isSyncing ? 'animate-pulse' : ''}`}
              >
                <RefreshCw
                  size={14}
                  className={isSyncing ? 'animate-spin' : ''}
                />
                <div className="flex flex-col items-start leading-tight">
                  <span>
                    {isSyncing
                      ? 'Đang đồng bộ...'
                      : syncDone
                        ? 'Đã đồng bộ!'
                        : 'Đồng bộ với Host'}
                  </span>
                  {!isHost && Math.abs(timeOffset) > 1.5 && !isSyncing && (
                    <span
                      className={`text-[9px] ${Math.abs(timeOffset) > 5 ? 'text-red-400' : 'text-yellow-400'}`}
                    >
                      Lệch: {timeOffset > 0 ? '+' : ''}
                      {timeOffset.toFixed(1)}s
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/30"
              >
                <LogOut size={14} /> {isHost ? 'Kết thúc phòng' : 'Rời phòng'}
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
            Chế độ Giám sát Admin — Bạn đang theo dõi phòng này. Click vào tin
            nhắn để xoá hoặc cấm chat.
          </span>
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* LEFT SIDEBAR: Discovery & Settings */}
        <div className="flex w-[280px] flex-shrink-0 flex-col gap-4 overflow-hidden">
          {/* Đang xem (Moved from Right Sidebar) */}
          <div className="glass relative flex flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5">
            <div
              className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 transition-colors hover:bg-white/5"
              onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tighter text-white uppercase">
                  Thành viên
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
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="scrollbar-hide flex max-h-[300px] flex-col gap-3 overflow-y-auto p-4">
                    {/* Host - lấy từ dữ liệu phòng thật */}
                    {room?.host && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-[#C800DF]">
                            {room.host.avatarUrl ? (
                              <Image
                                src={room.host.avatarUrl}
                                alt={room.host.username}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[#C800DF]/20 text-xs font-bold text-[#C800DF]">
                                {room.host.username?.[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-bold text-white">
                            {room.host.username}
                          </span>
                        </div>
                        <span className="rounded-full border border-[#C800DF] px-2 py-0.5 text-[10px] font-bold text-[#C800DF]">
                          Host
                        </span>
                      </div>
                    )}
                    {/* Viewers từ socket thật - không tính host */}
                    {viewers.map((m, idx) => (
                      <div
                        key={m.username || idx}
                        className="group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 overflow-hidden rounded-full opacity-80">
                            {m.avatarUrl ? (
                              <Image
                                src={m.avatarUrl}
                                alt={m.username}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60">
                                {m.username?.[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-white/70">
                            {m.username}
                            {m.username === user?.username && ' (Bạn)'}
                          </span>
                        </div>
                        {isHost && m.username !== room?.host?.username && (
                          <button
                            onClick={() => handleKick(m.username)}
                            className="animate-fade-in text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:scale-125"
                          >
                            <UserMinus size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {viewers.length === 0 && (
                      <p className="text-center text-xs text-white/30 italic">
                        Chưa có ai trong phòng
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sub-group Invite Link (Watch with friends) */}
          {!isHost && (
            <div
              className={`glass flex flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5 transition-all duration-300 ${isInviteOpen ? 'flex-1' : 'h-fit flex-none'}`}
            >
              <div
                className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 hover:bg-white/5"
                onClick={() => setIsInviteOpen(!isInviteOpen)}
              >
                <div className="flex items-center gap-2">
                  <UserPlus size={16} className="text-[#00E5FF]" />
                  <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                    Mời bạn bè
                  </h3>
                </div>
                {isInviteOpen ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
              <AnimatePresence initial={false}>
                {isInviteOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-4 p-4"
                  >
                    <p className="text-[11px] font-bold text-white/40">
                      Vui lòng mời bạn bè tham gia thông qua danh sách phòng
                      chiếu tại trang chủ.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Live Room Settings (Host only) */}
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
                    Cài đặt Live
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
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black tracking-widest text-white/30 uppercase">
                        Chế độ phòng
                      </span>
                      <Select<'community' | 'age_limit'>
                        value={'community'}
                        onChange={() => {}}
                        options={[
                          { value: 'community', label: 'Cộng đồng (Mặc định)' },
                          { value: 'age_limit', label: 'Giới hạn độ tuổi' },
                        ]}
                        buttonClassName="rounded-lg px-3 py-2 text-xs font-bold"
                        menuClassName="rounded-lg"
                        optionClassName="text-xs"
                        disabled
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium text-white/60">
                      <span>Phê duyệt chat</span>
                      <div className="flex h-4 w-8 justify-end rounded-full bg-[#C800DF] p-0.5">
                        <div className="h-3 w-3 rounded-full bg-white shadow-sm"></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: Video + Share Screen */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Video Player Section */}
          <div className="group relative flex-1 overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-2xl">
            {streamUrl ? (
              <VideoPlayer src={streamUrl} poster={room?.video?.thumbnailUrl} />
            ) : room?.video ? (
              <div className="flex h-full w-full animate-pulse items-center justify-center bg-white/5">
                <span className="font-bold text-white/40">
                  Đang tải video...
                </span>
              </div>
            ) : (
              <Image
                src={room?.image || MOCK_VIDEOS[0].backdrop}
                alt="Banner"
                fill
                unoptimized
                className="object-cover opacity-80"
              />
            )}

            {/* Top Left Status */}
            <div className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-white">Live</span>
              <span className="mx-1 h-3 w-px bg-white/20"></span>
              <Users size={12} className="text-white/60" />
              <span className="text-xs font-bold text-white">
                {viewers.length}
              </span>
            </div>
          </div>

          {/* Share Screen Button (Host View) */}
          <div className="glass flex h-16 flex-shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 p-3">
            {isHost ? (
              <button
                onClick={handleShareScreen}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-6 py-2.5 text-sm font-black tracking-widest text-white uppercase transition-all hover:bg-[#C800DF] hover:shadow-[0_0_20px_rgba(200,0,223,0.3)] active:scale-95"
              >
                <ScreenShare size={18} />
                Chia sẻ màn hình
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0A0A0B] bg-white/10 text-[10px] font-bold"
                    >
                      +{i}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-white/60">
                  Và {Math.max(0, socketMembers.length - 3)} người khác đang xem
                </span>
              </div>
            )}
          </div>

          {/* MAIN PLAYER AREA */}
          <div className="glass relative flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-black/60 shadow-2xl">
            {room?.video?.streamUrl ? (
              <VideoPlayer
                src={room.video.streamUrl}
                poster={room.video.thumbnailUrl}
                onAction={sendVideoAction}
                lastAction={lastVideoAction}
                initialState={videoState}
                onOffsetChange={setTimeOffset}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-white/5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-[#C800DF]">
                  <Play size={40} fill="currentColor" className="ml-1" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white">
                    Chưa có video
                  </h3>
                  <p className="text-sm text-white/40">
                    Vui lòng chọn phim từ thư viện để bắt đầu
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Chat Only */}
        <div className="glass relative flex w-[340px] flex-shrink-0 flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5">
          {/* Host Video Section (Top of Right Sidebar) */}
          <div className="relative aspect-video w-full overflow-hidden border-b border-white/5 bg-black/40">
            {isHostCamOn ? (
              <Image
                src="https://i.pravatar.cc/400?u=1"
                alt="Host Video"
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white/5">
                <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/10 shadow-2xl">
                  <Image
                    src="https://i.pravatar.cc/150?u=1"
                    alt="Host Avatar"
                    fill
                    unoptimized
                    className="object-cover grayscale"
                  />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase">
                  Camera Off
                </span>
              </div>
            )}

            {/* Host Name Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-md">
              <div className="h-1.5 w-1.5 rounded-full bg-[#C800DF]"></div>
              <span className="text-[10px] font-bold text-white">
                Host: {room?.host?.username || 'Đang tải...'}
              </span>
            </div>

            {/* Host Controls (Only visible to Host) */}
            {isHost ? (
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  onClick={() => setIsHostMicOn(!isHostMicOn)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${isHostMicOn ? 'bg-white/10 text-white' : 'bg-red-500 text-white'}`}
                >
                  {isHostMicOn ? <Mic size={14} /> : <MicOff size={14} />}
                </button>
                <button
                  onClick={() => setIsHostCamOn(!isHostCamOn)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${isHostCamOn ? 'bg-white/10 text-white' : 'bg-red-500 text-white'}`}
                >
                  {isHostCamOn ? <Video size={14} /> : <VideoOff size={14} />}
                </button>
              </div>
            ) : (
              /* Viewer View Status Icons */
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full bg-black/40 ${!isHostMicOn ? 'text-red-400' : 'text-white/60'}`}
                >
                  {isHostMicOn ? <Mic size={10} /> : <MicOff size={10} />}
                </div>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full bg-black/40 ${!isHostCamOn ? 'text-red-400' : 'text-white/60'}`}
                >
                  {isHostCamOn ? <Video size={10} /> : <VideoOff size={10} />}
                </div>
              </div>
            )}
          </div>

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

          {/* Chat Messages */}
          {!room ? (
            <div className="flex flex-1 flex-col items-center justify-center opacity-40">
              <Loader2 className="animate-spin text-[#C800DF]" size={24} />
              <span className="mt-3 text-xs font-black tracking-widest uppercase">
                Đang tải cuộc trò chuyện...
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
                        className={`group relative flex items-start gap-3 ${msg.username === user?.username ? 'flex-row-reverse' : 'flex-row'}`}
                        onClick={(e) => {
                          // Chỉ admin hoặc host mới có quyền
                          if (!isAdmin && !isHost) return;
                          // Không thể tự cấm/xóa tin nhắn của chính mình
                          if (msg.username === user?.username) return;
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            messageId: msg.id,
                            messageUsername: msg.username,
                          });
                        }}
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
                            {/* Badge muted - chỉ admin/host thấy */}
                            {(isAdmin || isHost) &&
                              mutedUsers[msg.username] &&
                              Date.now() < mutedUsers[msg.username] && (
                                <span className="flex items-center gap-0.5 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
                                  🔇 Cấm chat
                                </span>
                              )}
                          </div>
                          <div
                            className={`mt-0.5 px-3 py-1.5 text-[14px] leading-tight ${
                              msg.username === user?.username
                                ? 'rounded-2xl rounded-tr-none border border-[#C800DF]/20 bg-[#C800DF]/20 text-white shadow-[0_0_10px_rgba(200,0,223,0.1)]'
                                : 'text-white/90'
                            }`}
                          >
                            {msg.message.match(/\.(jpeg|jpg|gif|png|webp)$/i) ||
                            msg.message.includes('cloudinary.com') ||
                            msg.message.includes('giphy.com') ||
                            msg.message.includes('tenor.com') ? (
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

          {/* Floating Emojis Layer */}
          <div className="pointer-events-none absolute top-32 right-0 bottom-32 left-0 overflow-hidden">
            <AnimatePresence>
              {emojis.map((e) => (
                <motion.div
                  key={e.localId}
                  initial={{ opacity: 1, y: 100, x: `${e.x}%`, scale: 0.5 }}
                  animate={{ opacity: 0, y: -100, x: `${e.x}%`, scale: 1.5 }}
                  transition={{ duration: 4.5, ease: 'easeOut' }}
                  className="absolute bottom-0 text-2xl"
                >
                  {e.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Chat Input & Reactions */}
          <div
            className="border-t border-white/5 bg-black/20 p-4"
            ref={chatContainerRef}
          >
            <div className="mb-3 flex items-center justify-center gap-5">
              <button
                onClick={() => spawnEmoji('❤️')}
                className="text-red-400 transition-transform hover:scale-150"
              >
                <Heart size={20} fill="currentColor" />
              </button>
              <button
                onClick={() => spawnEmoji('👍')}
                className="text-blue-400 transition-transform hover:scale-150"
              >
                <ThumbsUp size={20} fill="currentColor" />
              </button>
              <button
                onClick={() => spawnEmoji('😂')}
                className="text-yellow-400 transition-transform hover:scale-150"
              >
                <Smile size={20} fill="currentColor" />
              </button>
              <button
                onClick={() => spawnEmoji('🔥')}
                className="text-orange-400 transition-transform hover:scale-150"
              >
                <Flame size={20} fill="currentColor" />
              </button>
            </div>
            <form
              onSubmit={handleSendMessage}
              className="flex flex-col gap-2 rounded-[20px] border border-white/10 bg-black/40 p-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn gì đó..."
                className="w-full bg-transparent px-3 py-1.5 text-sm text-white placeholder-white/20 outline-none"
              />
              <div className="relative flex items-center justify-between px-3 pb-1 text-white/40">
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
                      className={`cursor-pointer text-[10px] font-black uppercase transition-colors hover:text-white ${isGifPickerOpen ? 'text-[#C800DF]' : ''}`}
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
                  className="text-[#C800DF] transition-all hover:scale-110 disabled:opacity-20"
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

      {/* ── Admin Context Menu ────────────────────────────────────────────── */}
      <AnimatePresence>
        {contextMenu && (
          <>
            {/* Backdrop đóng menu khi click ra ngoài */}
            <div
              className="fixed inset-0 z-[300]"
              onClick={() => setContextMenu(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.12 }}
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-[301] min-w-[190px] overflow-hidden rounded-xl border border-white/10 bg-[#1a1a2e]/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
            >
              {/* Header */}
              <div className="border-b border-white/10 px-3 py-2">
                <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
                  Quản lý tin nhắn
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-white/60">
                  @{contextMenu.messageUsername}
                </p>
              </div>

              {/* Xóa tin nhắn */}
              <button
                onClick={() => {
                  deleteMessage(contextMenu.messageId);
                  setContextMenu(null);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-red-400 transition-colors hover:bg-red-500/10"
              >
                <span className="text-base">🗑️</span>
                Xóa tin nhắn này
              </button>

              {/* Cấm chat - chỉ hiện nếu không phải tin nhắn của chính mình */}
              {contextMenu.messageUsername !== user?.username && (
                <>
                  <div className="mx-3 border-t border-white/5" />
                  {mutedUsers[contextMenu.messageUsername] &&
                  Date.now() < mutedUsers[contextMenu.messageUsername] ? (
                    <button
                      onClick={() => {
                        unmuteChatUser(contextMenu.messageUsername);
                        setContextMenu(null);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-green-400 transition-colors hover:bg-green-500/10"
                    >
                      <span className="text-base">🔊</span>
                      Bỏ cấm chat
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMuteDialog({
                          username: contextMenu.messageUsername,
                        });
                        setContextMenu(null);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-orange-400 transition-colors hover:bg-orange-500/10"
                    >
                      <span className="text-base">🔇</span>
                      Cấm chat
                    </button>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mute Duration Dialog ──────────────────────────────────────────── */}
      <AnimatePresence>
        {muteDialog && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMuteDialog(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative z-[401] w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a2e] shadow-2xl"
            >
              {/* Header */}
              <div className="border-b border-white/10 bg-[#C800DF]/10 p-4">
                <h3 className="text-[15px] font-bold text-white">
                  🔇 Cấm chat
                </h3>
                <p className="mt-1 text-[12px] text-white/50">
                  Chọn thời gian cấm cho{' '}
                  <span className="font-bold text-orange-400">
                    @{muteDialog.username}
                  </span>
                </p>
              </div>

              {/* Các lựa chọn thời gian */}
              <div className="grid grid-cols-2 gap-2 p-4">
                {[
                  {
                    label: '5 phút',
                    minutes: 5,
                    color:
                      'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
                  },
                  {
                    label: '10 phút',
                    minutes: 10,
                    color:
                      'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
                  },
                  {
                    label: '30 phút',
                    minutes: 30,
                    color:
                      'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
                  },
                  {
                    label: '1 tiếng',
                    minutes: 60,
                    color:
                      'from-red-700/30 to-red-800/20 border-red-700/40 text-red-300',
                  },
                ].map(({ label, minutes, color }) => (
                  <button
                    key={minutes}
                    onClick={() => {
                      muteChatUser(muteDialog.username, minutes);
                      setMuteDialog(null);
                    }}
                    className={`rounded-xl border bg-gradient-to-br ${color} flex flex-col items-center justify-center gap-1 p-3 font-bold transition-all hover:scale-105 hover:shadow-lg`}
                  >
                    <span className="text-[22px]">⏱️</span>
                    <span className="text-[13px]">{label}</span>
                  </button>
                ))}
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={() => setMuteDialog(null)}
                  className="w-full rounded-xl border border-white/10 py-2 text-[13px] text-white/50 transition-colors hover:bg-white/5"
                >
                  Huỷ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Toast thông báo bị mute (chỉ user bị cấm thấy) ──────────────── */}
      <AnimatePresence>
        {chatMuteInfo && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-24 left-1/2 z-[350] -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-[#1a1a2e]/95 px-4 py-3 shadow-2xl shadow-red-900/40 backdrop-blur-xl">
              <span className="text-2xl">🔇</span>
              <div>
                <p className="text-[13px] font-bold text-red-400">
                  Bạn đang bị cấm chat
                </p>
                <p className="text-[11px] text-white/50">
                  Còn {chatMuteInfo.remainingMinutes} phút · Cấm bởi{' '}
                  <span className="text-white/80">@{chatMuteInfo.mutedBy}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

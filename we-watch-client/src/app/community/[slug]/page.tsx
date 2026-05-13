'use client';

import React, { useState, useEffect, useRef, use, useMemo } from 'react';
import { useSocket } from '@/src/hooks/useSocket';
import { useAuthStore } from '@/src/store/useAuthStore';
import { MOCK_VIDEOS, MOCK_ROOMS } from '@/src/constants/mockData';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Select from '@/src/components/ui/Select';
import { getRoom, getRoomBySlug, deleteRoom } from '@/src/services/room';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function CommunityRoomPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = use(paramsPromise);
  const { user } = useAuthStore();
  const router = useRouter();

  // --- STATE DỬ LIỆU PHÒNG ---
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchRoom = async () => {
      if (!params.slug) return;
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
        console.error(err);
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
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

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
  } = useSocket(
    room?.id,
    user,
    undefined,
    () => router.push('/rooms')
  );

  const viewers = useMemo(() => {
    if (!socketMembers) return [];
    return socketMembers.filter(
      (m) => m.username !== room?.host?.username
    );
  }, [socketMembers, room?.host?.username]);

  // Load room by slug
  useEffect(() => {
    if (!params.slug) return;
    getRoomBySlug(params.slug)
      .then((data) => {
        setRoom(data);
        if (user && data?.host?.username === user.username) setIsHost(true);
      })
      .catch(() => {});
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
    if (!window.confirm('Bạn có chắc muốn kết thúc phòng? Tất cả người xem sẽ bị đưa ra ngoài.')) return;
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const spawnEmoji = (emoji: string) => {
    sendEmoji(emoji);
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
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60 uppercase">
            Community
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/10">
            <Share2 size={14} /> Chia sẻ
          </button>
          <button
            onClick={isHost ? handleEndRoom : handleLeaveRoom}
            className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/30"
          >
            <LogOut size={14} /> {isHost ? 'Kết thúc phòng' : 'Rời phòng'}
          </button>
        </div>
      </div>

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
                            className="text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:scale-125 animate-fade-in"
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
                <span className="text-white/40 font-bold">Đang tải video...</span>
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
                          <p
                            className={`mt-0.5 px-3 py-1.5 text-[14px] leading-tight ${
                              msg.username === user?.username
                                ? 'rounded-2xl rounded-tr-none border border-[#C800DF]/20 bg-[#C800DF]/20 text-white shadow-[0_0_10px_rgba(200,0,223,0.1)]'
                                : 'text-white/90'
                            }`}
                          >
                            {msg.message}
                          </p>
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
          <div className="border-t border-white/5 bg-black/20 p-4">
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
              <div className="flex items-center justify-between px-3 pb-1 text-white/40">
                <div className="flex gap-4">
                  <Smile
                    size={18}
                    className="cursor-pointer transition-colors hover:text-white"
                  />
                  <span className="cursor-pointer text-[10px] font-black uppercase transition-colors hover:text-white">
                    GIF
                  </span>
                  <ImageIcon
                    size={18}
                    className="cursor-pointer transition-colors hover:text-white"
                  />
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
    </main>
  );
}

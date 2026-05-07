'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MOCK_VIDEOS, MOCK_ROOMS } from '@/src/constants/mockData';
import Link from 'next/link';
import Image from 'next/image';
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
  Link as LinkIcon,
  Check,
  Copy,
  UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_CHAT = [
  {
    id: 1,
    user: 'Trung',
    role: 'host',
    avatar: 'https://i.pravatar.cc/150?u=1',
    message: 'Chào mừng mọi người đến với phòng phim nhé!',
    type: 'msg',
  },
  {
    id: 2,
    user: 'AnhKhoa',
    role: 'viewer',
    avatar: 'https://i.pravatar.cc/150?u=2',
    message: 'Phim nét quá host ơi',
    type: 'msg',
  },
  {
    id: 3,
    user: 'system',
    avatar: '',
    message: 'Trung đang tua video...',
    type: 'status',
  },
  {
    id: 4,
    user: 'LinhChi',
    role: 'viewer',
    avatar: 'https://i.pravatar.cc/150?u=3',
    message: 'Đợi mãi mới đến tập này',
    type: 'msg',
  },
];

const MOCK_PARTICIPANTS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  name: `Viewer ${i + 1}`,
  avatar: `https://i.pravatar.cc/150?u=${i + 10}`,
  role: 'viewer',
}));

export default function CommunityRoomPage({
  params,
}: {
  params: { slug: string };
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewersCount, setViewersCount] = useState(128);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState(MOCK_CHAT);
  const [emojis, setEmojis] = useState<
    { id: number; emoji: string; x: number }[]
  >([]);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(true);

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isHost, setIsHost] = useState(true); // Mocking host view
  const [isHostMicOn, setIsHostMicOn] = useState(true);
  const [isHostCamOn, setIsHostCamOn] = useState(true);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setViewersCount((prev) => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: 'Me',
        role: 'viewer',
        avatar: 'https://i.pravatar.cc/150?u=99',
        message: chatInput,
        type: 'msg',
      },
    ]);
    setChatInput('');
  };

  const spawnEmoji = (emoji: string) => {
    const newEmoji = { id: Date.now(), emoji, x: Math.random() * 80 + 10 };
    setEmojis((prev) => [...prev, newEmoji]);
    setTimeout(() => {
      setEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 2000);
  };

  const handleKick = (name: string) => {
    alert(`Đã kích ${name} khỏi phòng cộng đồng!`);
  };

  const handleShareScreen = () => {
    alert('Bắt đầu chia sẻ màn hình...');
  };

  const generateInviteLink = () => {
    const randomChars = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    setInviteLink(`wewatch.app/join/${randomChars}`);
  };

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
            Phòng Anime - Overlord Marathon
          </h1>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60 uppercase">
            Community
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHost(!isHost)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${isHost ? 'bg-[#C800DF]/20 text-[#C800DF]' : 'bg-white/5 text-white/60'}`}
          >
            {isHost ? 'View as Host' : 'View as Viewer'}
          </button>
          <button className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/10">
            <Share2 size={14} /> Chia sẻ
          </button>
          <button className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/30">
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
                  {viewersCount} online
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
                    {/* Host */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-[#C800DF]">
                          <Image
                            src="https://i.pravatar.cc/150?u=1"
                            alt="Host"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <span className="text-sm font-bold text-white">
                          Trung
                        </span>
                      </div>
                      <span className="rounded-full border border-[#C800DF] px-2 py-0.5 text-[10px] font-bold text-[#C800DF]">
                        Host
                      </span>
                    </div>
                    {/* Other Viewers */}
                    {MOCK_PARTICIPANTS.slice(0, 8).map((m) => (
                      <div
                        key={m.id}
                        className="group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 overflow-hidden rounded-full opacity-60">
                            <Image
                              src={m.avatar}
                              alt={m.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium text-white/60">
                            {m.name}
                          </span>
                        </div>
                        {isHost && (
                          <button
                            onClick={() => handleKick(m.name)}
                            className="text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:scale-125"
                          >
                            <UserMinus size={14} />
                          </button>
                        )}
                      </div>
                    ))}
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
                    <p className="text-[11px] leading-relaxed text-white/40">
                      Bạn bè tham gia qua link này sẽ được vào nhóm chat & video
                      call riêng với bạn.
                    </p>

                    {inviteLink ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between rounded-xl bg-black/40 p-3 ring-1 ring-white/5">
                          <span className="font-mono text-xs font-black text-[#00E5FF]">
                            {inviteLink}
                          </span>
                          <button
                            onClick={copyLink}
                            className="text-white/40 transition-colors hover:text-white"
                          >
                            {isCopied ? (
                              <Check size={16} className="text-green-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-[#00E5FF]/10 py-2 text-[10px] font-bold text-[#00E5FF]">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00E5FF]"></span>
                          Link có hiệu lực trong 24h
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={generateInviteLink}
                        className="group relative overflow-hidden rounded-xl bg-[#00E5FF] px-4 py-3 text-xs font-black tracking-widest text-black uppercase transition-all hover:scale-[1.02] active:scale-95"
                      >
                        Tạo link mời nhóm riêng
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>
                      </button>
                    )}
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
                      <select className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white outline-none">
                        <option>Cộng đồng (Mặc định)</option>
                        <option>Giới hạn độ tuổi</option>
                      </select>
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
            <Image
              src={MOCK_VIDEOS[0].backdrop}
              alt="Video"
              fill
              unoptimized
              className="object-cover opacity-80"
            />

            {/* Top Left Status */}
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-white">Live</span>
              <span className="mx-1 h-3 w-px bg-white/20"></span>
              <Users size={12} className="text-white/60" />
              <span className="text-xs font-bold text-white">
                {viewersCount}
              </span>
            </div>

            {/* Video Controls (Hover) */}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex flex-col gap-2 p-4">
                <div className="group/seek relative h-1.5 w-full cursor-pointer rounded-full bg-white/20">
                  <div className="absolute h-full w-1/3 rounded-full bg-[#C800DF] transition-all"></div>
                  <div className="absolute top-1/2 left-1/3 h-3 w-3 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-white shadow-lg transition-transform group-hover/seek:scale-100"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white transition-colors hover:text-[#C800DF]"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button className="text-white transition-colors hover:text-[#C800DF]">
                      <Volume2 size={20} />
                    </button>
                    <span className="text-xs font-medium text-white/80">
                      24:12 / 1:46:00
                    </span>
                  </div>
                  <button className="text-white transition-colors hover:text-[#C800DF]">
                    <Maximize size={20} />
                  </button>
                </div>
              </div>
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
                  Và {viewersCount - 3} người khác đang xem
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
                Host: Trung
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

          <div className="border-b border-white/5 p-4">
            <span className="text-sm font-bold tracking-tighter text-white uppercase">
              Trò chuyện trực tiếp
            </span>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatScrollRef}
            className="scrollbar-hide flex-1 space-y-4 overflow-y-auto p-4"
          >
            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                {msg.type === 'status' ? (
                  <div className="flex w-full justify-center py-2">
                    <span className="text-[13px] font-medium text-white/30 italic">
                      {msg.message}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full shadow-lg">
                      <Image
                        src={msg.avatar}
                        alt={msg.user}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black tracking-tighter uppercase ${msg.role === 'host' ? 'text-[#C800DF]' : 'text-white/40'}`}
                        >
                          {msg.user}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[14px] leading-tight text-white/90">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Floating Emojis Layer */}
          <div className="pointer-events-none absolute top-32 right-0 bottom-32 left-0 overflow-hidden">
            <AnimatePresence>
              {emojis.map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 1, y: 100, x: `${e.x}%`, scale: 0.5 }}
                  animate={{ opacity: 0, y: -100, x: `${e.x}%`, scale: 1.5 }}
                  transition={{ duration: 2, ease: 'easeOut' }}
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
    </main>
  );
}

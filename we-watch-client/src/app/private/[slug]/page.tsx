'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { MOCK_VIDEOS, MOCK_FILMS } from '@/src/constants/mockData';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getRoom, getRoomBySlug } from '@/src/services/room';
import { getVideos } from '@/src/services/video';
import { toast } from 'sonner';
import { useSocket } from '@/src/hooks/useSocket';
import { useAuthStore } from '@/src/store/useAuthStore';
import LiveKitRoom from '@/src/components/rooms/LiveKitRoom';
import api from '@/src/lib/axios';
import VideoPlayer from '@/src/components/videos/VideoPlayer';

const MOCK_MEMBERS = [
  {
    id: 1,
    name: 'trungne',
    role: 'host',
    avatar:
      'https://scontent.fhan2-3.fna.fbcdn.net/v/t39.30808-6/475181263_1169410031565475_7208810035280146740_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeGghEgzthmpLdAbI3DtlAVGMK3gCKxL64IwreAIrEvrgmJWaW26DaJNbc0RpWi7LzdFOlgWRsPNLDfsqfnD2LYs&_nc_ohc=5JyaQmWL-BQQ7kNvwEixxEe&_nc_oc=AdovOt-8DJrAV25RKj9zJTXodiFBW7tA9wz1zVoazWE1dFpuCYgoeY36KHC1yp3FrJg&_nc_zt=23&_nc_ht=scontent.fhan2-3.fna&_nc_gid=HQ7JvPqoGMHnF850t3DL_Q&_nc_ss=7b2a8&oh=00_Af4oQbLZrET-lmo1dMrfgmtUytYbDIe5H6CVkhB5IeumUA&oe=6A01DD16',
    micOn: true,
    camOn: true,
  },
  {
    id: 2,
    name: 'ronalĐộ',
    role: 'viewer',
    avatar:
      'https://scontent.fhan20-1.fna.fbcdn.net/v/t51.82787-15/683765285_18728236822056421_8719514952349244206_n.jpg?stp=dst-jpg_s590x590_tt6&_nc_cat=1&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeF5PicVqkdxpDjpXVdx57VBxklhi_0k1EXGSWGL_STURduPGmkV1VwG9F4ptQKFNvqX315jERKq0JCr10IKa7E-&_nc_ohc=IlY_ZS9ZUA0Q7kNvwGO3OtO&_nc_oc=Adr9pMxnYCA3Q3h_WmKpWaH1-UAMNJ_H19wiQpLPo-4TUFvjlvm6EImg0ZYyRblE5PM&_nc_zt=23&_nc_ht=scontent.fhan20-1.fna&_nc_gid=wCEx13oTMFSxGnvKU_Ydaw&_nc_ss=7b2a8&oh=00_Af5f1nABeQR_0l6BExkphy7lItb968zyiNFf6Snki2xY5A&oe=6A01E9D8',
    micOn: false,
    camOn: true,
  },
  {
    id: 3,
    name: 'Mét xi',
    role: 'viewer',
    avatar:
      'https://scontent.fhan2-3.fna.fbcdn.net/v/t1.6435-9/199280580_345469096944687_1072097131842973013_n.jpg?stp=dst-jpg_s960x960_tt6&_nc_cat=108&ccb=1-7&_nc_sid=2a1932&_nc_eui2=AeEzzuvBgrfekVx9kugdK2Tead0yf_Ns_zJp3TJ_82z_Mq-aSc0jSm4NjPhExISkDIKHSG_sRGRrK-JnwNKXA9mo&_nc_ohc=6AJQwAGT9TsQ7kNvwFe7z9k&_nc_oc=AdoYOiA2vDxe6-tJOURRD6c8sGx2JWl40bREJ6LhA3HPgnTz-7LhbtWEtwV9wF-Wi5s&_nc_zt=23&_nc_ht=scontent.fhan2-3.fna&_nc_gid=a4yR3DpIJ0OKdbIDZ2M4Qg&_nc_ss=7b2a8&oh=00_Af6LL8c6kHsAHwqmdT-R45XpjVtOtrsrIIpORNrAMGn-5g&oe=6A2395AA',
    micOn: true,
    camOn: false,
  },
  {
    id: 4,
    name: 'An thuyên',
    role: 'viewer',
    avatar:
      'https://scontent.fhan2-5.fna.fbcdn.net/v/t39.30808-6/683812266_1434973675330294_8264366892032648574_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeEryUK5MPsI8Wi3K-oLBkhMm-bB3mPK1eib5sHeY8rV6Fwv5FRPhwvMS4NivGFneDGwj8_O_wh7XMWmzYkfMNYy&_nc_ohc=7mgyCUK6i8EQ7kNvwFY0W6k&_nc_oc=AdrhH47-iDBRlRFHngyNxVRi6WdxTMb_hUNaHs6xykY79WmLaF3PHu5HcmLuXSj_qYk&_nc_zt=23&_nc_ht=scontent.fhan2-5.fna&_nc_gid=mT85Lx29LgmCUIPRycE0fQ&_nc_ss=7b2a8&oh=00_Af7yxGFUoETj08xRfA2bc6a9q6eG81uDqSSKPskH45YTNg&oe=6A01D9F7',
    micOn: false,
    camOn: true,
  },
  {
    id: 5,
    name: 'An ',
    role: 'viewer',
    avatar:
      'https://scontent.fhan2-5.fna.fbcdn.net/v/t39.30808-6/683812266_1434973675330294_8264366892032648574_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeEryUK5MPsI8Wi3K-oLBkhMm-bB3mPK1eib5sHeY8rV6Fwv5FRPhwvMS4NivGFneDGwj8_O_wh7XMWmzYkfMNYy&_nc_ohc=7mgyCUK6i8EQ7kNvwFY0W6k&_nc_oc=AdrhH47-iDBRlRFHngyNxVRi6WdxTMb_hUNaHs6xykY79WmLaF3PHu5HcmLuXSj_qYk&_nc_zt=23&_nc_ht=scontent.fhan2-5.fna&_nc_gid=mT85Lx29LgmCUIPRycE0fQ&_nc_ss=7b2a8&oh=00_Af7yxGFUoETj08xRfA2bc6a9q6eG81uDqSSKPskH45YTNg&oe=6A01D9F7',
    micOn: false,
    camOn: true,
  },
  {
    id: 6,
    name: ' thuyên',
    role: 'viewer',
    avatar:
      'https://scontent.fhan2-5.fna.fbcdn.net/v/t39.30808-6/683812266_1434973675330294_8264366892032648574_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeEryUK5MPsI8Wi3K-oLBkhMm-bB3mPK1eib5sHeY8rV6Fwv5FRPhwvMS4NivGFneDGwj8_O_wh7XMWmzYkfMNYy&_nc_ohc=7mgyCUK6i8EQ7kNvwFY0W6k&_nc_oc=AdrhH47-iDBRlRFHngyNxVRi6WdxTMb_hUNaHs6xykY79WmLaF3PHu5HcmLuXSj_qYk&_nc_zt=23&_nc_ht=scontent.fhan2-5.fna&_nc_gid=mT85Lx29LgmCUIPRycE0fQ&_nc_ss=7b2a8&oh=00_Af7yxGFUoETj08xRfA2bc6a9q6eG81uDqSSKPskH45YTNg&oe=6A01D9F7',
    micOn: false,
    camOn: true,
  },
  {
    id: 7,
    name: 'Anbc',
    role: 'viewer',
    avatar:
      'https://scontent.fhan2-5.fna.fbcdn.net/v/t39.30808-6/683812266_1434973675330294_8264366892032648574_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeEryUK5MPsI8Wi3K-oLBkhMm-bB3mPK1eib5sHeY8rV6Fwv5FRPhwvMS4NivGFneDGwj8_O_wh7XMWmzYkfMNYy&_nc_ohc=7mgyCUK6i8EQ7kNvwFY0W6k&_nc_oc=AdrhH47-iDBRlRFHngyNxVRi6WdxTMb_hUNaHs6xykY79WmLaF3PHu5HcmLuXSj_qYk&_nc_zt=23&_nc_ht=scontent.fhan2-5.fna&_nc_gid=mT85Lx29LgmCUIPRycE0fQ&_nc_ss=7b2a8&oh=00_Af7yxGFUoETj08xRfA2bc6a9q6eG81uDqSSKPskH45YTNg&oe=6A01D9F7',
    micOn: false,
    camOn: true,
  },
  {
    id: 8,
    name: 'cccc',
    role: 'viewer',
    avatar:
      'https://scontent.fhan2-5.fna.fbcdn.net/v/t39.30808-6/683812266_1434973675330294_8264366892032648574_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeEryUK5MPsI8Wi3K-oLBkhMm-bB3mPK1eib5sHeY8rV6Fwv5FRPhwvMS4NivGFneDGwj8_O_wh7XMWmzYkfMNYy&_nc_ohc=7mgyCUK6i8EQ7kNvwFY0W6k&_nc_oc=AdrhH47-iDBRlRFHngyNxVRi6WdxTMb_hUNaHs6xykY79WmLaF3PHu5HcmLuXSj_qYk&_nc_zt=23&_nc_ht=scontent.fhan2-5.fna&_nc_gid=mT85Lx29LgmCUIPRycE0fQ&_nc_ss=7b2a8&oh=00_Af7yxGFUoETj08xRfA2bc6a9q6eG81uDqSSKPskH45YTNg&oe=6A01D9F7',
    micOn: false,
    camOn: true,
  },
];

const MOCK_CHAT = [
  {
    id: 1,
    user: 'trungne',
    avatar: 'https://i.pravatar.cc/150?u=1',
    message: 'Mọi người vào đủ chưa nhỉ?',
    type: 'msg',
  },
  {
    id: 2,
    user: 'AnhKhoa',
    avatar: 'https://i.pravatar.cc/150?u=2',
    message: 'Tới luôn đi host',
    type: 'msg',
  },
  {
    id: 3,
    user: 'system',
    avatar: '',
    message: 'Trung đang tua video...',
    type: 'status',
  },
];

export default function WeWatchRoomPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = use(paramsPromise);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState(MOCK_CHAT);

  const { user } = useAuthStore();
  const [room, setRoom] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Real DB Library State
  const [libraryFilms, setLibraryFilms] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [libPage, setLibPage] = useState(1);
  const [hasMoreLib, setHasMoreLib] = useState(true);
  const [isLoadingLib, setIsLoadingLib] = useState(false);

  const fetchLibraryData = async (page: number, search: string, isNewSearch = false) => {
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMyMicOn, setIsMyMicOn] = useState(true);
  const [isMyCamOn, setIsMyCamOn] = useState(true);

  const [currentFilmId, setCurrentFilmId] = useState<any>(null);
  const [requestedVideos, setRequestedVideos] = useState(
    MOCK_VIDEOS.slice(0, 3)
  );

  const [memberOffset, setMemberOffset] = useState(0);
  const [liveKitToken, setLiveKitToken] = useState<string>('');

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const { members: socketMembers } = useSocket(room?.id, user);

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
        toast.error('Không thể tải thông tin phòng.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [params.slug]);

  // Determine host state
  useEffect(() => {
    if (room && user) {
      const isRoomHost =
        room.hostId === user.username || room.host?.username === user.username;
      setIsHost(isRoomHost);
    }
  }, [room, user]);

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

  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
  const [isFilmsOpen, setIsFilmsOpen] = useState(true);
  const [isQueueOpen, setIsQueueOpen] = useState(true);



  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2000);
    }, 1000);
  };

  const handleCopyLink = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: 'Me',
        avatar: 'https://i.pravatar.cc/150?u=99',
        message: chatInput,
        type: 'msg',
      },
    ]);
    setChatInput('');
  };

  const handleAddToRequest = (filmId: number) => {
    const film = MOCK_VIDEOS.find((v) => v.id === filmId);
    if (film) {
      setRequestedVideos((prev) => [...prev, { ...film, id: Date.now() }]); // Add with unique id for the list
    }
  };

  const handleNextMembers = () => {
    const otherMembers = MOCK_MEMBERS.filter((m) => m.id !== 1);
    const total = otherMembers.length;
    if (total <= 3) return;

    let newOffset = memberOffset + 3;
    if (newOffset + 3 > total) {
      newOffset = total - 3;
    }
    setMemberOffset(newOffset);
  };

  const handlePrevMembers = () => {
    let newOffset = memberOffset - 3;
    if (newOffset < 0) newOffset = 0;
    setMemberOffset(newOffset);
  };

  const handleKick = (name: string) => {
    alert(`Đã kick ${name} khỏi phòng!`);
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
            {loading
              ? 'Đang tải phòng...'
              : room
                ? room.title
                : 'Không tìm thấy phòng'}
          </h1>
          {room && (
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60 uppercase">
              {room.type}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-3">
          {room?.type === 'private' && room?.password && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#C800DF]/50 bg-[#C800DF]/10 px-3 py-1.5">
              <span className="font-mono text-xs font-black text-[#C800DF]">
                PWD: {room.password}
              </span>
            </div>
          )}
          <button
            onClick={() => setIsHost(!isHost)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${isHost ? 'bg-[#C800DF]/20 text-[#C800DF]' : 'bg-white/5 text-white/60'}`}
          >
            {isHost ? 'View as Host' : 'View as Viewer'}
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/10"
          >
            {isCopied ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} />
            )}
            {isCopied ? 'Đã sao chép' : 'Copy Link'}
          </button>
          <button className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/30">
            <LogOut size={14} />
            {isHost ? 'Kết thúc phòng' : 'Rời phòng'}
          </button>
        </div>
      </div>

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
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                      <input 
                        type="text" 
                        placeholder="Tìm phim..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-white/5 py-2 pl-9 pr-4 text-[11px] text-white placeholder-white/20 outline-none focus:border-[#C800DF]/50"
                      />
                    </div>
                  </div>

                  <div 
                    className="scrollbar-hide flex flex-1 flex-col gap-3 overflow-y-auto p-4"
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      if (target.scrollHeight - Math.ceil(target.scrollTop) <= target.clientHeight + 10) {
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
                            src={film.thumbnailUrl || MOCK_VIDEOS[0].thumbnailUrl}
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
                             {film.duration ? Math.floor(film.duration / 60) + ' phút' : '--'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddToRequest(film.id)}
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
                Video đang xem
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
                    Danh sách chờ
                  </div>

                  {requestedVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl p-2 transition-all ${
                        currentFilmId === vid.id
                          ? 'bg-[#C800DF]/10 ring-1 ring-[#C800DF]/50'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="relative h-20 w-full overflow-hidden rounded-lg">
                        <Image
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <div className="absolute right-1 bottom-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                          {vid.duration}
                        </div>

                        {/* Host Play Button Overlay */}
                        {isHost && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentFilmId(vid.id);
                              }}
                              className="rounded-full bg-[#C800DF] p-2 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                            >
                              <Play size={16} fill="currentColor" />
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="line-clamp-1 text-xs font-bold text-white">
                        {vid.title}
                      </span>
                    </div>
                  ))}
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
              <VideoPlayer src={streamUrl} poster={room?.video?.thumbnailUrl} />
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
        <div className="glass flex w-[340px] flex-shrink-0 flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5">
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
                        <span className="text-sm font-bold text-white">
                          {m.username}
                          {m.username === user?.username && ' (Bạn)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.username === room?.host?.username ? (
                          <span className="rounded-full border border-[#C800DF] px-2 py-0.5 text-[10px] font-bold text-[#C800DF]">
                            Chủ phòng
                          </span>
                        ) : (
                          isHost && (
                            <button
                              onClick={() => handleKick(m.username)}
                              className="text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:scale-110"
                            >
                              <UserMinus size={14} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Section */}
          <div className="flex items-center justify-between border-b border-white/5 p-4">
            <span className="text-sm font-bold tracking-tighter text-white uppercase">
              Trò chuyện
            </span>
            <div className="flex gap-3 text-white/40">
              <Volume2 size={16} className="cursor-pointer hover:text-white" />
              <Maximize size={16} className="cursor-pointer hover:text-white" />
            </div>
          </div>

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
                    <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-white/10 shadow-lg">
                      <Image
                        src={msg.avatar}
                        alt={msg.user}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[13px] font-black text-[#C800DF]">
                        {msg.user}
                      </span>
                      <p className="mt-1 rounded-[18px] rounded-tl-none bg-white/5 px-4 py-2.5 text-[14px] leading-relaxed text-white/90 shadow-sm">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Chat Input */}
          <div className="border-t border-white/5 p-4">
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
              <div className="flex items-center justify-between px-3 pb-2 text-white/40">
                <div className="flex gap-4">
                  <Smile
                    size={18}
                    className="cursor-pointer transition-colors hover:text-white"
                  />
                  <span className="cursor-pointer text-[11px] font-black tracking-widest uppercase transition-colors hover:text-white">
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
                  className="text-[#C800DF] transition-all hover:scale-110 disabled:text-white/10"
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

'use client';

import React, { useState, useEffect, useRef, use, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSocket } from '@/src/hooks/useSocket';
import { useAuthStore } from '@/src/store/useAuthStore';
import { MOCK_VIDEOS, MOCK_ROOMS } from '@/src/constants/mockData';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  LiveKitProvider,
  LiveKitCameraView,
  LiveKitScreenView,
  LiveKitControls,
  MiniRoomView,
  SubGroupRoom,
  SubGroupView,
  SubGroupMicToggle,
} from '@/src/components/rooms/LiveKitRoom';
import { useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  Send,
  Smile,
  Heart,
  ThumbsUp,
  ThumbsUp as ThumbsUpIcon,
  Flame,
  Users,
  Share2,
  LogOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  Search,
} from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/src/components/rooms/ConfirmationModal';

// --- HELPER COMPONENTS ---
function ScreenShareTracker({
  onStateChange,
}: {
  onStateChange: (active: boolean) => void;
}) {
  const tracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const isActive = tracks.length > 0;

  useEffect(() => {
    onStateChange(isActive);
  }, [isActive, onStateChange]);

  return null;
}

function OfflinePlaceholder({
  visible,
  room,
  hasToken,
}: {
  visible: boolean;
  room: any;
  hasToken: boolean;
}) {
  return (
    <>
      {hasToken ? (
        <OfflineContentWithLiveKit room={room} />
      ) : (
        <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
          {/* Background Blur */}
          {room?.video?.thumbnailUrl && (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-2xl transition-all duration-1000"
              style={{ backgroundImage: `url(${room.video.thumbnailUrl})` }}
            />
          )}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-black/40 to-black/80" />

          {/* Content */}
          <div className="relative z-20 flex flex-col items-center gap-6 px-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute -inset-4 animate-pulse rounded-full bg-[#C800DF]/20 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
                <VideoOff size={32} className="text-white/40" />
              </div>
            </motion.div>

            <div className="flex flex-col gap-2">
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-black tracking-tight text-white"
              >
                Host chưa bắt đầu live
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="max-w-[300px] text-sm leading-relaxed font-medium text-white/50"
              >
                Nội dung livestream chưa bắt đầu hoặc đã kết thúc. Hãy quay lại
                sau nhé!
              </motion.p>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-[10px] font-bold tracking-widest text-white/30 uppercase"
            >
              <Loader2 size={12} className="animate-spin" />
              Đang chờ tín hiệu...
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
}

function OfflineContentWithLiveKit({ room }: { room: any }) {
  const tracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const isScreenSharing = tracks.length > 0;

  if (isScreenSharing || room?.video?.streamUrl) return null;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Background Blur */}
      {room?.video?.thumbnailUrl && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-2xl transition-all duration-1000"
          style={{ backgroundImage: `url(${room.video.thumbnailUrl})` }}
        />
      )}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-black/40 to-black/80" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center gap-6 px-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="absolute -inset-4 animate-pulse rounded-full bg-[#C800DF]/20 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
            <VideoOff size={32} className="text-white/40" />
          </div>
        </motion.div>

        <div className="flex flex-col gap-2">
          <motion.h3
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-black tracking-tight text-white"
          >
            Host chưa bắt đầu live
          </motion.h3>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-[300px] text-sm leading-relaxed font-medium text-white/50"
          >
            Nội dung livestream chưa bắt đầu hoặc đã kết thúc. Hãy quay lại sau
            nhé!
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-[10px] font-bold tracking-widest text-white/30 uppercase"
        >
          <Loader2 size={12} className="animate-spin" />
          Đang chờ tín hiệu...
        </motion.div>
      </div>
    </div>
  );
}

export default function CommunityRoomPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = use(paramsPromise);

  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMonitorMode = searchParams.get('monitor') === 'true';
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

  const [chatInput, setChatInput] = useState('');
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(true);

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isHostMicOn, setIsHostMicOn] = useState(true);
  const [isHostCamOn, setIsHostCamOn] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [visibleStatusIds, setVisibleStatusIds] = useState<Set<string>>(
    new Set()
  );
  const [timeOffset, setTimeOffset] = useState(0);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
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
  const [isEndRoomModalOpen, setIsEndRoomModalOpen] = useState(false);
  const [isHostEndModalOpen, setIsHostEndModalOpen] = useState(false);
  const [liveKitToken, setLiveKitToken] = useState<string>('');

  // Sub-group state
  const [subGroupId, setSubGroupId] = useState<string>('');
  const [subGroupToken, setSubGroupToken] = useState<string>('');
  const [subGroupRoomName, setSubGroupRoomName] = useState<string>('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

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
  const memberScrollRef = useRef<HTMLDivElement>(null);

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
    hostMediaState,
    updateHostMediaState,
    kickMember,
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

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // ─── AUTH REDIRECT ───
  useEffect(() => {
    // Only redirect if hydration is complete and user is explicitly null
    if (isHydrated && user === null) {
      const sp = searchParams.toString();
      const fullPath = window.location.pathname + (sp ? `?${sp}` : '');
      console.log('Redirecting to login. Full path detected:', fullPath);
      window.location.href = `/login?callbackUrl=${encodeURIComponent(fullPath)}`;
    }
  }, [user, isHydrated, searchParams]);

  // ─── DETERMINE HOST ───
  useEffect(() => {
    if (room && user) {
      const effectiveHostId = currentHostId || room.hostId || room.host?.id;
      const isActuallyHost =
        effectiveHostId === user.id || room.host?.username === user.username;
      setIsHost(isActuallyHost);

      if (!currentHostId && (room.hostId || room.host?.id)) {
        setCurrentHostId(room.hostId || room.host?.id);
      }
    }
  }, [room, user, currentHostId, setCurrentHostId]);

  // Status message visibility
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

  // Fetch LiveKit Token
  useEffect(() => {
    if (room) {
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

  // Sync host media state
  useEffect(() => {
    if (isHost) {
      updateHostMediaState(isHostMicOn, isHostCamOn);
    }
  }, [isHostMicOn, isHostCamOn, isHost, updateHostMediaState]);

  useEffect(() => {
    if (!isHost && hostMediaState) {
      setIsHostMicOn(hostMediaState.mic);
      setIsHostCamOn(hostMediaState.cam);
    }
  }, [hostMediaState, isHost]);

  const handleLeaveRoom = () => {
    if (!room || !user) return;
    socket?.emit('leaveRoom', { roomId: room.id, username: user.username });
    router.push('/rooms');
  };

  const [kickTarget, setKickTarget] = useState<string | null>(null);
  const [isSubGroupLeaveModalOpen, setIsSubGroupLeaveModalOpen] =
    useState(false);

  const handleLeaveSubGroup = () => {
    setSubGroupToken('');
    setSubGroupId('');
    setSubGroupRoomName('');
    // Clean up session storage
    if (room?.id) {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith(`ww_sg_${room.id}`)) {
          sessionStorage.removeItem(key);
        }
      });
    }
    // Remove subGroup from URL
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    toast.success('Đã rời khỏi sub-group');
  };

  const handleEndRoom = async () => {
    if (!room || !user) return;
    try {
      socket?.emit('endRoom', { roomId: room.id });
      await deleteRoom(room.id);
      setIsHostEndModalOpen(false);
      router.push('/rooms');
      toast.success('Đã kết thúc phòng thành công');
    } catch (err) {
      console.error('End room error:', err);
      toast.error('Có lỗi xảy ra khi kết thúc phòng');
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
      if (res.data.url) sendMessage(res.data.url);
    } catch (err) {
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchGifs = async (query = '') => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GIF_API_KEY || 'LIVDSRZULELA';
      const provider = process.env.NEXT_PUBLIC_GIF_PROVIDER || 'tenor';
      let endpoint =
        provider === 'tenor'
          ? `https://tenor.googleapis.com/v2/${query ? 'search?q=' + encodeURIComponent(query) : 'featured?'}key=${apiKey}&limit=20`
          : `https://api.giphy.com/v1/gifs/${query ? 'search?q=' + encodeURIComponent(query) : 'trending?'}api_key=${apiKey}&limit=20&rating=g`;

      const res = await fetch(endpoint);
      const data = await res.json();
      const formattedGifs =
        provider === 'tenor'
          ? (data.results || []).map((g: any) => ({
              id: g.id,
              images: {
                fixed_height_small: { url: g.media_formats.tinygif.url },
                original: { url: g.media_formats.gif.url },
              },
            }))
          : (data.data || []).map((g: any) => ({
              id: g.id,
              images: {
                fixed_height_small: { url: g.images.fixed_height_small.url },
                original: { url: g.images.original.url },
              },
            }));
      setGifs(formattedGifs);
    } catch (err) {
      console.error('Fetch GIFs error:', err);
    }
  };

  useEffect(() => {
    if (isGifPickerOpen) fetchGifs(gifSearch);
  }, [isGifPickerOpen, gifSearch]);

  const onEmojiClick = (emojiData: any) => {
    setChatInput((prev) => prev + emojiData.emoji);
    setIsEmojiPickerOpen(false);
  };

  const scrollMembers = (direction: 'left' | 'right') => {
    if (memberScrollRef.current) {
      const amount = 100;
      memberScrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép liên kết tham gia!');
  };

  // Auto-join sub-group from URL param (?subGroup=uuid)
  useEffect(() => {
    if (!room || !user) return;
    const sgId = searchParams.get('subGroup');
    if (!sgId) return;
    // Restore from sessionStorage if we already have a token for this subgroup
    const stored = sessionStorage.getItem(`ww_sg_${room.id}_${sgId}`);
    if (stored) {
      const { token, roomName } = JSON.parse(stored);
      setSubGroupId(sgId);
      setSubGroupToken(token);
      setSubGroupRoomName(roomName);
      return;
    }
    // Fetch fresh token
    api
      .get(`/livekit/subgroup-token?roomId=${room.id}&subGroupId=${sgId}`)
      .then((res) => {
        setSubGroupId(sgId);
        setSubGroupToken(res.data.token);
        setSubGroupRoomName(res.data.subRoomName);
        sessionStorage.setItem(
          `ww_sg_${room.id}_${sgId}`,
          JSON.stringify({
            token: res.data.token,
            roomName: res.data.subRoomName,
          })
        );
        // Set the auth flag so security check passes
        sessionStorage.setItem(`ww_auth_${params.slug}`, '1');
      })
      .catch((err) => console.error('Sub-group token error:', err));
  }, [room, user, searchParams, params.slug]);

  const handleInvite = async () => {
    if (!room) return;

    // If already in a sub-group, just copy the current link
    if (subGroupId) {
      const inviteUrl = `${window.location.origin}/community/${params.slug}?subGroup=${subGroupId}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success('Đã sao chép link mời bạn bè vào nhóm hiện tại!');
      return;
    }

    setIsGeneratingInvite(true);
    try {
      // Generate a new UUID for this sub-group
      const newId = crypto.randomUUID();
      const res = await api.get(
        `/livekit/subgroup-token?roomId=${room.id}&subGroupId=${newId}`
      );
      setSubGroupId(newId);
      setSubGroupToken(res.data.token);
      setSubGroupRoomName(res.data.subRoomName);
      sessionStorage.setItem(
        `ww_sg_${room.id}_${newId}`,
        JSON.stringify({
          token: res.data.token,
          roomName: res.data.subRoomName,
        })
      );
      // Build invite link with subGroup param
      const inviteUrl = `${window.location.origin}/community/${params.slug}?subGroup=${newId}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success('Đã sao chép link mời bạn bè!');
    } catch (err) {
      toast.error('Không thể tạo link mời. Vui lòng thử lại.');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  return (
    <main className="scrollbar-hide flex h-screen w-screen flex-col overflow-auto bg-[#0A0A0B] font-sans text-slate-100">
      {/* HEADER */}
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
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/10"
              >
                <Share2 size={14} /> Chia sẻ
              </button>
              <button
                onClick={() =>
                  isHost
                    ? setIsHostEndModalOpen(true)
                    : setIsLeaveModalOpen(true)
                }
                className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/30"
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

      <LiveKitProvider
        roomName={room?.id || params.slug}
        token={liveKitToken}
        onDisconnect={() => setLiveKitToken('')}
        video={isHost}
        audio={isHost}
      >
        <div className="flex flex-1 gap-4 overflow-hidden p-4">
          {/* LEFT SIDEBAR */}
          <div className="flex w-[280px] flex-shrink-0 flex-col gap-4 overflow-hidden">
            <div className="glass relative flex flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5">
              <div
                className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 hover:bg-white/5"
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
                          {isHost && m.username !== user?.username && (
                            <button
                              onClick={() => setKickTarget(m.username)}
                              className="p-1 text-red-500/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                              title="Mời ra khỏi phòng"
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

            {/* SUB-GROUP PANEL (For Viewers) */}
            {!isHost && (
              <div
                className={`glass flex flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5 transition-all duration-300 ${isInviteOpen ? 'flex-1' : 'h-fit flex-none'}`}
              >
                {subGroupToken ? (
                  /* Wrap the entire panel in ONE SubGroupRoom so all hook-users share context */
                  <SubGroupRoom
                    subRoomName={subGroupRoomName}
                    token={subGroupToken}
                    onDisconnect={() => {
                      setSubGroupToken('');
                      setSubGroupId('');
                      setSubGroupRoomName('');
                    }}
                  >
                    {/* Header with mic toggle */}
                    <div
                      className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 hover:bg-white/5"
                      onClick={() => setIsInviteOpen(!isInviteOpen)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                        <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                          Sub-group
                        </h3>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SubGroupMicToggle />
                        <button
                          onClick={() => setIsSubGroupLeaveModalOpen(true)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          title="Rời sub-group"
                        >
                          <LogOut size={12} />
                        </button>
                        {isInviteOpen ? (
                          <ChevronUp size={16} className="text-white/40" />
                        ) : (
                          <ChevronDown size={16} className="text-white/40" />
                        )}
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {isInviteOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="flex flex-col gap-4 p-4"
                        >
                          <SubGroupView
                            memberAvatars={Object.fromEntries(
                              socketMembers
                                .filter((m) => m.username && m.avatarUrl)
                                .map((m) => [m.username, m.avatarUrl])
                            )}
                          />
                          <button
                            onClick={handleInvite}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/5 py-2 text-[10px] font-bold text-white/30 hover:text-white/60"
                          >
                            <Copy size={10} /> Sao chép link mời thêm bạn
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SubGroupRoom>
                ) : (
                  /* No sub-group – show invite prompt */
                  <>
                    <div
                      className="flex cursor-pointer items-center justify-between border-b border-white/5 p-4 hover:bg-white/5"
                      onClick={() => setIsInviteOpen(!isInviteOpen)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-white/20" />
                        <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                          Mời bạn cùng xem
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
                          className="flex flex-col items-center gap-3 p-4 py-6"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
                            <UserPlus size={20} className="text-[#00E5FF]" />
                          </div>
                          <p className="text-center text-[11px] font-bold text-white/40">
                            Tạo phòng riêng với bạn bè để trò chuyện giọng nói
                            trong khi xem
                          </p>
                          <button
                            onClick={handleInvite}
                            disabled={isGeneratingInvite}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00E5FF]/15 py-2.5 text-xs font-bold text-[#00E5FF] transition-all hover:bg-[#00E5FF]/25 disabled:opacity-50"
                          >
                            {isGeneratingInvite ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <UserPlus size={14} />
                            )}
                            {isGeneratingInvite
                              ? 'Đang tạo link...'
                              : 'Mời bạn bè & Tạo sub-group'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            )}

            {isHost && (
              <div className="glass flex flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5">
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
                        <Select<'community'>
                          value={'community'}
                          onChange={() => {}}
                          options={[{ value: 'community', label: 'Cộng đồng' }]}
                          buttonClassName="rounded-lg px-3 py-2 text-xs font-bold"
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

          {/* CENTER COLUMN */}
          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            <div className="group relative flex-1 overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-2xl">
              {liveKitToken && (
                <>
                  <LiveKitScreenView />
                  <ScreenShareTracker onStateChange={() => {}} />
                </>
              )}

              <OfflinePlaceholder
                visible={!room?.video?.streamUrl && !liveKitToken}
                room={room}
                hasToken={!!liveKitToken}
              />

              {room?.video?.streamUrl && (
                <div className="absolute inset-0 z-0">
                  <VideoPlayer
                    src={room.video.streamUrl}
                    poster={room.video.thumbnailUrl}
                    onAction={sendVideoAction}
                    lastAction={lastVideoAction}
                    initialState={videoState}
                    onOffsetChange={setTimeOffset}
                  />
                </div>
              )}

              <div className="pointer-events-none absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-white">Live</span>
                <Users size={12} className="text-white/60" />
                <span className="text-xs font-bold text-white">
                  {socketMembers.length}
                </span>
              </div>
            </div>

            {/* Member Bubbles */}
            <div className="glass flex h-16 flex-shrink-0 items-center justify-center gap-4 rounded-[20px] border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => scrollMembers('left')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>
                <div
                  ref={memberScrollRef}
                  className="scrollbar-hide flex w-48 -space-x-3 overflow-x-hidden py-1 sm:w-64"
                >
                  {socketMembers.map((m, idx) => (
                    <div
                      key={m.username || idx}
                      className="group relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#12121A] bg-white/10 shadow-xl transition-transform hover:z-10 hover:scale-110"
                    >
                      {m.avatarUrl ? (
                        <Image
                          src={m.avatarUrl}
                          alt={m.username}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-white/60">
                          {m.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => scrollMembers('right')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="mx-2 h-6 w-px bg-white/10"></div>
              <span className="text-xs font-bold text-white/40">
                {socketMembers.length} người đang tham gia
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="glass relative flex w-[340px] flex-shrink-0 flex-col overflow-hidden rounded-[24px] border border-white/5 bg-white/5">
            <div className="relative aspect-video w-full overflow-hidden border-b border-white/5 bg-black/40">
              {liveKitToken ? (
                <LiveKitCameraView />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white/20 italic">
                  Đang chuẩn bị...
                </div>
              )}
              <div className="absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-md">
                <div className="h-1.5 w-1.5 rounded-full bg-[#C800DF]"></div>
                <span className="text-[10px] font-bold text-white">
                  Host: {room?.host?.username || 'Đang tải...'}
                </span>
              </div>
              {liveKitToken && (
                <LiveKitControls isHost={isHost} mode="community" />
              )}
            </div>

            <div className="flex items-center justify-between border-b border-white/5 p-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`text-sm font-bold tracking-tighter uppercase ${activeTab === 'chat' ? 'text-white' : 'text-white/20'}`}
                >
                  Trò chuyện
                </button>
                <div className="h-4 w-px bg-white/10"></div>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`text-sm font-bold tracking-tighter uppercase ${activeTab === 'history' ? 'text-white' : 'text-white/20'}`}
                >
                  Lịch sử
                </button>
              </div>
            </div>

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
                        <span className="text-center text-[12px] font-bold text-white/30 italic">
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
                          <span
                            className={`text-[10px] font-black uppercase ${msg.username === room?.host?.username ? 'text-[#C800DF]' : 'text-white/40'}`}
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
                          <div
                            className={`mt-0.5 px-3 py-1.5 text-[14px] leading-tight ${msg.username === user?.username ? 'rounded-2xl rounded-tr-none bg-[#C800DF]/20 text-white' : 'text-white/90'}`}
                          >
                            {msg.message.match(/\.(jpeg|jpg|gif|png|webp)$/i) ||
                            msg.message.includes('cloudinary.com') ? (
                              <img
                                src={msg.message}
                                alt="media"
                                className="max-h-60 rounded-lg"
                                onClick={() => setSelectedImage(msg.message)}
                              />
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

            <div
              className="border-t border-white/5 bg-black/20 p-4"
              ref={chatContainerRef}
            >
              <div className="mb-3 flex justify-center gap-5">
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
                  <div className="flex items-center gap-4">
                    <Smile
                      size={18}
                      className="cursor-pointer hover:text-white"
                      onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    />
                    <span
                      onClick={() => setIsGifPickerOpen(!isGifPickerOpen)}
                      className="cursor-pointer text-[10px] font-black uppercase hover:text-white"
                    >
                      GIF
                    </span>
                    <ImageIcon
                      size={18}
                      className="cursor-pointer hover:text-white"
                      onClick={() => fileInputRef.current?.click()}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="text-[#C800DF] hover:scale-110 disabled:opacity-20"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>

              {/* Emoji Picker */}
              <AnimatePresence>
                {isEmojiPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-4 bottom-24 z-50"
                  >
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      theme={Theme.DARK}
                      lazyLoadEmojis
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* GIF Picker */}
              <AnimatePresence>
                {isGifPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="glass absolute right-4 bottom-24 z-50 flex h-96 w-72 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
                  >
                    <div className="border-b border-white/5 p-3">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute top-1/2 left-3 -translate-y-1/2 text-white/20"
                        />
                        <input
                          type="text"
                          placeholder="Tìm GIF..."
                          value={gifSearch}
                          onChange={(e) => setGifSearch(e.target.value)}
                          className="w-full rounded-lg bg-white/5 py-1.5 pr-3 pl-9 text-xs text-white outline-none focus:bg-white/10"
                        />
                      </div>
                    </div>
                    <div className="scrollbar-hide grid grid-cols-2 gap-1 overflow-y-auto p-1">
                      {gifs.map((gif) => (
                        <div
                          key={gif.id}
                          className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg"
                          onClick={() => {
                            sendMessage(gif.images.original.url);
                            setIsGifPickerOpen(false);
                          }}
                        >
                          <img
                            src={gif.images.fixed_height_small.url}
                            alt="gif"
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </LiveKitProvider>

      {/* MODALS */}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass relative w-full max-w-sm rounded-[32px] border border-white/10 bg-[#121214] p-8 shadow-2xl"
            >
              <h3 className="mb-2 text-center text-xl font-bold text-white">
                Rời khỏi phòng?
              </h3>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={handleLeaveRoom}
                  className="w-full rounded-2xl bg-red-500 py-4 text-sm font-bold text-white hover:bg-red-600"
                >
                  Xác nhận rời phòng
                </button>
                <button
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="w-full rounded-2xl bg-white/5 py-4 text-sm font-bold text-white hover:bg-white/10"
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

      <AnimatePresence>
        {selectedImage && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={selectedImage}
              className="relative z-[210] max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
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

      <ConfirmationModal
        isOpen={!!kickTarget}
        onClose={() => setKickTarget(null)}
        onConfirm={() => kickTarget && kickMember(kickTarget)}
        title="Mời ra khỏi phòng"
        message={`Bạn có chắc chắn muốn mời ${kickTarget} ra khỏi phòng không?`}
        confirmText="Mời ra"
        type="danger"
      />

      <ConfirmationModal
        isOpen={isSubGroupLeaveModalOpen}
        onClose={() => setIsSubGroupLeaveModalOpen(false)}
        onConfirm={handleLeaveSubGroup}
        title="Rời Sub-group"
        message="Bạn có chắc chắn muốn rời khỏi sub-group hiện tại? Bạn vẫn sẽ ở lại trong phòng cộng đồng."
        confirmText="Rời nhóm"
        type="warning"
      />

      <ConfirmationModal
        isOpen={isHostEndModalOpen}
        onClose={() => setIsHostEndModalOpen(false)}
        onConfirm={handleEndRoom}
        title="Kết thúc phòng"
        message="Bạn có chắc chắn muốn kết thúc phòng? Tất cả người xem sẽ bị đưa ra ngoài và phòng sẽ không còn hoạt động."
        confirmText="Kết thúc"
        type="danger"
      />
    </main>
  );
}

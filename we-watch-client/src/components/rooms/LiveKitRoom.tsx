'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import {
  LiveKitRoom as LKRoom,
  RoomAudioRenderer,
  useTracks,
  ParticipantTile,
  VideoTrack,
  TrackReferenceOrPlaceholder,
  TrackReference,
  useLocalParticipant,
  useParticipants,
  useIsSpeaking,
  useRoomContext,
} from '@livekit/components-react';
import { Track, VideoQuality, VideoPresets, RemoteTrackPublication, VideoPreset, LocalVideoTrack, ConnectionQuality } from 'livekit-client';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  ScreenShare, 
  Settings, 
  Check, 
  Maximize, 
  Minimize,
  MonitorPlay,
  Film,
  FileText,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import '@livekit/components-styles';

interface LiveKitContextProps {
  roomName: string;
  token: string;
  onDisconnect: () => void;
  children: React.ReactNode;
  streamMode?: StreamMode;
}

export type StreamMode = 'GAMING' | 'CINEMA' | 'SHARING';

// Component phụ trách việc cập nhật thông số luồng phát khi đổi Mode
function StreamSettingsUpdater({ mode }: { mode: StreamMode }) {
  const { localParticipant } = useLocalParticipant();
  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (!localParticipant) return;

    const updateSettings = async () => {
      console.log('Đang chuyển sang chế độ:', mode);

      let videoEncoding = { bitrate: 2_000_000, maxFramerate: 24 };
      let screenEncoding = { bitrate: 4_000_000, maxFramerate: 24 };

      if (mode === 'GAMING') {
        // Tối ưu cho chuyển động siêu mượt
        videoEncoding = { bitrate: 4_000_000, maxFramerate: 60 };
        screenEncoding = { bitrate: 12_000_000, maxFramerate: 60 };
      } else if (mode === 'CINEMA') {
        // Tối ưu cho độ nét điện ảnh 1080p
        videoEncoding = { bitrate: 6_000_000, maxFramerate: 30 };
        screenEncoding = { bitrate: 12_000_000, maxFramerate: 30 };
      } else if (mode === 'SHARING') {
        // Tối ưu cho văn bản, tiết kiệm tài nguyên
        videoEncoding = { bitrate: 1_500_000, maxFramerate: 15 };
        screenEncoding = { bitrate: 3_000_000, maxFramerate: 15 };
      }

      const updatePromises = Array.from(localParticipant.videoTrackPublications.values()).map(async (pub) => {
        if (pub.track && pub.kind === 'video') {
          try {
            const track = pub.track;
            const targetEncoding = pub.source === Track.Source.ScreenShare ? screenEncoding : videoEncoding;
            
            console.log(`[LiveKit] Đang áp dụng cấu hình tối ưu cho ${pub.source}:`, targetEncoding);

            // Cập nhật qua setPublishingOptions (Official API)
            if ('setPublishingOptions' in track) {
              await (track as any).setPublishingOptions({
                videoEncoding: {
                  maxBitrate: targetEncoding.bitrate,
                  maxFramerate: targetEncoding.maxFramerate,
                  priority: 'high',
                },
                simulcast: true,
              });
            }

            // Đồng thời cập nhật trực tiếp RTCRtpSender để đảm bảo tác động ngay lập tức (Double-tap)
            if ('sender' in track && (track as any).sender) {
              const sender = (track as any).sender as RTCRtpSender;
              const params = sender.getParameters();
              
              // Tối ưu hóa cách trình duyệt xử lý khi mạng yếu
              if (mode === 'GAMING') {
                (params as any).degradationPreference = 'maintain-framerate';
              } else {
                (params as any).degradationPreference = 'maintain-resolution';
              }

              if (params.encodings && params.encodings.length > 0) {
                params.encodings.forEach((enc) => {
                  let scale = 1;
                  if (enc.rid === 'h') scale = 0.5;
                  else if (enc.rid === 'q') scale = 0.25;
                  enc.maxBitrate = targetEncoding.bitrate * scale;
                  enc.maxFramerate = targetEncoding.maxFramerate;
                });
                await sender.setParameters(params);
              }
            }
            // Cập nhật Content Hint để trình duyệt biết ưu tiên FPS hay Độ nét
            if (track instanceof LocalVideoTrack && (track as any).mediaStreamTrack) {
              const hint = (mode === 'GAMING' || mode === 'CINEMA') ? 'motion' : 'detail';
              (track as any).mediaStreamTrack.contentHint = hint;
              console.log(`[LiveKit] Đã đặt Content Hint thành: ${hint} cho ${pub.source}`);
            }

            console.log(`[LiveKit] Đã tối ưu hóa hoàn toàn ${pub.source} cho ${mode}`);
          } catch (err) {
            console.error(`[LiveKit] Lỗi khi cập nhật Mode cho ${pub.source}:`, err);
          }
        }
      });

      await Promise.all(updatePromises);

      if (isInitialMount.current) {
        isInitialMount.current = false;
      } else if (updatePromises.length > 0) {
        toast.success(`Đã tối ưu cho chế độ ${mode}`, {
          description: mode === 'GAMING' ? 'Ưu tiên độ mượt 60 FPS' : mode === 'CINEMA' ? 'Ưu tiên hình ảnh 1080p' : 'Ưu tiên hiển thị văn bản',
          duration: 3000,
        });
      }
    };

    updateSettings();
  }, [mode, localParticipant]);

  return null;
}

function QualitySelector({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('Auto');

  const handleQualityChange = async (q: string) => {
    setSelectedQuality(q);
    setIsQualityMenuOpen(false);

    const pub = trackRef.publication;
    if (!pub || typeof (pub as any).setVideoQuality !== 'function') {
      console.warn('[LiveKit] Không tìm thấy phương thức setVideoQuality trên publication này');
      return;
    }

    const vq = q === 'Auto' || q === '1080p' ? VideoQuality.HIGH : 
               q === '720p' ? VideoQuality.MEDIUM : VideoQuality.LOW;

    console.log(`[LiveKit] Đang chuyển chất lượng sang: ${q} (VQ: ${vq}) cho track: ${pub.trackSid}`);
    
    try {
      await (pub as any).setVideoQuality(vq);
      console.log(`[LiveKit] Đã gửi yêu cầu chuyển chất lượng ${q} lên server`);
      toast.success(`Đang chuyển sang chất lượng ${q}...`);
    } catch (err) {
      console.error(`[LiveKit] Lỗi khi chuyển chất lượng:`, err);
      toast.error('Lỗi khi chuyển chất lượng');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsQualityMenuOpen(!isQualityMenuOpen);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-white/20 active:scale-90"
        title="Cài đặt chất lượng"
      >
        <Settings 
          size={20} 
          className={`text-white transition-transform duration-500 ${isQualityMenuOpen ? 'rotate-90' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isQualityMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
            className="absolute bottom-full right-0 mb-4 min-w-[250px] overflow-hidden rounded-xl border border-white/5 bg-[#0F0F0F]/95 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            <div className="border-b border-white/10 px-4 py-2 text-[13px] font-medium text-white/90">
              Chất lượng hình ảnh
            </div>
            
            <div className="mt-1 flex flex-col">
              {['Auto', '1080p', '720p', '480p'].map((q) => (
                <button
                  key={q}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQualityChange(q);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-white/10"
                >
                  <div className="flex w-5 items-center justify-center">
                    {selectedQuality === q && <Check size={16} className="text-white" />}
                  </div>
                  <span className={`flex-1 ${selectedQuality === q ? 'font-medium text-white' : 'text-white/70'}`}>
                    {q}
                  </span>
                  {(q === '1080p' || q === '720p') && (
                    <span className="rounded bg-white/10 px-1 py-0.5 text-[8px] font-bold text-white/50">
                      HD
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Default export (used by Private room) ───────────────────────────────────
export default function LiveKitRoom({
  roomName,
  token,
  onDisconnect,
}: {
  roomName: string;
  token: string;
  onDisconnect: () => void;
}) {
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!token || !serverUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black/20 text-xs text-white/40 italic">
        Đang cấu hình Video...
      </div>
    );
  }

  return (
    <LKRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      onDisconnected={onDisconnect}
      data-lk-theme="default"
      className="flex h-full w-full flex-col gap-2"
    >
      <div className="flex flex-1 gap-2 overflow-hidden p-1">
        <MyVideoLayout />
      </div>

      {/* Nút điều khiển Cam/Mic */}
      <CustomControlBar />

      <RoomAudioRenderer />
    </LKRoom>
  );
}

function MyVideoLayout() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="scrollbar-hide flex h-full w-full gap-3 overflow-x-auto">
      {tracks.map((track: TrackReferenceOrPlaceholder) => (
        <div
          key={`${track.participant.identity}_${track.source}`}
          className="relative aspect-video h-full flex-shrink-0"
        >
          <ParticipantTile trackRef={track} />
        </div>
      ))}
    </div>
  );
}

function CustomControlBar() {
  const { isMicrophoneEnabled, isCameraEnabled, localParticipant } =
    useLocalParticipant();

  return (
    <div className="absolute top-2 right-4 z-50 flex gap-2">
      <button
        onClick={() =>
          localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled, {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          })
        }
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
          isMicrophoneEnabled
            ? 'bg-black/40 text-white hover:bg-black/60'
            : 'bg-red-500 text-white'
        }`}
      >
        {isMicrophoneEnabled ? <Mic size={14} /> : <MicOff size={14} />}
      </button>
      <button
        onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
          isCameraEnabled
            ? 'bg-black/40 text-white hover:bg-black/60'
            : 'bg-red-500 text-white'
        }`}
      >
        {isCameraEnabled ? <Video size={14} /> : <VideoOff size={14} />}
      </button>
    </div>
  );
}

// ─── Global Reactions Component (Always active in the room) ───────────────────
function GlobalReactions() {
  const [reactions, setReactions] = React.useState<{ id: string; emoji: string }[]>([]);
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  React.useEffect(() => {
    const handleTrigger = (e: any) => {
      const emoji = e.detail.emoji;
      const data = new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji }));
      localParticipant.publishData(data, { reliable: false });
      // Cũng phát ra local-reaction để hiển thị cho chính mình
      window.dispatchEvent(new CustomEvent('local-reaction', { detail: { emoji } }));
    };
    window.addEventListener('trigger-reaction', handleTrigger);
    return () => window.removeEventListener('trigger-reaction', handleTrigger);
  }, [localParticipant]);

  React.useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'reaction') {
          const id = Math.random().toString(36).substring(2, 9);
          setReactions((prev) => [...prev, { id, emoji: data.emoji }]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== id));
          }, 3000);
        }
      } catch (e) {
        // Ignore
      }
    };
    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room]);

  React.useEffect(() => {
    const handleLocal = (e: any) => {
      const id = Math.random().toString(36).substring(2, 9);
      setReactions((prev) => [...prev, { id, emoji: e.detail.emoji }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    };
    window.addEventListener('local-reaction', handleLocal);
    return () => window.removeEventListener('local-reaction', handleLocal);
  }, []);

  return (
    <div className="absolute right-4 bottom-16 w-32 h-[80%] pointer-events-none z-50 overflow-hidden">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-0 text-3xl animate-float-up"
          style={{
            left: `${10 + Math.random() * 80}%`,
          }}
        >
          {r.emoji}
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
          }
          100% {
            transform: translateY(-400px) scale(1.2);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: floatUp 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ─── Provider (shared) ───────────────────────────────────────────────────────
export function LiveKitProvider({
  roomName,
  token,
  onDisconnect,
  children,
  video = false,
  audio = false,
  audioMuted = false,
  streamMode,
}: LiveKitContextProps & { video?: boolean; audio?: boolean; audioMuted?: boolean }) {
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!token || !serverUrl) return <>{children}</>;

  return (
    <LKRoom
      video={video}
      audio={audio}
      token={token}
      serverUrl={serverUrl}
      onDisconnected={onDisconnect}
      options={{
        dynacast: true,
        publishDefaults: {
          simulcast: true,
          videoCodec: 'vp9',
          videoSimulcastLayers: [
            new VideoPreset(1920, 1080, 8_000_000, 60),
            new VideoPreset(1280, 720, 3_000_000, 30),
            new VideoPreset(640, 360, 800_000, 20),
          ],
          screenShareSimulcastLayers: [
            new VideoPreset(1920, 1080, 8_000_000, 60),
            new VideoPreset(1280, 720, 3_000_000, 30),
            new VideoPreset(640, 360, 1_000_000, 20),
          ],
          screenShareEncoding: {
            maxBitrate: 8_000_000,
            maxFramerate: 60,
          },
        },
        videoCaptureDefaults: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 60,
        },
      }}
      data-lk-theme="default"
      className="flex h-full w-full flex-col"
    >
      {children}
      <GlobalReactions />
      {streamMode && <StreamSettingsUpdater mode={streamMode} />}
      {!audioMuted && <RoomAudioRenderer />}
    </LKRoom>
  );
}

// ─── Sub-Group Provider (audio-only, separate LiveKit room) ──────────────────
export function SubGroupRoom({
  subRoomName,
  token,
  onDisconnect,
  children,
}: {
  subRoomName: string;
  token: string;
  onDisconnect: () => void;
  children: React.ReactNode;
}) {
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!token || !serverUrl) return null;

  return (
    <LKRoom
      audio={true}
      video={false}
      token={token}
      serverUrl={serverUrl}
      onDisconnected={onDisconnect}
      data-lk-theme="default"
      className="contents"
    >
      {children}
      <RoomAudioRenderer />
    </LKRoom>
  );
}

// Component điều khiển volume riêng cho Camera (Mic)
function CameraVolumeControl({ participant }: { participant: any }) {
  const micTracks = useTracks([
    { source: Track.Source.Microphone, withPlaceholder: false },
  ]);
  
  const trackRef = micTracks.find((t) => t.participant.identity === participant.identity);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);

  React.useEffect(() => {
    if (trackRef?.publication?.track) {
      const track = trackRef.publication.track;
      
      // Chỉnh Volume
      if (typeof (track as any).setVolume === 'function') {
        try {
          (track as any).setVolume(volume);
        } catch (e) {
          console.error('Lỗi khi set volume cho mic:', e);
        }
      }
      
      // Tăng Buffer (Playout Delay) lên 2.5s để mượt hình/tiếng
      if ('setPlayoutDelay' in track) {
        (track as any).setPlayoutDelay(2.5);
      }
    }
  }, [trackRef, volume]);

  if (!trackRef || participant.isLocal) return null;

  const isMuted = volume === 0;

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 1);
    }
  };

  return (
    <div className="absolute bottom-2 left-2 z-30 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        className="focus:outline-none"
        title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
      >
        {isMuted ? (
          <VolumeX size={12} className="text-red-500 hover:text-red-400 transition-colors" />
        ) : (
          <Volume2 size={12} className="text-white/70 hover:text-white transition-colors" />
        )}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => {
          e.stopPropagation();
          setVolume(parseFloat(e.target.value));
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-12 h-1 accent-white cursor-pointer"
      />
    </div>
  );
}

// ─── Camera view (all participants) ─────────────────────────────────────────
export function LiveKitCameraView() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);

  return (
    <div className="scrollbar-hide flex h-full w-full gap-3 overflow-x-auto">
      {tracks.map((track: TrackReferenceOrPlaceholder) => (
        <div
          key={`${track.participant.identity}_${track.source}`}
          className="relative aspect-video h-full flex-shrink-0 group"
        >
          <ParticipantTile trackRef={track} />
          <CameraVolumeControl participant={track.participant} />
        </div>
      ))}
    </div>
  );
}

// ─── Real-time stats monitor ────────────────────────────────────────────────
function StreamStatsOverlay({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  const [stats, setStats] = useState({ bitrate: 0, fps: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Chỉ hiển thị Stats cho Host (người phát)
    if (!trackRef.participant.isLocal) {
      setIsVisible(false);
      return;
    }

    const interval = setInterval(async () => {
      // TrackReferenceOrPlaceholder có thể không có publication nếu là placeholder
      if (!('publication' in trackRef) || !trackRef.publication) return;
      
      const track = trackRef.publication.track;
      if (!track) return;

      // Lấy stats từ RTCRtpSender (đối với host) hoặc RTCRtpReceiver (đối với viewer)
      let report: any;
      try {
        if ('getRTCStatsReport' in track) {
          report = await (track as any).getRTCStatsReport();
        } else {
          return;
        }
      } catch (e) {
        return;
      }

      let currentBitrate = 0;
      let currentFPS = 0;

      report.forEach((stat: any) => {
        // Stats cho Host (Outbound & Capture)
        if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
          if (stat.targetBitrate) currentBitrate += stat.targetBitrate / 1_000_000;
          if (stat.framesPerSecond) currentFPS = Math.max(currentFPS, stat.framesPerSecond);
        }
        
        // Nếu outbound không có FPS (thường xảy ra với host), lấy từ media-source
        if (stat.type === 'media-source' && stat.kind === 'video') {
          if (stat.framesPerSecond && currentFPS === 0) currentFPS = stat.framesPerSecond;
        }

        // Stats cho Viewer (Inbound)
        if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
          if (stat.framesPerSecond) currentFPS = stat.framesPerSecond;
          // Ước tính bitrate cho viewer từ bytesReceived
          if (stat.bytesReceived && (stat as any).lastBytes) {
             const deltaBytes = stat.bytesReceived - (stat as any).lastBytes;
             currentBitrate = (deltaBytes * 8) / 1_000_000;
          }
          stat.lastBytes = stat.bytesReceived;
        }
      });

      // Luôn cập nhật state để tránh bị đóng băng hoặc không hiển thị khi số liệu về 0
      setStats({ bitrate: currentBitrate, fps: currentFPS });
    }, 1000);
    return () => clearInterval(interval);
  }, [trackRef]);

  React.useEffect(() => {
    const quality = trackRef.participant.connectionQuality;
    // LiveKit ConnectionQuality enum: Poor=0, Good=1, Excellent=2, Unknown=3
    window.dispatchEvent(new CustomEvent('host-network-quality', { detail: { quality } }));
  }, [trackRef.participant.connectionQuality]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-4 left-4 z-50 pointer-events-none select-none flex flex-col gap-2">
      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-2xl">
        {/* Host Network Indicator replacing the green dot */}
        <div className="flex items-end gap-0.5 bg-black/40 p-0.5 rounded-sm">
          <div className={`w-0.5 h-1 ${
            trackRef.participant.connectionQuality === ConnectionQuality.Poor || 
            trackRef.participant.connectionQuality === ConnectionQuality.Good || 
            trackRef.participant.connectionQuality === ConnectionQuality.Excellent 
              ? (trackRef.participant.connectionQuality === ConnectionQuality.Poor ? 'bg-red-500' : trackRef.participant.connectionQuality === ConnectionQuality.Good ? 'bg-yellow-500' : 'bg-green-500') 
              : 'bg-white/20'
          }`} />
          <div className={`w-0.5 h-1.5 ${
            trackRef.participant.connectionQuality === ConnectionQuality.Good || 
            trackRef.participant.connectionQuality === ConnectionQuality.Excellent 
              ? (trackRef.participant.connectionQuality === ConnectionQuality.Good ? 'bg-yellow-500' : 'bg-green-500') 
              : 'bg-white/20'
          }`} />
          <div className={`w-0.5 h-2 ${
            trackRef.participant.connectionQuality === ConnectionQuality.Excellent 
              ? 'bg-green-500' 
              : 'bg-white/20'
          }`} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold font-mono text-white tracking-wider">
            {stats.bitrate > 0 ? `${stats.bitrate.toFixed(1)} Mbps` : 'LIVE'}
          </span>
          <div className="w-[1px] h-3 bg-white/20" />
          <span className="text-[11px] font-bold font-mono text-white/80">
            {Math.round(stats.fps)} FPS
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Screen share view (fills entire container as overlay) ───────────────────
export function LiveKitScreenView() {
  const tracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false }
  );
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  const sendReaction = (emoji: string) => {
    const data = new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji }));
    localParticipant.publishData(data, { reliable: false });
    // Phát event cho GlobalReactions hiển thị cho chính mình
    window.dispatchEvent(new CustomEvent('local-reaction', { detail: { emoji } }));
  };

  React.useEffect(() => {
    if (!tracks[0]?.participant) return;
    const quality = tracks[0].participant.connectionQuality;
    window.dispatchEvent(new CustomEvent('host-network-quality', { detail: { quality } }));
  }, [tracks[0]?.participant?.connectionQuality]);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  React.useEffect(() => {
    const track = tracks[0]?.publication?.track;
    if (track && 'setPlayoutDelay' in track) {
      console.log('[LiveKit] Thiết lập playout delay 2.5s cho Screen Share');
      (track as any).setPlayoutDelay(2.5); // 2.5 giây buffer
    }
  }, [tracks]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        toast.error(`Không thể vào chế độ toàn màn hình: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const togglePause = () => {
    const videoEl = containerRef.current?.querySelector('video');
    if (videoEl) {
      if (isPaused) {
        videoEl.play();
      } else {
        videoEl.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    // Tìm tất cả thẻ audio trong trang (vì RoomAudioRenderer tạo audio riêng)
    const audioEls = document.querySelectorAll('audio');
    audioEls.forEach(el => el.volume = newVolume);
    
    // Cũng chỉnh luôn volume của video nếu có
    const videoEl = containerRef.current?.querySelector('video');
    if (videoEl) videoEl.volume = newVolume;
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(volume || 1);
    } else {
      handleVolumeChange(0);
    }
  };

  if (tracks.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      onDoubleClick={toggleFullscreen}
      className="group/live absolute inset-0 z-10 bg-black cursor-pointer fullscreen:!fixed fullscreen:!inset-0 fullscreen:!z-[9999] fullscreen:!w-screen fullscreen:!h-screen fullscreen:!rounded-none"
    >
      <VideoTrack
        trackRef={tracks[0] as TrackReference}
        style={{ width: '100%', height: '100%' }}
      />
      

      
      <StreamStatsOverlay trackRef={tracks[0]} />
      
      {/* Overlay Controls */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/live:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-3 px-4 pb-4">
          {/* Pause/Play */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePause();
            }}
            className="text-white transition-colors hover:text-pink-400"
            title={isPaused ? "Phát" : "Tạm dừng"}
          >
            {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2 group/volume">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="text-white transition-colors hover:text-pink-400"
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                e.stopPropagation();
                handleVolumeChange(parseFloat(e.target.value));
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-0 scale-x-0 transition-all group-hover/volume:w-20 group-hover/volume:scale-x-100 origin-left h-1 accent-white"
            />
          </div>

          {/* Live Badge */}
          <div className="flex items-center gap-1.5 rounded-md px-2 py-1">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-white">LIVE</span>
          </div>

          <div className="flex-1" />

          {/* Quality Selector */}
          {!tracks[0].participant.isLocal && <QualitySelector trackRef={tracks[0]} />}

          {/* Fullscreen */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:bg-white/20 active:scale-90"
            title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mini room view (current main-room participants grid, for community room) ─
export function MiniRoomView() {
  const participants = useParticipants();

  return (
    <div className="grid grid-cols-3 gap-3">
      {participants.slice(0, 6).map((p) => (
        <div key={p.identity} className="flex flex-col items-center gap-2">
          <div className="relative h-12 w-12 rounded-2xl border-2 border-white/5 bg-white/5 p-0.5">
            <div className="relative h-full w-full overflow-hidden rounded-xl">
              <div className="flex h-full w-full items-center justify-center bg-white/10 text-xs font-bold text-white/40">
                {p.identity?.[0]?.toUpperCase()}
              </div>
            </div>
            <div
              className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#12121A] ${p.isMicrophoneEnabled ? 'bg-green-500' : 'bg-red-500'} text-[10px] text-white`}
            >
              {p.isMicrophoneEnabled ? <Mic size={10} /> : <MicOff size={10} />}
            </div>
          </div>
          <span className="max-w-full truncate text-[10px] font-bold text-white/60">
            {p.identity}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Sub-group participant bubble (with speaking ring) ────────────────────────
function SubGroupParticipantBubble({
  participant,
  avatarUrl,
}: {
  participant: any;
  avatarUrl?: string;
}) {
  const isSpeaking = useIsSpeaking(participant);
  const micTracks = useTracks([
    { source: Track.Source.Microphone, withPlaceholder: false },
  ]);
  
  const trackRef = micTracks.find((t) => t.participant.identity === participant.identity);
  const [volume, setVolume] = useState(1);

  React.useEffect(() => {
    if (trackRef?.publication?.track && typeof (trackRef.publication.track as any).setVolume === 'function') {
      try {
        (trackRef.publication.track as any).setVolume(volume);
      } catch (e) {
        console.error('Lỗi khi set volume cho subgroup mic:', e);
      }
    }
  }, [trackRef, volume]);

  return (
    <div className="flex flex-col items-center gap-1.5 group relative">
      <div
        className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
          isSpeaking
            ? 'border-green-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]'
            : 'border-white/10'
        }`}
      >
        {/* Speaking pulse animation */}
        {isSpeaking && (
          <span className="absolute inset-0 animate-ping rounded-full border-2 border-green-400 opacity-50" />
        )}
        <div className="h-full w-full overflow-hidden rounded-full bg-white/10">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={participant.identity}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/60">
              {participant.identity?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Volume slider on hover (Tooltip style) */}
        {!participant.isLocal && trackRef && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-2xl border border-white/10 scale-75 group-hover:scale-100 origin-bottom pointer-events-none group-hover:pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVolume(volume > 0 ? 0 : 1);
              }}
              className="text-white/70 hover:text-white transition-colors"
              title={volume === 0 ? "Bật tiếng" : "Tắt tiếng"}
            >
              {volume === 0 ? <VolumeX size={12} className="text-red-500" /> : <Volume2 size={12} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => {
                e.stopPropagation();
                setVolume(parseFloat(e.target.value));
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-16 h-1 accent-white cursor-pointer"
            />
            <span className="text-[10px] font-bold font-mono text-white/90 min-w-[24px] text-right">
              {Math.round(volume * 100)}%
            </span>
            {/* Arrow */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/10" />
            {/* Bridge to prevent losing hover */}
            <div className="absolute -bottom-3 left-0 right-0 h-3 bg-transparent" />
          </div>
        )}

        {/* Mic badge */}
        <div
          className={`absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[#12121A] ${participant.isMicrophoneEnabled ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {participant.isMicrophoneEnabled ? (
            <Mic size={8} />
          ) : (
            <MicOff size={8} />
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 max-w-[56px]">
        <span className="truncate text-[10px] font-semibold text-white/50">
          {participant.identity}
        </span>
        
        {/* Network Quality Indicator */}
        <div className="flex items-end gap-0.5 bg-black/40 p-0.5 rounded-sm flex-shrink-0">
          <div className={`w-0.5 h-1 ${
            participant.connectionQuality === ConnectionQuality.Poor || 
            participant.connectionQuality === ConnectionQuality.Good || 
            participant.connectionQuality === ConnectionQuality.Excellent 
              ? (participant.connectionQuality === ConnectionQuality.Poor ? 'bg-red-500' : participant.connectionQuality === ConnectionQuality.Good ? 'bg-yellow-500' : 'bg-green-500') 
              : 'bg-white/20'
          }`} />
          <div className={`w-0.5 h-1.5 ${
            participant.connectionQuality === ConnectionQuality.Good || 
            participant.connectionQuality === ConnectionQuality.Excellent 
              ? (participant.connectionQuality === ConnectionQuality.Good ? 'bg-yellow-500' : 'bg-green-500') 
              : 'bg-white/20'
          }`} />
          <div className={`w-0.5 h-2 ${
            participant.connectionQuality === ConnectionQuality.Excellent 
              ? 'bg-green-500' 
              : 'bg-white/20'
          }`} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-group voice panel (renders inside SubGroupRoom context) ──────────────
export function SubGroupView({
  memberAvatars,
}: {
  memberAvatars?: Record<string, string | undefined>;
}) {
  const participants = useParticipants();

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-black tracking-widest text-white/30 uppercase">
        {participants.length} thành viên
      </span>
      {/* Participant grid with speaking indicators */}
      <div className="grid grid-cols-4 gap-2">
        {participants.map((p) => (
          <SubGroupParticipantBubble
            key={p.identity}
            participant={p}
            avatarUrl={memberAvatars?.[p.identity]}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Mic toggle button (renders inside SubGroupRoom context) ──────────────────
export function SubGroupMicToggle() {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  return (
    <button
      onClick={() =>
        localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled, {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        })
      }
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
        isMicrophoneEnabled
          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
      }`}
      title={isMicrophoneEnabled ? 'Tắt mic' : 'Bật mic'}
    >
      {isMicrophoneEnabled ? <Mic size={10} /> : <MicOff size={10} />}
    </button>
  );
}

export function LiveKitControls({
  isHost,
  mode = 'private',
  roomName,
}: {
  isHost: boolean;
  mode?: 'private' | 'community';
  roomName: string;
}) {
  const {
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    localParticipant,
  } = useLocalParticipant();

  return (
    <div className="absolute top-2 right-4 z-50 flex gap-2">
      {(!isHost && mode === 'private') || isHost ? (
        <button
          onClick={() =>
            localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled, {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            })
          }
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
            isMicrophoneEnabled
              ? 'bg-black/40 text-white hover:bg-black/60'
              : 'bg-red-500 text-white'
          }`}
          title="Bật/Tắt Microphone"
        >
          {isMicrophoneEnabled ? <Mic size={14} /> : <MicOff size={14} />}
        </button>
      ) : null}

      {isHost && (
        <>
          <button
            onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
              isCameraEnabled
                ? 'bg-black/40 text-white hover:bg-black/60'
                : 'bg-red-500 text-white'
            }`}
            title="Bật/Tắt Camera"
          >
            {isCameraEnabled ? <Video size={14} /> : <VideoOff size={14} />}
          </button>
          <button
            onClick={async () => {
              const enabled = !isScreenShareEnabled;
              try {
                const pub = await localParticipant.setScreenShareEnabled(enabled, {
                  resolution: { width: 1920, height: 1080 },
                  frameRate: 60,
                  contentHint: 'motion',
                  audio: true,
                } as any, {
                  videoEncoding: {
                    maxBitrate: 12_000_000,
                    maxFramerate: 60,
                    priority: 'high',
                  }
                });



                if (enabled && pub && (pub as any).track) {
                  const settings = (pub as any).track.mediaStreamTrack.getSettings();
                  console.log('[LiveKit] Thông số thực tế trình duyệt cấp:', settings);
                }
              } catch (err) {
                console.error('[LiveKit] Lỗi khi bật Screen Share:', err);
              }
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
              isScreenShareEnabled
                ? 'bg-[#C800DF] text-white shadow-[0_0_15px_rgba(200,0,223,0.4)]'
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
            title="Chia sẻ màn hình"
          >
            <ScreenShare size={14} />
          </button>
        </>
      )}
    </div>
  );
}

// ─── HLS Receiver (Listens for room metadata changes to get HLS URL) ───────
import { useEffect } from 'react';

export function HLSReceiver({ onHlsUrl }: { onHlsUrl: (url: string) => void }) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;
    
    const handleMetadataChange = (metadata: string | undefined) => {
      console.log('[HLSReceiver] Metadata nhận được:', metadata);
      if (metadata) {
        try {
          const parsed = JSON.parse(metadata);
          if (parsed.hls_url) {
            console.log('[HLSReceiver] Đã tìm thấy HLS URL:', parsed.hls_url);
            onHlsUrl(parsed.hls_url);
          }
        } catch (e) {
          console.error('[HLSReceiver] Lỗi parse JSON metadata:', e);
        }
      }
    };

    // Check initial metadata
    handleMetadataChange(room.metadata);
    
    room.on('roomMetadataChanged', handleMetadataChange);
    return () => {
      room.off('roomMetadataChanged', handleMetadataChange);
    };
  }, [room, onHlsUrl]);

  return null;
}


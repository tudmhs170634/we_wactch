'use client';

import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom as LKRoom,
  RoomAudioRenderer,
  useTracks,
  ParticipantTile,
  TrackReferenceOrPlaceholder,
  useLocalParticipant,
  useParticipants,
  useIsSpeaking,
} from '@livekit/components-react';
import { Track, VideoQuality, VideoPresets, RemoteTrackPublication, VideoPreset, LocalVideoTrack } from 'livekit-client';
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
  FileText
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
          localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
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

// ─── Provider (shared) ───────────────────────────────────────────────────────
export function LiveKitProvider({
  roomName,
  token,
  onDisconnect,
  children,
  video = false,
  audio = false,
  streamMode,
}: LiveKitContextProps & { video?: boolean; audio?: boolean }) {
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
          videoSimulcastLayers: [
            new VideoPreset(1920, 1080, 8_000_000, 60),
            new VideoPreset(1280, 720, 3_000_000, 30),
            new VideoPreset(640, 360, 800_000, 20),
          ],
          screenShareSimulcastLayers: [
            new VideoPreset(1920, 1080, 10_000_000, 60),
            new VideoPreset(1280, 720, 4_000_000, 30),
            new VideoPreset(640, 360, 1_000_000, 20),
          ],
          screenShareEncoding: {
            maxBitrate: 10_000_000,
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
      {streamMode && <StreamSettingsUpdater mode={streamMode} />}
      <RoomAudioRenderer />
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
          className="relative aspect-video h-full flex-shrink-0"
        >
          <ParticipantTile trackRef={track} />
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

  if (!isVisible) return null;

  return (
    <div className="absolute top-4 left-4 z-50 pointer-events-none select-none flex flex-col gap-2">
      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-2xl">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
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

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  if (tracks.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      onDoubleClick={toggleFullscreen}
      className="group/live absolute inset-0 z-10 bg-black cursor-pointer fullscreen:!fixed fullscreen:!inset-0 fullscreen:!z-[9999] fullscreen:!w-screen fullscreen:!h-screen fullscreen:!rounded-none"
    >
      <ParticipantTile
        trackRef={tracks[0]}
        style={{ width: '100%', height: '100%' }}
      />
      
      <StreamStatsOverlay trackRef={tracks[0]} />
      
      <div className="absolute bottom-6 right-6 z-30 opacity-0 transition-opacity group-hover/live:opacity-100 flex items-center gap-3">
        {!tracks[0].participant.isLocal && <QualitySelector trackRef={tracks[0]} />}
        
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

  return (
    <div className="flex flex-col items-center gap-1.5">
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
      <span className="max-w-[56px] truncate text-[10px] font-semibold text-white/50">
        {participant.identity}
      </span>
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
        localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
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

// ─── Media controls (host: mic + cam + screen; viewer: mic only, restricted in community) ──
export function LiveKitControls({
  isHost,
  mode = 'private',
}: {
  isHost: boolean;
  mode?: 'private' | 'community';
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
            localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
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
                  if (settings.frameRate && settings.frameRate < 60) {
                    console.warn(`[LiveKit] Trình duyệt chỉ cấp ${settings.frameRate} FPS. Hãy thử chia sẻ 'Toàn màn hình' thay vì 'Tab'.`);
                  }
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

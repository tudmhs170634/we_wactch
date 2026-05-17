'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Loader2,
  Settings,
} from 'lucide-react';
import Hls from 'hls.js';

interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

interface VideoPlayerProps {
  src: string;
  poster?: string | null;
  onAction?: (action: 'play' | 'pause' | 'seek', currentTime: number) => void;
  lastAction?: {
    action: 'play' | 'pause' | 'seek';
    currentTime: number;
    sentAt: number;
    username: string;
  } | null;
  initialState?: {
    isPlaying: boolean;
    currentTime: number;
    lastUpdated: number;
  } | null;
  onOffsetChange?: (offset: number) => void;
  serverTimeOffset?: number;
  hideControls?: boolean;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
  onGoLive?: () => void;
  initialSeek?: number;
  liveSessionDuration?: number;
}

export default function VideoPlayer({
  src,
  poster,
  onAction,
  lastAction,
  initialState,
  onOffsetChange,
  serverTimeOffset = 0,
  hideControls = false,
  onProgressUpdate,
  onGoLive,
  initialSeek,
  liveSessionDuration,
}: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentWatchTime, setCurrentWatchTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentAutoLabel, setCurrentAutoLabel] = useState(''); // Label hiển thị khi Auto
  const [tooltipTime, setTooltipTime] = useState('');
  const [tooltipLeft, setTooltipLeft] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const seekInProgress = useRef(false);

  // Flag để tránh vòng lặp: khi nhận lệnh từ socket thì không emit ngược lại
  const ignoreNextEvent = useRef(false);
  // Flag để theo dõi playback rate adjustment
  const rateAdjustTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── HLS.js Setup ──
  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHLS = src.endsWith('.m3u8') || src.includes('.m3u8?');

    if (isHLS && Hls.isSupported()) {
      console.log('[VideoPlayer] Đang tải nguồn HLS:', src);
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        setLoading(false);
        // Thu thập các mức chất lượng
        const levels: QualityLevel[] = data.levels.map(
          (level: any, idx: number) => ({
            index: idx,
            height: level.height,
            bitrate: level.bitrate,
            label: `${level.height}p`,
          })
        );
        // Sắp xếp từ cao → thấp
        levels.sort((a, b) => b.height - a.height);
        setQualityLevels(levels);
        setCurrentQuality(-1); // Auto mặc định
      });

      // Theo dõi level hiện tại khi Auto
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        const level = hls.levels[data.level];
        if (level) {
          setCurrentAutoLabel(`${level.height}p`);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = src;
      setQualityLevels([]);
    } else {
      // Regular MP4 — không có quality levels
      video.src = src;
      setQualityLevels([]);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setQualityLevels([]);
    };
  }, [src]);

  // ── Chuyển đổi chất lượng ──
  const switchQuality = (levelIndex: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = levelIndex; // -1 = auto
    setCurrentQuality(levelIndex);
    setShowQualityMenu(false);
  };

  // ── Xử lý trạng thái ban đầu khi mới join ──
  useEffect(() => {
    if (!initialState || !ref.current) return;
    const v = ref.current;

    // Tính toán giây hiện tại dựa trên thời điểm cập nhật cuối
    const elapsed = (Date.now() - initialState.lastUpdated) / 1000;
    const targetTime =
      initialState.currentTime + (initialState.isPlaying ? elapsed : 0);

    ignoreNextEvent.current = true;
    v.currentTime = targetTime;
    if (initialState.isPlaying) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [initialState]);

  // ── Xử lý lệnh từ Socket (với Playback Rate Adjustment) ──
  useEffect(() => {
    if (!lastAction || !ref.current) return;
    const v = ref.current;

    // Tính toán bù trừ độ trễ (sử dụng NTP-corrected sentAt)
    const now = Date.now() + serverTimeOffset;
    const delay = (now - lastAction.sentAt) / 1000;
    const targetTime =
      lastAction.currentTime + (lastAction.action === 'play' ? delay : 0);

    ignoreNextEvent.current = true;

    switch (lastAction.action) {
      case 'play': {
        const diff = targetTime - v.currentTime;

        if (Math.abs(diff) < 0.5) {
          // Lệch nhỏ → chỉ play, không seek
          v.play().catch(() => {});
        } else if (Math.abs(diff) < 2) {
          // Lệch vừa → chỉnh playback rate để đuổi kịp
          v.play().catch(() => {});
          const rate = diff > 0 ? 1.05 : 0.95;
          v.playbackRate = rate;

          // Khôi phục tốc độ bình thường sau khi đuổi kịp
          if (rateAdjustTimer.current) clearTimeout(rateAdjustTimer.current);
          rateAdjustTimer.current = setTimeout(
            () => {
              if (ref.current) ref.current.playbackRate = 1.0;
            },
            (Math.abs(diff) * 1000) / 0.05
          );
        } else {
          // Lệch lớn → seek trực tiếp
          v.currentTime = targetTime;
          v.play().catch(() => {});
        }
        setPlaying(true);
        break;
      }
      case 'pause':
        v.currentTime = lastAction.currentTime;
        v.pause();
        v.playbackRate = 1.0; // Reset rate khi pause
        if (rateAdjustTimer.current) clearTimeout(rateAdjustTimer.current);
        setPlaying(false);
        break;
      case 'seek':
        v.currentTime = lastAction.currentTime;
        v.playbackRate = 1.0;
        if (rateAdjustTimer.current) clearTimeout(rateAdjustTimer.current);
        if (!v.paused) v.play().catch(() => {});
        break;
    }
  }, [lastAction, serverTimeOffset]);

  // ── Tính toán độ lệch với Host ──
  useEffect(() => {
    const timer = setInterval(() => {
      if (!ref.current || !initialState) return;
      const v = ref.current;

      // Tính thời gian Host đáng lẽ đang ở đó
      const elapsed = (Date.now() - initialState.lastUpdated) / 1000;
      const hostTime =
        initialState.currentTime + (initialState.isPlaying ? elapsed : 0);

      const diff = v.currentTime - hostTime;
      onOffsetChange?.(diff);
    }, 1000);

    return () => clearInterval(timer);
  }, [initialState, onOffsetChange]);

  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;

    const newPlaying = !playing;
    if (newPlaying) v.play();
    else v.pause();
    setPlaying(newPlaying);

    // Chỉ gửi event nếu là user bấm
    if (!ignoreNextEvent.current) {
      onAction?.(newPlaying ? 'play' : 'pause', v.currentTime);
    }
    ignoreNextEvent.current = false;
  };

  const toggleMute = () => {
    if (!ref.current) return;
    ref.current.muted = !muted;
    setMuted(!muted);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = ref.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    
    setIsDragging(true);
    setProgress(pct);
    seekInProgress.current = true;

    if (liveSessionDuration) {
      // Tính thời gian thực tế muốn tua tới
      const targetLiveTime = pct * liveSessionDuration;
      setCurrentWatchTime(targetLiveTime);
      // Ánh xạ sang thời gian của thẻ video HLS
      const targetHLSTime = v.duration - (liveSessionDuration - targetLiveTime);
      v.currentTime = Math.max(0, targetHLSTime);
    } else {
      v.currentTime = pct * v.duration;
      setCurrentWatchTime(v.currentTime);
    }

    v.play().catch(() => {});
    setPlaying(true);
    onAction?.('seek', v.currentTime);
  };

  const fullscreen = () => ref.current?.requestFullscreen();

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(
      () => playing && setShowControls(false),
      3000
    );
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${m}:${String(sec).padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (rateAdjustTimer.current) clearTimeout(rateAdjustTimer.current);
    };
  }, []);

  // ── Xử lý phím tắt (Keyboard Shortcuts) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Nếu đang gõ trong ô input hoặc textarea thì không kích hoạt phím tắt
      const active = document.activeElement;
      if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return;

      const v = ref.current;
      if (!v) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          onAction?.('seek', v.currentTime);
          break;
        case 'ArrowRight':
          e.preventDefault();
          v.currentTime = Math.min(v.duration, v.currentTime + 10);
          onAction?.('seek', v.currentTime);
          break;
        case 'ArrowUp':
          e.preventDefault();
          v.volume = Math.min(1, v.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          v.volume = Math.max(0, v.volume - 0.1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playing, muted, onAction]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync state khi video tự thay đổi (ví dụ bấm nút mặc định của trình duyệt)
  const handlePlay = () => {
    setPlaying(true);
    if (!ignoreNextEvent.current) {
      onAction?.('play', ref.current?.currentTime || 0);
    }
    ignoreNextEvent.current = false;
  };

  const handlePause = () => {
    setPlaying(false);
    if (!ignoreNextEvent.current) {
      onAction?.('pause', ref.current?.currentTime || 0);
    }
    ignoreNextEvent.current = false;
  };

  return (
    <div
      className="group relative h-full w-full overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={ref}
        poster={poster ?? undefined}
        className="h-full w-full object-contain"
        onTimeUpdate={() => {
          const v = ref.current;
          if (v && !v.seeking && !isDragging) {
            // Không cập nhật currentWatchTime ở đây để thanh đỏ đứng im tại mốc thời gian đã click!
            onProgressUpdate?.(v.currentTime, v.duration);
          }
        }}
        onLoadedMetadata={() => {
          const v = ref.current;
          if (v) {
            setDuration(v.duration);
            if (initialSeek !== undefined) {
              v.currentTime = initialSeek * v.duration;
              setProgress(initialSeek);
            }
          }
        }}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onSeeked={() => {
          const v = ref.current;
          if (v) {
            v.play().catch(() => {});
            setPlaying(true);
          }
        }}
        onPlaying={() => {
          if (seekInProgress.current) {
            setIsDragging(false);
            seekInProgress.current = false;
          }
        }}
        onPlay={handlePlay}
        onPause={handlePause}
        onClick={togglePlay}
        preload="auto"
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="h-10 w-10 animate-spin text-white/60" />
        </div>
      )}

      {/* Controls overlay */}
      {!hideControls && (
        <div
          className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Buttons */}
          <div className="flex items-center gap-3 px-4 pb-2">
            <button
              onClick={togglePlay}
              className="text-white transition-colors hover:text-pink-400"
            >
              {playing ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="text-white transition-colors hover:text-pink-400"
            >
              {muted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            
            {/* Live Badge (Trạng thái đang tua) */}
            <button 
              onClick={onGoLive}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 cursor-pointer hover:bg-white/10 transition-colors"
              title="Bấm để quay lại Live"
            >
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              <span className="text-xs font-bold text-white/70">LIVE</span>
            </button>

            <span className="flex-1"></span>

            {/* Quality Selector */}
            {qualityLevels.length > 0 && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQualityMenu(!showQualityMenu);
                  }}
                  className="flex items-center gap-1 text-white transition-colors hover:text-pink-400"
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-[10px] font-bold">
                    {currentQuality === -1
                      ? 'Auto'
                      : qualityLevels.find((q) => q.index === currentQuality)
                          ?.label}
                  </span>
                </button>

                {/* Quality Dropdown */}
                {showQualityMenu && (
                  <div
                    className="absolute right-0 bottom-8 z-50 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1D]/95 py-1 shadow-2xl backdrop-blur-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="border-b border-white/10 px-3 py-1.5 text-[10px] font-bold tracking-widest text-white/30 uppercase">
                      Chất lượng
                    </div>
                    {/* Auto option */}
                    <button
                      onClick={() => switchQuality(-1)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-white/10 ${
                        currentQuality === -1
                          ? 'font-bold text-pink-400'
                          : 'text-white/80'
                      }`}
                    >
                      <span>Tự động</span>
                      {currentQuality === -1 && currentAutoLabel && (
                        <span className="text-[10px] text-white/40">
                          {currentAutoLabel}
                        </span>
                      )}
                    </button>
                    {/* Individual levels */}
                    {qualityLevels.map((level) => (
                      <button
                        key={level.index}
                        onClick={() => switchQuality(level.index)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-white/10 ${
                          currentQuality === level.index
                            ? 'font-bold text-pink-400'
                            : 'text-white/80'
                        }`}
                      >
                        <span>{level.label}</span>
                        <span className="text-[10px] text-white/30">
                          {(level.bitrate / 1000000).toFixed(1)}Mbps
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={fullscreen}
              className="text-white transition-colors hover:text-pink-400"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>

          <div
            className="group/bar relative h-1.5 w-full cursor-pointer bg-white/20"
            onClick={seek}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              
              const displayTime = (liveSessionDuration && duration > 0)
                ? liveSessionDuration - (duration - pos * duration)
                : (liveSessionDuration ? pos * liveSessionDuration : pos * duration);
                
              setTooltipTime(fmt(displayTime));
              setTooltipLeft(e.clientX - rect.left);
              setShowTooltip(true);
            }}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div
              className="relative h-full bg-red-500"
              style={{ width: `${(liveSessionDuration ? currentWatchTime / liveSessionDuration : progress) * 100}%` }}
            >
              {/* Chấm tròn đỏ (Thumb) khi hover */}
              <div className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 scale-0 rounded-full bg-red-500 transition-transform group-hover/bar:scale-100" />
            </div>

            {/* Tooltip hiển thị thời gian */}
            {showTooltip && (
              <div 
                className="absolute bottom-4 z-50 -translate-x-1/2 rounded bg-black/80 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm"
                style={{ left: `${tooltipLeft}px` }}
              >
                {tooltipTime}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Center play button (idle state) */}

    </div>
  );
}

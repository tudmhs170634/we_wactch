'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string | null;
  onAction?: (action: 'play' | 'pause' | 'seek', currentTime: number) => void;
  lastAction?: { action: 'play' | 'pause' | 'seek'; currentTime: number; sentAt: number; username: string } | null;
  initialState?: { isPlaying: boolean; currentTime: number; lastUpdated: number } | null;
  onOffsetChange?: (offset: number) => void;
}

export default function VideoPlayer({ src, poster, onAction, lastAction, initialState, onOffsetChange }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Flag để tránh vòng lặp: khi nhận lệnh từ socket thì không emit ngược lại
  const ignoreNextEvent = useRef(false);

  // ── Xử lý trạng thái ban đầu khi mới join ──
  useEffect(() => {
    if (!initialState || !ref.current) return;
    const v = ref.current;
    
    // Tính toán giây hiện tại dựa trên thời điểm cập nhật cuối
    const elapsed = (Date.now() - initialState.lastUpdated) / 1000;
    const targetTime = initialState.currentTime + (initialState.isPlaying ? elapsed : 0);
    
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

  // ── Xử lý lệnh từ Socket ──
  useEffect(() => {
    if (!lastAction || !ref.current) return;
    const v = ref.current;

    // Tính toán bù trừ độ trễ
    const delay = (Date.now() - lastAction.sentAt) / 1000;
    const targetTime = lastAction.currentTime + (lastAction.action === 'play' ? delay : 0);

    ignoreNextEvent.current = true; // Đánh dấu là thay đổi từ hệ thống

    switch (lastAction.action) {
      case 'play':
        v.currentTime = targetTime;
        v.play().catch(() => {});
        setPlaying(true);
        break;
      case 'pause':
        v.currentTime = lastAction.currentTime;
        v.pause();
        setPlaying(false);
        break;
      case 'seek':
        v.currentTime = lastAction.currentTime;
        if (!v.paused) v.play().catch(() => {});
        break;
    }
  }, [lastAction]);

  // ── Tính toán độ lệch với Host ──
  useEffect(() => {
    const timer = setInterval(() => {
      if (!ref.current || !initialState) return;
      const v = ref.current;
      
      // Tính thời gian Host đáng lẽ đang ở đó
      const elapsed = (Date.now() - initialState.lastUpdated) / 1000;
      const hostTime = initialState.currentTime + (initialState.isPlaying ? elapsed : 0);
      
      const diff = v.currentTime - hostTime;
      onOffsetChange?.(diff);
    }, 1000);

    return () => clearInterval(timer);
  }, [initialState, onOffsetChange]);

  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    
    const newPlaying = !playing;
    if (newPlaying) v.play(); else v.pause();
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
    const newTime = pct * v.duration;
    
    v.currentTime = newTime;
    onAction?.('seek', newTime);
  };

  const fullscreen = () => ref.current?.requestFullscreen();

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => playing && setShowControls(false), 3000);
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
      className="group relative w-full overflow-hidden rounded-[24px] bg-black"
      style={{ aspectRatio: '16/9' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        className="h-full w-full object-contain"
        onTimeUpdate={() => {
          const v = ref.current;
          if (v) setProgress(v.currentTime / v.duration);
        }}
        onLoadedMetadata={() => {
          if (ref.current) setDuration(ref.current.duration);
        }}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlay={handlePlay}
        onPause={handlePause}
        onClick={togglePlay}
        preload="metadata"
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="h-10 w-10 animate-spin text-white/60" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Progress bar */}
        <div
          className="mx-4 mb-3 h-1.5 cursor-pointer rounded-full bg-white/20"
          onClick={seek}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 px-4 pb-4">
          <button onClick={togglePlay} className="text-white hover:text-pink-400 transition-colors">
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          <button onClick={toggleMute} className="text-white hover:text-pink-400 transition-colors">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <span className="flex-1 text-xs font-bold text-white/60">
            {fmt(progress * duration)} / {fmt(duration)}
          </span>
          <button onClick={fullscreen} className="text-white hover:text-pink-400 transition-colors">
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Center play button (idle state) */}
      {!playing && !loading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform hover:scale-110">
            <Play className="h-7 w-7 translate-x-0.5 text-white" />
          </div>
        </button>
      )}
    </div>
  );
}

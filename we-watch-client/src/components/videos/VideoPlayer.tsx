'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string | null;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    playing ? v.pause() : v.play();
    setPlaying(!playing);
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
    v.currentTime = pct * v.duration;
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

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

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
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
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

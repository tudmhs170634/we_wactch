'use client';

import React from 'react';
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
import { Track } from 'livekit-client';
import { Mic, MicOff, Video, VideoOff, ScreenShare } from 'lucide-react';
import '@livekit/components-styles';

interface LiveKitContextProps {
  roomName: string;
  token: string;
  onDisconnect: () => void;
  children: React.ReactNode;
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
      data-lk-theme="default"
      className="flex h-full w-full flex-col"
    >
      {children}
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

// ─── Screen share view (fills entire container as overlay) ───────────────────
export function LiveKitScreenView() {
  const tracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false }
  );

  if (tracks.length === 0) return null;

  return (
    <div className="absolute inset-0 z-10 bg-black">
      <ParticipantTile
        trackRef={tracks[0]}
        style={{ width: '100%', height: '100%' }}
      />
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
            onClick={() =>
              localParticipant.setScreenShareEnabled(!isScreenShareEnabled)
            }
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

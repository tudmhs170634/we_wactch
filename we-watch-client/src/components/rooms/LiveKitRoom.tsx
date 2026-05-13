'use client';

import {
  LiveKitRoom as LKRoom,
  RoomAudioRenderer,
  useTracks,
  ParticipantTile,
  TrackReferenceOrPlaceholder,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import '@livekit/components-styles';

interface LiveKitRoomProps {
  roomName: string;
  token: string;
  onDisconnect: () => void;
}

export default function LiveKitRoom({ roomName, token, onDisconnect }: LiveKitRoomProps) {
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!token || !serverUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black/20 text-white/40 italic text-xs">
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
    { /* options */ },
  );

  return (
    <div className="flex h-full w-full gap-3 overflow-x-auto scrollbar-hide">
      {tracks.map((track: TrackReferenceOrPlaceholder) => (
        <div key={`${track.participant.identity}_${track.source}`} className="relative h-full aspect-video flex-shrink-0">
          <ParticipantTile trackRef={track} />
        </div>
      ))}
    </div>
  );
}

import { useLocalParticipant } from '@livekit/components-react';

function CustomControlBar() {
  const { isMicrophoneEnabled, isCameraEnabled, localParticipant } = useLocalParticipant();

  return (
    <div className="absolute top-2 right-4 z-50 flex gap-2">
      <button
        onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
          isMicrophoneEnabled ? 'bg-black/40 text-white hover:bg-black/60' : 'bg-red-500 text-white'
        }`}
      >
        {isMicrophoneEnabled ? <Mic size={14} /> : <MicOff size={14} />}
      </button>
      <button
        onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
          isCameraEnabled ? 'bg-black/40 text-white hover:bg-black/60' : 'bg-red-500 text-white'
        }`}
      >
        {isCameraEnabled ? <Video size={14} /> : <VideoOff size={14} />}
      </button>
    </div>
  );
}

'use client';

import React from 'react';
import Image from 'next/image';

export const AVATARS = [
  'https://res.cloudinary.com/dzjmyqqdh/image/upload/v1778045397/wewatch/avatars/avatar_1.webp',
  'https://res.cloudinary.com/dzjmyqqdh/image/upload/v1778045398/wewatch/avatars/avatar_2.webp',
  'https://res.cloudinary.com/dzjmyqqdh/image/upload/v1778045399/wewatch/avatars/avatar_3.webp',
  'https://res.cloudinary.com/dzjmyqqdh/image/upload/v1778045401/wewatch/avatars/avatar_4.webp',
  'https://res.cloudinary.com/dzjmyqqdh/image/upload/v1778045402/wewatch/avatars/avatar_5.webp',
  'https://res.cloudinary.com/dzjmyqqdh/image/upload/v1778045402/wewatch/avatars/avatar_6.webp',
  'https://res.cloudinary.com/dzjmyqqdh/image/upload/v1778045403/wewatch/avatars/avatar_7.webp',
  'https://res.cloudinary.com/dzjmyqqdh/image/upload/v1778045404/wewatch/avatars/avatar_8.webp',
  'https://res.cloudinary.com/dzjmyqqdh/image/upload/v1778045405/wewatch/avatars/avatar_9.webp',
];

interface AvatarServerProps {
  selectedAvatar?: string;
  onSelect?: (url: string) => void;
}

export default function AvatarServer({
  selectedAvatar,
  onSelect,
}: AvatarServerProps) {
  return (
    <>
      <h3 className="mb-2 text-xl font-bold whitespace-nowrap text-white">
        Avatar
      </h3>
      <p className="mb-6 text-sm whitespace-nowrap text-white/50">
        Chọn ảnh đại diện của bạn
      </p>

      <div className="grid grid-cols-3 gap-6 px-1">
        {AVATARS.map((avatar, idx) => (
          <label key={idx} className="group relative cursor-pointer">
            <input
              type="radio"
              name="avatar"
              value={avatar}
              checked={selectedAvatar === avatar}
              onChange={() => onSelect?.(avatar)}
              className="peer hidden"
            />

            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/10 bg-white/5 ring-offset-2 ring-offset-[#0A0A0B] transition-all duration-300 group-hover:scale-105 peer-checked:border-[#C800DF] peer-checked:shadow-[0_0_20px_rgba(200,0,223,0.4)] peer-checked:ring-2 peer-checked:ring-[#C800DF]">
              <Image
                src={avatar}
                alt={`Avatar ${idx + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="64px"
              />

              {/* Overlay for hover state */}
              <div className="absolute inset-0 bg-[#C800DF]/10 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            {/* Selection indicator dot if needed, but the border is enough */}
          </label>
        ))}
      </div>
    </>
  );
}

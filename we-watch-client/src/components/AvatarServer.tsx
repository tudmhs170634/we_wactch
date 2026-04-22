'use client';

import React from 'react';
import Image from 'next/image';

export const AVATARS = [
  'https://i.pinimg.com/736x/dd/cc/1e/ddcc1e5c98cf8b45e507a222ab63537c.jpg',
  'https://i.pinimg.com/736x/2b/f0/b0/2bf0b0feecc5c890ea47f90c7c7c775d.jpg',
  'https://i.pinimg.com/1200x/2a/d4/51/2ad451fd301c0efa4164f8f8cf5528d4.jpg',
  'https://i.pinimg.com/1200x/b3/a9/e9/b3a9e93c366f9fdfec0f39567533814c.jpg',
  'https://i.pinimg.com/736x/95/44/3f/95443f626f10db8be67483bb85f64946.jpg',
  'https://i.pinimg.com/736x/58/66/f3/5866f3697f115723ae5106ab6179c26e.jpg',
  'https://i.pinimg.com/736x/57/6c/a1/576ca16ccb0c131e2558bc863eba14cd.jpg',
  'https://i.pinimg.com/736x/23/86/0d/23860d1322543caa8539bad1e8f73763.jpg',
  'https://i.pinimg.com/1200x/20/ca/cb/20cacbd63df6c4a6c8aec0a34b29276f.jpg',
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

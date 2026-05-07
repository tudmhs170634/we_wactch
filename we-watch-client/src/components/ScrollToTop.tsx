'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { usePathname } from 'next/navigation';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 320);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hide in room pages
  if (pathname?.includes('/private/') || pathname?.includes('/community/')) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className="bg-primary fixed right-6 bottom-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[0_12px_30px_rgba(200,0,223,0.35)] transition hover:scale-105 active:scale-95"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default ScrollToTop;

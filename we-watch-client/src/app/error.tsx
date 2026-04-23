'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0B] p-8 shadow-2xl shadow-fuchsia-500/10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-[#C800DF]">
            <AlertCircle size={40} />
          </div>

          <h1 className="font-display mb-2 text-2xl font-bold tracking-tight text-white">
            Đã có lỗi xảy ra
          </h1>

          <p className="mb-8 font-sans text-slate-400">
            {error.message ||
              "We've encountered an unexpected error. Our team has been notified."}
          </p>

          <div className="grid w-full grid-cols-2 gap-4">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#C800DF] px-6 py-3 font-sans font-semibold text-white transition-all hover:bg-[#A600B8] active:scale-95"
            >
              <RefreshCcw size={18} />
              Thử lại
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-sans font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
            >
              <Home size={18} />
              Quay về trang chủ
            </Link>
          </div>

          {error.digest && (
            <p className="mt-6 font-mono text-[10px] tracking-widest text-slate-600 uppercase">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import Header from '@/src/components/Header';
import Background from '@/src/components/layout/Background';

export default function VideoNotFound() {
  return (
    <main className="relative min-h-screen bg-[#0A0A0B] font-sans text-slate-100">
      <Background />
      <Header />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-28 pb-20">
        <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-10 text-center">
          <h1 className="text-3xl font-black tracking-tighter text-white">
            Không tìm thấy video
          </h1>
          <p className="mt-3 text-sm font-medium text-white/60">
            Video bạn mở không tồn tại 
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/videos"
              className="bg-primary shadow-primary/20 rounded-full px-8 py-4 text-sm font-black tracking-widest text-white uppercase shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
            >
              Về trang videos
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-black tracking-widest text-white/80 uppercase transition hover:text-white"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


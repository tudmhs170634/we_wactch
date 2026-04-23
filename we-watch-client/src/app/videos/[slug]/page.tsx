import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Star } from 'lucide-react';
import Header from '@/src/components/Header';
import Background from '@/src/components/layout/Background';
import { MOCK_VIDEOS } from '@/src/constants/mockData';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return MOCK_VIDEOS.map((video) => ({ slug: video.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = MOCK_VIDEOS.find((v) => v.slug === slug);

  if (!video) {
    return {
      title: 'Video not found',
      description: 'The requested video does not exist.',
    };
  }

  return {
    title: `${video.title} - Video detail`,
    description: video.description,
    alternates: {
      canonical: `/videos/${video.slug}`,
    },
    openGraph: {
      title: video.title,
      description: video.description,
      type: 'video.other',
      url: `/videos/${video.slug}`,
      images: [{ url: video.thumbnailUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: video.title,
      description: video.description,
      images: [video.thumbnailUrl],
    },
  };
}

export default async function VideoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const video = MOCK_VIDEOS.find((v) => v.slug === slug);
  const relatedVideos = MOCK_VIDEOS.filter((v) => v.slug !== slug).slice(0, 4);

  if (!video) notFound();

  return (
    <main className="relative min-h-screen bg-[#0A0A0B] font-sans text-slate-100">
      <Background />
      <Header />

      <div className="relative z-10 mx-auto mt-14 w-full max-w-7xl px-6 pt-28 pb-20">
        <div className="glass relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5">
          <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-[320px_1fr] md:gap-10 md:p-10">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[28px] border border-white/10">
              <Image
                src={video.poster}
                alt={video.title}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <div className="text-secondary text-[10px] font-black tracking-[0.2em] uppercase">
                  {video.category}
                </div>
                <h1 className="mt-2 text-4xl font-black tracking-tighter text-white">
                  {video.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-white/70">
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    {video.year}
                  </span>
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <Clock className="h-4 w-4 text-white/70" />
                    {video.duration}
                  </span>
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <Star className="h-4 w-4 text-yellow-300/90" />
                    {video.rating}
                  </span>
                </div>
              </div>

              <div className="glass rounded-[24px] border border-white/10 bg-white/5 p-6">
                <div className="text-xs font-black tracking-widest text-white/60 uppercase">
                  Giới thiệu
                </div>
                <p className="mt-3 text-[15px] leading-7 font-medium text-white/80">
                  {video.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="glass rounded-[24px] border border-white/10 bg-white/5 p-6">
                  <div className="text-xs font-black tracking-widest text-white/60 uppercase">
                    Thông tin
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="font-black text-white/60">Đạo diễn</dt>
                      <dd className="text-right font-bold text-white/85">
                        {video.director}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="font-black text-white/60">Owner ID</dt>
                      <dd className="text-right font-bold text-white/85">
                        {video.ownerId}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="font-black text-white/60">Dung lượng</dt>
                      <dd className="text-right font-bold text-white/85">
                        {video.size}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="font-black text-white/60">Tạo lúc</dt>
                      <dd className="text-right font-bold text-white/85">
                        {new Date(video.createdAt).toLocaleDateString('vi-VN')}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="font-black text-white/60">Diễn viên</dt>
                      <dd className="text-right font-bold text-white/85">
                        {video.cast.join(', ')}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="glass rounded-[24px] border border-white/10 bg-white/5 p-6">
                  <div className="text-xs font-black tracking-widest text-white/60 uppercase">
                    Tags
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {video.tags.map((tag) => (
                      <span
                        key={tag}
                        className="group-hover:border-primary/20 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black tracking-widest text-white/80 uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/videos"
                  className="bg-primary shadow-primary/20 rounded-full px-8 py-4 text-sm font-black tracking-widest text-white uppercase shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Khám phá thêm
                </Link>
                <Link
                  href="/rooms"
                  className="rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-black tracking-widest text-white/80 uppercase transition hover:text-white"
                >
                  Tìm phòng để xem cùng
                </Link>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-primary h-2 w-2 rounded-full" />
            <h2 className="text-2xl font-black tracking-tighter text-white">
              Phim <span className="text-secondary">khác</span>
            </h2>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedVideos.map((item) => (
              <Link
                key={item.id}
                href={`/videos/${item.slug}`}
                className="glass group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 transition-all hover:border-white/20"
              >
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover opacity-75 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-90" />
                </div>

                <div className="p-4">
                  <div className="text-secondary text-[10px] font-black tracking-[0.2em] uppercase">
                    {item.category}
                  </div>
                  <div className="mt-2 line-clamp-1 text-base font-black text-white">
                    {item.title}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-bold tracking-widest text-white/60 uppercase">
                    <span>{item.duration}</span>
                    <span>{item.size}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

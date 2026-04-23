import type { Metadata } from 'next';
import VideosPageClient from '@/src/components/videos/VideosPageClient';

export const metadata: Metadata = {
  title: 'Videos',
  description: 'Explore and search synchronized videos on We Watch.',
  alternates: {
    canonical: '/videos',
  },
};

type VideosPageProps = {
  searchParams: Promise<{ search?: string }>;
};

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const { search = '' } = await searchParams;
  return <VideosPageClient initialSearch={search} />;
}

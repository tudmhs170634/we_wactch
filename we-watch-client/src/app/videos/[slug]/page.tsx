import VideoDetailClient from '@/src/components/videos/VideoDetailClient';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function VideoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <VideoDetailClient id={slug} />;
}

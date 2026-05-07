import VideoDetailClient from '@/src/components/videos/VideoDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VideoDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <VideoDetailClient id={id} />;
}

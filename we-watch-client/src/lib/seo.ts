const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'http://localhost:3001';

export const SEO = {
  siteName: 'We Watch',
  title: 'We Watch | Social Entertainment Space',
  description:
    'Synchronized digital content watching with real-time interaction.',
  url: siteUrl,
  ogImage: '/icon.png',
};


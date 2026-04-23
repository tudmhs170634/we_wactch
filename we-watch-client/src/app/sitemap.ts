import type { MetadataRoute } from 'next';
import { MOCK_VIDEOS } from '../constants/mockData';
import { SEO } from '../lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SEO.url}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SEO.url}/videos`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SEO.url}/rooms`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SEO.url}/login`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SEO.url}/register`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  const videoRoutes: MetadataRoute.Sitemap = MOCK_VIDEOS.map((video) => ({
    url: `${SEO.url}/videos/${video.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
    lastModified: new Date(video.createdAt),
  }));

  return [...staticRoutes, ...videoRoutes];
}


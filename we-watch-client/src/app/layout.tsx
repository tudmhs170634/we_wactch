import type { Metadata } from 'next';
import { Inter, Overpass_Mono } from 'next/font/google';
import './globals.css';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import { Toaster } from 'sonner';
import { SEO } from '../lib/seo';
import Providers from '../components/Providers';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
});

const overpassMono = Overpass_Mono({
  subsets: ['latin', 'latin-ext', 'vietnamese'] as any,
  weight: ['400', '700'],
  variable: '--font-overpass-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(SEO.url),
  title: {
    default: SEO.title,
    template: '%s | We Watch',
  },
  description: SEO.description,
  applicationName: SEO.siteName,
  openGraph: {
    type: 'website',
    siteName: SEO.siteName,
    title: SEO.title,
    description: SEO.description,
    url: '/',
    images: [{ url: SEO.ogImage }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.title,
    description: SEO.description,
    images: [SEO.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${overpassMono.variable} text-slate-200 antialiased`}
    >
      <body className="flex min-h-screen flex-col overflow-x-hidden font-sans" suppressHydrationWarning>
        <Providers>
          <main className="flex-1">{children}</main>
          <Footer />
          <ScrollToTop />
          <Toaster theme="dark" richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}

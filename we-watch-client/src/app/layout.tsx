import type { Metadata } from 'next';
import { Jost, Overpass_Mono } from 'next/font/google';
import './globals.css';
import Footer from '../components/Footer';
import { Toaster } from 'sonner';

const jost = Jost({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jost',
});

const overpassMono = Overpass_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-overpass-mono',
});

export const metadata: Metadata = {
  title: 'We Watch | Social Entertainment Space',
  description:
    'Synchronized digital content watching with real-time interaction.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${overpassMono.variable} text-slate-200 antialiased`}
    >
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-[#0A0A0B] font-sans">
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster theme="dark" richColors position="top-right" />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { StoreProvider } from '@/components/providers/store-provider';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://studiostack.vercel.app'),
  title: {
    default: 'StudioStack',
    template: '%s | StudioStack',
  },
  description:
    'Create podcasts, videos, SEO descriptions, and thumbnails with AI. Pay-as-you-go credits, no subscriptions.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://studiostack.vercel.app',
    siteName: 'StudioStack',
    title: 'StudioStack — AI-Powered Content for Creators',
    description:
      'Create podcasts, videos, SEO descriptions, and thumbnails with AI. Pay-as-you-go credits, no subscriptions.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudioStack — AI-Powered Content for Creators',
    description:
      'Create podcasts, videos, SEO descriptions, and thumbnails with AI. Pay-as-you-go credits, no subscriptions.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <StoreProvider>{children}</StoreProvider>
        <Toaster theme="dark" />
      </body>
    </html>
  );
}

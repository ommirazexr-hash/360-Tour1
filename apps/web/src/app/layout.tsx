import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    template: '%s | VirtualTour Admin',
    default: 'VirtualTour Platform',
  },
  description: 'Professional 360° Virtual Tour Platform — Create and publish interactive tours for factories, showrooms, campuses, and exhibitions.',
  robots: 'noindex, nofollow', // Admin panel — no indexing
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0f0f17] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

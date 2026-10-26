import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VerseStudio 4K Pro — 4K Screen Recording Studio & Bilingual AI',
  description: 'Ultra high-definition screen recording studio with Google Drive cloud sync and Bangla-to-English neural voice dubbing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

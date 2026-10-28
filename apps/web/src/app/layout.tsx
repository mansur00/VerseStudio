import type { Metadata } from 'next';
import '@verse-studio/tokens/css';
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

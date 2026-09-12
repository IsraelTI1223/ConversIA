import type { Metadata } from 'next';
import { AuthHydration } from '@/components/providers/AuthHydration';
import './globals.css';

export const metadata: Metadata = {
  title: 'ConversIA - Learn English with AI',
  description: 'AI-powered English-Spanish language learning platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body><AuthHydration>{children}</AuthHydration></body>
    </html>
  );
}

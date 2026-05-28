'use client';

import './globals.css';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dc_branding');
      if (raw) {
        const b = JSON.parse(raw);
        if (b?.primaryColor) {
          document.documentElement.style.setProperty('--brand', b.primaryColor);
          // Keep badge-new in sync with brand color
          document.documentElement.style.setProperty('--brand-rgb', hexToRgb(b.primaryColor));
        }
      }
    } catch {}
  }, []);

  return (
    <html lang="en" style={{ colorScheme: 'dark' }}>
      <head>
        <title>DragonChat AI — by Dreki Solutions</title>
        <meta name="description" content="AI Chatbot Dashboard for small businesses by Dreki Solutions LLC" />
        <meta name="theme-color" content="#A07840" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DragonChat AI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '160, 120, 64';
}

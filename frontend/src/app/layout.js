import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

export const metadata = {
  title: "NearLink - AI Service Orchestrator for the Informal Economy",
  description: "AI-powered service booking platform supporting Urdu, Roman Urdu, and English. Find, book, and track service providers instantly.",
  keywords: "service booking, AI, Pakistan, Urdu, informal economy, NearLink",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {/* Mobile / PWA essential meta */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#10b981" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NearLink" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <AuthProvider>
          <div className="bg-grid" />
          <div className="bg-glow bg-glow-1" />
          <div className="bg-glow bg-glow-2" />
          <Navbar />
          <main style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </main>
          {/* Mobile bottom navigation — visible on mobile only */}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}

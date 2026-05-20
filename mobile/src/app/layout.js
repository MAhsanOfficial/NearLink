import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: "NearLink - AI Service Orchestrator for the Informal Economy",
  description: "AI-powered service booking platform supporting Urdu, Roman Urdu, and English. Find, book, and track service providers instantly.",
  keywords: "service booking, AI, Pakistan, Urdu, informal economy, NearLink",
  manifest: "/manifest.json",
  themeColor: "#10b981",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NearLink",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="bg-grid" />
          <div className="bg-glow bg-glow-1" />
          <div className="bg-glow bg-glow-2" />
          <Navbar />
          <main style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('nearlink_theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      document.body.classList.add('light-theme');
      localStorage.setItem('nearlink_theme', 'light');
    } else {
      setTheme('dark');
      document.body.classList.remove('light-theme');
      localStorage.setItem('nearlink_theme', 'dark');
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = user
    ? user.user_type === 'admin'
      ? [
          { href: '/admin/dashboard', label: 'Admin', icon: '🛡️' },
          { href: '/admin/traces', label: 'Traces', icon: '🔍' },
        ]
      : user.user_type === 'provider'
      ? [
          { href: '/provider/dashboard', label: 'Dashboard', icon: '🏠' },
          { href: '/provider/edit', label: 'Profile', icon: '⚙️' },
        ]
      : [
          { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
          { href: '/request', label: 'New Request', icon: '✨' },
          { href: '/unified-search', label: 'Search', icon: '🔍' },
          { href: '/history', label: 'History', icon: '📋' },
        ]
    : [];

  const dashboardHref = user
    ? user.user_type === 'provider'
      ? '/provider/dashboard'
      : '/dashboard'
    : '/';

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: scrolled 
        ? (theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(26, 15, 10, 0.95)')
        : (theme === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 15, 10, 0.7)'),
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: scrolled ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(212, 175, 55, 0.15)',
      transition: 'all 0.4s ease',
      boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.6)' : 'none',
    }}>
      {/* Gold accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'linear-gradient(90deg, transparent, var(--gold), var(--green), transparent)',
        opacity: scrolled ? 0.8 : 0.3,
        transition: 'opacity 0.4s ease',
      }} />

      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 72,
      }}>
        {/* Logo */}
        <Link href={dashboardHref} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
          <img 
            src="/n-logo.svg" 
            alt="NearLink Logo" 
            style={{
              width: 64,
              height: 64,
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 16px rgba(212, 175, 55, 0.6)) drop-shadow(0 0 12px rgba(0, 177, 64, 0.4))',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1) rotate(-3deg)';
              e.currentTarget.style.filter = 'drop-shadow(0 8px 24px rgba(212, 175, 55, 0.9)) drop-shadow(0 0 20px rgba(0, 177, 64, 0.7))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              e.currentTarget.style.filter = 'drop-shadow(0 4px 16px rgba(212, 175, 55, 0.6)) drop-shadow(0 0 12px rgba(0, 177, 64, 0.4))';
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="logo-text" style={{ 
              fontSize: 26, 
              fontWeight: 900, 
              letterSpacing: '-1px',
              lineHeight: 1,
              background: 'linear-gradient(135deg, var(--gold), var(--gold-light), var(--green-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
            }}>
              NearLink
            </span>
            <span style={{ 
              fontSize: 10, 
              fontWeight: 600, 
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              opacity: 0.7,
            }}>
              AI Powered
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="desktop-nav">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} style={{
              padding: '10px 18px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: pathname === link.href ? 'var(--gold-light)' : 'var(--text-secondary)',
              background: pathname === link.href ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: pathname === link.href ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <button onClick={toggleTheme} style={{
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-light)',
            transition: 'transform 0.3s ease',
          }} title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user ? (
            <button
              onClick={logout}
              style={{
                padding: '10px 24px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--error)',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                cursor: 'pointer',
                marginLeft: 8,
                transition: 'all 0.3s ease',
              }}
            >
              Logout
            </button>
          ) : (
            <Link href="/auth/login" className="btn-primary" style={{ padding: '12px 32px', fontSize: 13, borderRadius: 12 }}>
              Get Started →
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="mobile-toggle"
          style={{
            display: 'none',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: 'var(--gold-light)',
            fontSize: 22,
            cursor: 'pointer',
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          background: 'rgba(26, 15, 10, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          padding: '12px 20px 20px',
        }}
          className="mobile-menu"
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              color: pathname === link.href ? 'var(--gold-light)' : 'var(--text-secondary)',
              background: pathname === link.href ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              textDecoration: 'none',
              marginBottom: 6,
            }}>
              <span>{link.icon}</span>{link.label}
            </Link>
          ))}
          
          <button onClick={toggleTheme} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            marginBottom: 6,
          }}>
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          {user ? (
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--error)',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              Logout
            </button>
          ) : (
            <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn-primary"
              style={{ display: 'block', textAlign: 'center', marginTop: 12, borderRadius: 12 }}>
              Get Started →
            </Link>
          )}
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
          { href: '/unified-search', label: 'Unified Search', icon: '🔍' },
          { href: '/history', label: 'History', icon: '📋' },
          { href: '/followup', label: 'Notifications', icon: '🔔' },
        ]
    : [];

  const dashboardHref = user
    ? user.user_type === 'provider'
      ? '/provider/dashboard'
      : '/dashboard'
    : '/';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled
          ? 'rgba(5, 5, 5, 0.9)'
          : 'rgba(5, 5, 5, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled
          ? '1px solid rgba(16, 185, 129, 0.15)'
          : '1px solid rgba(16, 185, 129, 0.05)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent, var(--green), var(--gold), transparent)',
        opacity: scrolled ? 0.6 : 0.2,
        transition: 'opacity 0.4s ease',
      }} />

      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 72,
      }}>
        <Link href={dashboardHref} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--green), var(--gold))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
            }}
          >
            {/* NearLink custom linked-circles logo */}
            <div style={{ position: 'relative', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid #00ff88', position: 'absolute', left: 1, top: 1, boxShadow: '0 0 8px #00ff88' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid #ffd700', position: 'absolute', right: 1, bottom: 1, boxShadow: '0 0 8px #ffd700' }} />
              <div style={{ position: 'absolute', width: 10, height: 2, background: 'linear-gradient(90deg, #00ff88, #ffd700)', transform: 'rotate(-45deg)' }} />
            </div>
          </motion.div>
          <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Near<span className="gradient-text">Link</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} style={{
              padding: '8px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: pathname === link.href ? 'var(--green-light)' : 'var(--text-secondary)',
              background: pathname === link.href ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              border: pathname === link.href ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              letterSpacing: '0.2px',
            }}>
              <span style={{ fontSize: 15 }}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
          {user ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              style={{
                padding: '8px 20px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--error)',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
                cursor: 'pointer',
                marginLeft: 8,
                transition: 'all 0.3s ease',
              }}
            >
              Logout
            </motion.button>
          ) : (
            <Link href="/auth/login" className="btn-primary" style={{ padding: '10px 28px', fontSize: 13, borderRadius: 10 }}>
              Get Started →
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="mobile-toggle"
          style={{
            display: 'none',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: 'var(--green-light)',
            fontSize: 22,
            cursor: 'pointer',
            width: 42,
            height: 42,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mobileOpen ? '✕' : '☰'}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(5, 5, 5, 0.98)',
              backdropFilter: 'blur(24px)',
              borderBottom: '1px solid rgba(16,185,129,0.1)',
              padding: '12px 20px 20px',
            }}
            className="mobile-menu"
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={link.href} onClick={() => setMobileOpen(false)} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 18px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  color: pathname === link.href ? 'var(--green-light)' : 'var(--text-secondary)',
                  background: pathname === link.href ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  textDecoration: 'none',
                  marginBottom: 4,
                }}>
                  <span>{link.icon}</span>{link.label}
                </Link>
              </motion.div>
            ))}
            {user ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => { logout(); setMobileOpen(false); }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--error)',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                Logout
              </motion.button>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn-primary"
                style={{ display: 'block', textAlign: 'center', marginTop: 12, borderRadius: 12 }}>
                Get Started →
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </motion.nav>
  );
}

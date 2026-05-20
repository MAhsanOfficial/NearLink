'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingAPI, requestAPI, followupAPI } from '@/lib/api';

const quickActions = [
  { icon: '🔧', label: 'AC Repair', query: 'Mujhe AC repair chahiye', color: 'green' },
  { icon: '🔌', label: 'Electrician', query: 'Bijli ka kaam karna hai', color: 'gold' },
  { icon: '🚿', label: 'Plumber', query: 'Pani ka pipe leak ho raha hai', color: 'green' },
  { icon: '🪚', label: 'Carpenter', query: 'Need a carpenter for furniture', color: 'gold' },
  { icon: '🎨', label: 'Painter', query: 'Ghar ki painting karwani hai', color: 'green' },
  { icon: '🧹', label: 'Cleaner', query: 'Deep cleaning service chahiye', color: 'gold' },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ bookings: 0, requests: 0, notifications: 0 });
  const [activeBookings, setActiveBookings] = useState([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.user_type === 'provider') {
        router.push('/provider/dashboard');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      Promise.allSettled([
        bookingAPI.history(),
        requestAPI.history(),
        followupAPI.notifications(),
      ]).then(([b, r, n]) => {
        if (b.status === 'fulfilled') {
          setStats(prev => ({ ...prev, bookings: b.value.length }));
          // Find in_progress bookings for the nudge
          setActiveBookings(b.value.filter(x => x.status === 'in_progress'));
        }
        if (r.status === 'fulfilled') setStats(prev => ({ ...prev, requests: r.value.length }));
        if (n.status === 'fulfilled') setStats(prev => ({ ...prev, notifications: n.value.filter(x => !x.sent).length }));
      });
    }
  }, [user]);

  if (authLoading || !user) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 Good Morning';
    if (h < 17) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  })();

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="font-mono" style={{
            fontSize: 12,
            color: 'var(--green)',
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            {greeting}
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>
            Welcome back, <span className="gradient-text">{user.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 36 }}>
            What service do you need today?
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 44 }} className="mobile-grid-1">
          {[
            { label: 'Total Bookings', value: stats.bookings, icon: '📅', color: 'var(--green-light)', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
            { label: 'Requests Made', value: stats.requests, icon: '📝', color: 'var(--gold)', bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.2)' },
            { label: 'Pending Alerts', value: stats.notifications, icon: '🔔', color: 'var(--gold-light)', bg: 'rgba(245,166,35,0.06)', border: 'rgba(245,166,35,0.15)' },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="glass-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6 }}
              style={{ padding: 28, background: s.bg, border: `1px solid ${s.border}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    {s.label}
                  </p>
                  <p className="font-orbitron stat-number" style={{ fontSize: 36, fontWeight: 800, color: s.color }}>
                    {s.value}
                  </p>
                </div>
                <motion.span
                  animate={{ y: [-3, 3, -3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ fontSize: 42 }}
                >
                  {s.icon}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Phase 8: Follow-up Nudge */}
        {activeBookings.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ marginBottom: 44, padding: '20px 24px', borderRadius: 16, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}
            className="mobile-stack">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 32 }}>🤔</div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}>Service Check-in</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Is your service with <b>{activeBookings[0].provider_name}</b> finished? Confirm to settle.
                </p>
              </div>
            </div>
            <button onClick={() => router.push(`/booking/${activeBookings[0].id}`)} className="btn-primary" 
              style={{ background: 'var(--gold)', color: 'black', padding: '10px 24px', fontSize: 13, borderRadius: 10 }}>
              Update Status
            </button>
          </motion.div>
        )}

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-card"
          style={{
            padding: 40,
            marginBottom: 44,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(245,166,35,0.05))',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, var(--green), var(--gold), var(--green))',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite',
          }} />

          <motion.div
            animate={{ y: [-5, 5, -5], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{ fontSize: 48, marginBottom: 16 }}
          >
            ✨
          </motion.div>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.5px' }}>
            Need a <span className="gradient-text">service</span>?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14, maxWidth: 400, margin: '0 auto 28px' }}>
            Describe your need in any language — Urdu, Roman Urdu, or English
          </p>
          <Link href="/request" className="btn-primary" style={{ padding: '18px 52px', fontSize: 16, borderRadius: 14, fontWeight: 800 }}>
            ✨ New Service Request
          </Link>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>Quick Actions</h3>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(16,185,129,0.2), transparent)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }} className="mobile-grid-1">
            {quickActions.map((a, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -6 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                <Link href={`/request?q=${encodeURIComponent(a.query)}`} className="glass-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  padding: '24px 18px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: a.color === 'gold'
                    ? 'linear-gradient(135deg, rgba(245,166,35,0.06), rgba(255,215,0,0.02))'
                    : 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(0,255,136,0.02))',
                  border: `1px solid ${a.color === 'gold' ? 'rgba(245,166,35,0.15)' : 'rgba(16,185,129,0.15)'}`,
                }}>
                  <motion.span
                    whileHover={{ rotate: 15, scale: 1.2 }}
                    style={{ fontSize: 36 }}
                  >
                    {a.icon}
                  </motion.span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{a.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

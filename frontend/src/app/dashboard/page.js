'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingAPI, requestAPI } from '@/lib/api';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ bookings: 0, requests: 0 });

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
      ]).then(([b, r]) => {
        if (b.status === 'fulfilled') setStats(prev => ({ ...prev, bookings: b.value.length }));
        if (r.status === 'fulfilled') setStats(prev => ({ ...prev, requests: r.value.length }));
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
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  return (
    <div className="page-wrapper" style={{ padding: '84px 20px 40px' }}>
      <div className="container">
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>{greeting}</p>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
            Welcome back, {user.name?.split(' ')[0]}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>What service do you need today?</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div className="card" style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Total Bookings</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary-green)' }}>{stats.bookings}</p>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Requests Made</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary-green)' }}>{stats.requests}</p>
          </div>
        </div>

        {/* Main CTA */}
        <div className="card" style={{ padding: 40, textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Need a service?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 15 }}>
            Describe what you need in any language
          </p>
          <Link href="/request" className="btn-primary" style={{ padding: '16px 40px', fontSize: 16 }}>
            New Service Request
          </Link>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {[
              { icon: '🔧', label: 'AC Repair', query: 'Mujhe AC repair chahiye' },
              { icon: '🔌', label: 'Electrician', query: 'Bijli ka kaam karna hai' },
              { icon: '🚿', label: 'Plumber', query: 'Pani ka pipe leak ho raha hai' },
              { icon: '🪚', label: 'Carpenter', query: 'Need a carpenter for furniture' },
              { icon: '🎨', label: 'Painter', query: 'Ghar ki painting karwani hai' },
              { icon: '🧹', label: 'Cleaner', query: 'Deep cleaning service chahiye' },
            ].map((a, i) => (
              <Link key={i} href={`/request?q=${encodeURIComponent(a.query)}`} className="card" style={{
                padding: '20px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                textDecoration: 'none',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{a.icon}</div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

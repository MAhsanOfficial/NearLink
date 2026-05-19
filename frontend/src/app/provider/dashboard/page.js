'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProviderDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user || user.user_type !== 'provider') {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
    fetchBookings();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch('http://localhost:8000/api/providers/my-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404) {
        // Profile not created yet
        router.push('/provider/setup');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch('http://localhost:8000/api/bookings/provider/my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const toggleAvailability = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch('http://localhost:8000/api/providers/my-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          availability: !profile.availability
        })
      });

      if (response.ok) {
        setProfile({ ...profile, availability: !profile.availability });
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 36 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
              PROVIDER DASHBOARD
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>
              Welcome, <span className="gradient-text">{profile.name}</span> 🔧
            </h1>
            <p className="section-subtitle" style={{ marginBottom: 0 }}>Manage your services and bookings</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={toggleAvailability}
              disabled={updating}
              className="btn-primary"
              style={{
                padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: profile.availability ? 'rgba(16,185,129,0.1)' : 'rgba(245,166,35,0.1)',
                border: profile.availability ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,166,35,0.3)',
                color: profile.availability ? 'var(--green-light)' : 'var(--gold)',
                boxShadow: 'none'
              }}
            >
              {updating ? 'Updating...' : profile.availability ? '🟢 You are Available' : '⏸ You are Busy'}
            </button>
            <button onClick={() => router.push('/provider/edit')} className="btn-secondary" style={{ padding: '12px 20px', borderRadius: 12, fontSize: 14 }}>
              ✏️ Edit Profile
            </button>
          </motion.div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 36 }}>
          {[
            { label: 'Total Bookings', value: bookings.length, icon: '📅', color: 'var(--green-light)', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
            { label: 'Trust Rating', value: `${profile.rating || 0}⭐`, icon: '🏆', color: 'var(--gold)', bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.2)' },
            { label: 'Total Reviews', value: profile.total_reviews || 0, icon: '📝', color: 'var(--green-light)', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)' },
          ].map((s, i) => (
            <motion.div key={i} className="glass-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }} whileHover={{ y: -6 }}
              style={{ padding: 28, background: s.bg, border: `1px solid ${s.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    {s.label}
                  </p>
                  <p className="font-orbitron stat-number" style={{ fontSize: 32, fontWeight: 800, color: s.color }}>
                    {s.value}
                  </p>
                </div>
                <motion.span animate={{ y: [-3, 3, -3] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: 40 }}>
                  {s.icon}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Booking Requests */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>Recent Bookings</h3>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(245,166,35,0.2), transparent)' }} />
          </div>

          {bookings.length === 0 ? (
            <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
              <motion.p animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: 56, marginBottom: 16 }}>
                📭
              </motion.p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 600 }}>No bookings yet</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>Make sure your profile is complete to attract customers</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {bookings.map((b, i) => (
                <motion.div key={b.id} className="glass-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.01 }}
                  style={{ padding: 24, borderLeft: `4px solid ${b.status === 'confirmed' ? 'var(--green)' : 'var(--gold)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <h4 style={{ fontSize: 18, fontWeight: 800 }}>{b.customer_name}</h4>
                        <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                          {b.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <span className="font-mono">📞 {b.customer_phone}</span>
                        <span>🔧 {b.service_type}</span>
                        <span style={{ color: 'var(--gold-light)' }}>⏰ Scheduled: {b.scheduled_time}</span>
                      </div>
                    </div>
                    {b.notes && (
                      <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.2)', maxWidth: 300, alignSelf: 'flex-start' }}>
                        <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>NOTES:</p>
                        <p style={{ fontSize: 13 }}>{b.notes}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

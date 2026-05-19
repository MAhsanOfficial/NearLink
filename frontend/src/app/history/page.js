'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingAPI } from '@/lib/api';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      bookingAPI.history().then(setBookings).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) return <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container" style={{ maxWidth: 850 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
            YOUR BOOKINGS
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>
            📋 Booking <span className="gradient-text">History</span>
          </h1>
          <p className="section-subtitle">All your past and current bookings</p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{ padding: 60, textAlign: 'center' }}
          >
            <motion.p
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ fontSize: 56, marginBottom: 16 }}
            >
              📭
            </motion.p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 600 }}>No bookings yet</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary"
              onClick={() => router.push('/request')}
              style={{ marginTop: 24, borderRadius: 14, padding: '14px 36px' }}
            >
              Make Your First Request →
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gap: 18 }}>
            {bookings.map((b, i) => (
              <motion.div
                key={b.id}
                className="glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4 }}
                style={{ padding: 28 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(245,166,35,0.06))',
                        border: '1px solid rgba(16,185,129,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22,
                      }}>
                        🔧
                      </div>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>{b.provider_name}</h3>
                        <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                          {b.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span>🔧 {b.service_type}</span>
                      <span>⏰ {b.scheduled_time}</span>
                      {b.price && <span style={{ color: 'var(--gold)' }}>💰 {b.price}</span>}
                    </div>
                    {b.created_at && (
                      <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, letterSpacing: '0.5px' }}>
                        Booked: {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                    onClick={() => router.push('/followup')}
                    style={{ padding: '10px 20px', fontSize: 13, borderRadius: 10 }}
                  >
                    View Follow-up
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

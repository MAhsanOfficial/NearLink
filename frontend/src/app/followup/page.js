'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { followupAPI } from '@/lib/api';

const typeIcons = {
  booking_confirmed: '✅',
  provider_assigned: '🔧',
  reminder: '⏰',
  status_update: '🚗',
  completion: '🎉',
};

const typeColors = {
  booking_confirmed: 'var(--green)',
  provider_assigned: 'var(--green-light)',
  reminder: 'var(--gold)',
  status_update: 'var(--gold-light)',
  completion: 'var(--green-neon)',
};

export default function FollowupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (user && user.user_type === 'customer') {
      followupAPI.notifications()
        .then(setNotifications)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container" style={{ maxWidth: 750 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
            NOTIFICATIONS
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>
            🔔 Follow-ups & <span className="gradient-text">Alerts</span>
          </h1>
          <p className="section-subtitle">Track your booking status and reminders</p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : notifications.length === 0 ? (
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
              🔕
            </motion.p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 600 }}>No notifications yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>Book a service to see follow-up updates</p>
          </motion.div>
        ) : (
          <div className="timeline-wrapper" style={{ position: 'relative', paddingLeft: 36 }}>
            {/* Timeline Line */}
            <div style={{
              position: 'absolute', left: 17, top: 0, bottom: 0, width: 2,
              background: 'linear-gradient(180deg, var(--green), var(--gold), transparent)',
            }} />

            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={{ position: 'relative', marginBottom: 18 }}
              >
                {/* Timeline dot */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  style={{
                    position: 'absolute', left: -29, top: 20, width: 14, height: 14, borderRadius: '50%',
                    background: n.sent ? (typeColors[n.type] || 'var(--text-muted)') : 'var(--bg-secondary)',
                    border: `2px solid ${typeColors[n.type] || 'var(--text-muted)'}`,
                    boxShadow: `0 0 12px ${typeColors[n.type] || 'rgba(255,255,255,0.1)'}`,
                    zIndex: 1,
                  }}
                />

                <div className="glass-card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <span style={{ fontSize: 26 }}>{typeIcons[n.type] || '📌'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                        <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: typeColors[n.type], letterSpacing: '1px', textTransform: 'uppercase' }}>
                          {n.type?.replace(/_/g, ' ')}
                        </span>
                        <span className={`badge ${n.sent ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                          {n.sent ? 'SENT' : 'SCHEDULED'}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{n.message}</p>
                      {n.scheduled_for && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                          📅 {new Date(n.scheduled_for).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/lib/api';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      if (user.user_type !== 'admin') {
        router.push('/dashboard');
        return;
      }
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, alarmsData] = await Promise.all([
        adminAPI.stats(),
        adminAPI.sosAlarms()
      ]);
      setStats(statsData);
      setAlarms(alarmsData);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlarm = async (id) => {
    try {
      await adminAPI.resolveSos(id);
      setAlarms(alarms.filter(a => a.id !== id));
    } catch (err) {
      alert("Failed to resolve SOS: " + err.message);
    }
  };

  if (authLoading || !user) return <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>ADMIN CONTROL</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>🛡️ System <span className="gradient-text">Dashboard</span></h1>
          <p className="section-subtitle">Oversee system health, finances, and safety alerts</p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : (
          <>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40, marginTop: 30 }}>
              <StatCard 
                title="Total Commissions" 
                value={`$${stats?.commissions?.total}`} 
                subtitle={`${stats?.commissions?.pending} pending`}
                icon="💰"
                color="var(--gold)"
              />
              <StatCard 
                title="System Revenue" 
                value={`$${stats?.commissions?.paid}`} 
                subtitle="Collected commissions"
                icon="📈"
                color="var(--green-neon)"
              />
              <StatCard 
                title="Total Bookings" 
                value={stats?.bookings?.total} 
                subtitle={`${stats?.bookings?.completion_rate}% completion`}
                icon="🤝"
                color="var(--green-light)"
              />
              <StatCard 
                title="Active Providers" 
                value={stats?.providers?.total} 
                subtitle={`${stats?.providers?.verified} verified`}
                icon="🏪"
                color="var(--gold-light)"
              />
            </div>

            {/* SOS Alarms Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800 }}>🚨 Critical <span style={{ color: '#ff4d4d' }}>SOS Alarms</span></h2>
                <span className="font-mono" style={{ fontSize: 12, background: alarms.length > 0 ? 'rgba(255, 77, 77, 0.1)' : 'rgba(255,255,255,0.05)', color: alarms.length > 0 ? '#ff4d4d' : 'var(--text-muted)', padding: '4px 12px', borderRadius: 100, border: '1px solid currentColor' }}>
                  {alarms.length} ACTIVE ALERTS
                </span>
              </div>

              {alarms.length === 0 ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                  <p style={{ fontSize: 40, marginBottom: 10 }}>✅</p>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>System Secure</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>No active safety alerts at this time.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {alarms.map((alarm) => (
                    <motion.div key={alarm.id} layout className="glass-card" style={{ padding: 20, borderLeft: '4px solid #ff4d4d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, color: '#ff4d4d' }}>SAFETY ALERT</span>
                          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {alarm.id.slice(0,8)}</span>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{alarm.provider_name || 'Service Provider'}</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                          Service: <span style={{ color: 'var(--text-primary)' }}>{alarm.service_type}</span> • 
                          Time: <span style={{ color: 'var(--text-primary)' }}>{new Date(alarm.created_at).toLocaleString()}</span>
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button 
                          onClick={() => router.push(`/booking/${alarm.id}`)}
                          className="btn-secondary" 
                          style={{ padding: '8px 16px', fontSize: 13 }}
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => resolveAlarm(alarm.id)}
                          className="btn-primary" 
                          style={{ padding: '8px 16px', fontSize: 13, background: 'var(--green-neon)', color: '#000' }}
                        >
                          Mark Resolved
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card" 
      style={{ padding: 24, borderTop: `3px solid ${color}` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px' }}>OVERVIEW</span>
      </div>
      <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
      <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4, color: 'var(--text-primary)' }}>{value}</div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</p>
    </motion.div>
  );
}

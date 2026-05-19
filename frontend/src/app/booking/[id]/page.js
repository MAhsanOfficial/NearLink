'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingAPI } from '@/lib/api';

export default function BookingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [step, setStep] = useState('confirm'); // confirm | booking | success
  const [bookingData, setBookingData] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    const data = localStorage.getItem('quickfix_booking_data');
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookingData(JSON.parse(data));
    }
  }, []);

  const handleConfirm = async () => {
    if (!bookingData) return;
    setStep('booking');
    try {
      const res = await bookingAPI.create({
        request_id: bookingData.requestId,
        provider_id: bookingData.providerId,
        scheduled_time: bookingData.scheduledTime,
        notes: '',
      });
      setResult(res);
      setStep('success');
      localStorage.removeItem('quickfix_booking_data');
    } catch (err) {
      setError(err.message);
      setStep('confirm');
    }
  };

  if (authLoading || !user) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!bookingData) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ fontSize: 64, marginBottom: 16 }}>📋</p>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>No Booking Data</h2>
        <p style={{ color: 'var(--text-secondary)' }}>We couldn't find any pending booking.</p>
        <button className="btn-primary" onClick={() => router.push('/request')} style={{ marginTop: 24, borderRadius: 12 }}>
          Make a Request
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container" style={{ maxWidth: 650 }}>
        {/* Success State */}
        {step === 'success' && result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 20 }}>
            <div className="glass-card" style={{ padding: 48, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--green-neon), var(--green), var(--green-neon))', backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }} />
              
              <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10, delay: 0.1 }}
                style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(0,255,136,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}>
                🎉
              </motion.div>
              
              <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 10, letterSpacing: '-1px' }}>Booking <span className="gradient-text">Confirmed!</span></h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 16 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{result.booking?.provider_name}</strong> has been booked for {result.booking?.service_type}
              </p>

              <div style={{ textAlign: 'left', padding: 24, borderRadius: 14, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: 32 }}>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '1px' }}>BOOKING ID</span>
                    <span className="font-mono" style={{ fontSize: 13, color: 'var(--green-light)', fontWeight: 700 }}>#{result.booking?.id?.slice(0, 8)}</span>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '1px' }}>PROVIDER</span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{result.booking?.provider_name}</span>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '1px' }}>SCHEDULE</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{result.booking?.scheduled_time}</span>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '1px' }}>EST. PRICE</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>{result.booking?.price}</span>
                  </div>
                </div>
              </div>

              {/* Scheduled Notifications */}
              {result.notifications && result.notifications.length > 0 && (
                <div style={{ textAlign: 'left', marginBottom: 32, padding: 20, borderRadius: 12, background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.1)' }}>
                  <p className="font-mono" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, marginBottom: 14, letterSpacing: '1px' }}>🤖 AI AGENT FOLLOW-UPS SCHEDULED:</p>
                  {result.notifications.map((n, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                      style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                      <div style={{ marginTop: 4, width: 8, height: 8, borderRadius: '50%', background: n.sent ? 'var(--green-neon)' : 'var(--gold-light)', boxShadow: `0 0 10px ${n.sent ? 'var(--green-neon)' : 'var(--gold-light)'}` }} />
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => router.push('/followup')} style={{ borderRadius: 12, padding: '14px 28px', fontWeight: 800 }}>
                  🔔 Track Status
                </button>
                <button className="btn-secondary" onClick={() => router.push('/dashboard')} style={{ borderRadius: 12, padding: '14px 28px' }}>
                  🏠 Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Confirm State */}
        {step !== 'success' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>CHECKOUT</div>
            <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>📋 Confirm <span className="gradient-text">Booking</span></h1>
            <p className="section-subtitle">Review your service details before confirming</p>

            {error && (
              <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', fontSize: 14 }}>
                {error}
              </div>
            )}

            <div className="glass-card" style={{ padding: 32, marginBottom: 24, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--green), var(--gold), var(--green))', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite', borderRadius: '16px 16px 0 0' }} />
              
              <div style={{ display: 'grid', gap: 20 }}>
                <div style={{ paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, letterSpacing: '1px' }}>PROVIDER</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{bookingData.providerName}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, letterSpacing: '1px' }}>SERVICE</p>
                    <p style={{ fontSize: 15, fontWeight: 600 }}>{bookingData.serviceType}</p>
                  </div>
                  <div>
                    <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, letterSpacing: '1px' }}>SCHEDULE</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold-light)' }}>{bookingData.scheduledTime}</p>
                  </div>
                </div>
                <div>
                  <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, letterSpacing: '1px' }}>ESTIMATED PRICE</p>
                  <p className="font-orbitron" style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-light)' }}>{bookingData.price}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>*Final price will be decided after inspection</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <button className="btn-secondary" onClick={() => router.back()} style={{ flex: 1, borderRadius: 12, fontWeight: 700 }}>
                ← Back
              </button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary" onClick={handleConfirm} disabled={step === 'booking'}
                style={{ flex: 2, borderRadius: 12, fontWeight: 800, opacity: step === 'booking' ? 0.7 : 1, padding: '16px' }}>
                {step === 'booking' ? '⏳ Confirming...' : '🚀 Confirm Booking'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

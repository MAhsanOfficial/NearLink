'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { traceAPI } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProviderDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [showPickupModal, setShowPickupModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [negotiatedAmountInput, setNegotiatedAmountInput] = useState('');
  const [suggestedAmount, setSuggestedAmount] = useState(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.user_type === 'customer') {
        router.push('/dashboard');
      } else {
        fetchProfile();
        fetchBookings();
      }
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch(`${API_BASE}/api/providers/my-profile`, {
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
      const response = await fetch(`${API_BASE}/api/bookings/provider/my-bookings`, {
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

  const handlePickupClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setModalError('');
    setSuggestedAmount(null);
    setShowPickupModal(true);
  };

  const updateBookingStatus = async (bookingId, newStatus, amount = null) => {
    setSubmittingStatus(true);
    setModalError('');
    try {
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          negotiated_amount: amount
        })
      });

      if (response.ok) {
        setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus, final_price: amount || b.final_price } : b));
        setShowPickupModal(false);
        setNegotiatedAmountInput('');
        setSuggestedAmount(null);
      } else {
        const error = await response.json();
        if (response.status === 403 && error.detail.includes('wallet balance')) {
          if (confirm(`${error.detail}\n\nWould you like to go to your wallet to top-up?`)) {
            router.push('/provider/wallet');
          }
        } else if (response.status === 400 && typeof error.detail === 'object') {
          setModalError(error.detail.detail);
          if (error.detail.suggested_amount) {
            setSuggestedAmount(error.detail.suggested_amount);
          }
        } else {
          setModalError(error.detail || "Failed to update status");
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setModalError("Network error. Please try again.");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const toggleAvailability = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch(`${API_BASE}/api/providers/my-profile`, {
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
            <button onClick={() => router.push('/provider/wallet')} className="btn-secondary" style={{ padding: '12px 20px', borderRadius: 12, fontSize: 14, color: 'var(--gold-light)', border: '1px solid rgba(245,166,35,0.3)' }}>
              💳 Wallet
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
                  style={{ 
                    padding: 24, 
                    borderLeft: `4px solid ${
                      b.status === 'completed' ? 'var(--green)' : 
                      b.status === 'in_progress' ? 'var(--gold)' : 
                      'var(--green-light)'
                    }` 
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <h4 style={{ fontSize: 18, fontWeight: 800 }}>{b.customer_name}</h4>
                        <span className={`badge ${
                          b.status === 'completed' ? 'badge-success' : 
                          b.status === 'in_progress' ? 'badge-warning' : 
                          'badge-success'
                        }`} style={{ fontSize: 10 }}>
                          {b.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <span className="font-mono">📞 {b.customer_phone}</span>
                        <span>🔧 {b.service_type}</span>
                        <span style={{ color: 'var(--gold-light)' }}>⏰ Scheduled: {b.scheduled_time}</span>
                        {b.final_price > 0 && <span style={{ color: 'var(--green-light)', fontWeight: 700 }}>💰 Agreed: Rs. {b.final_price}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button 
                        onClick={() => router.push(`/booking/${b.id}`)}
                        className="btn-secondary" 
                        style={{ padding: '10px 16px', fontSize: 12, borderRadius: 10, color: 'var(--gold)' }}
                      >
                        💬 Chat & Negotiate
                      </button>
                      {b.status === 'confirmed' && (
                        <button 
                          onClick={() => handlePickupClick(b.id)}
                          className="btn-primary" 
                          style={{ padding: '10px 20px', fontSize: 12, borderRadius: 10 }}
                        >
                          ⚡ Pickup Job
                        </button>
                      )}
                      {b.status === 'in_progress' && (
                        <button 
                          onClick={() => updateBookingStatus(b.id, 'completed')}
                          className="btn-primary" 
                          style={{ padding: '10px 20px', fontSize: 12, borderRadius: 10, background: 'var(--green)' }}
                        >
                          ✅ Complete Job
                        </button>
                      )}
                      
                      {b.notes && (
                        <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.2)', maxWidth: 250 }}>
                          <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>NOTES:</p>
                          <p style={{ fontSize: 12, lineHeight: 1.4 }}>{b.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Pickup Negotiation Modal */}
      {showPickupModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)'
        }}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card" style={{ maxWidth: 450, width: '100%', padding: 32, border: '1px solid var(--gold-light)' }}>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>⚡ Pickup Job</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Enter the final negotiated amount agreed upon in the chat. The AI will verify this against your conversation history.
            </p>

            <div style={{ marginBottom: 24 }}>
              <label className="font-mono" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: '1px' }}>NEGOTIATED AMOUNT (RS.)</label>
              <input 
                type="number"
                autoFocus
                value={negotiatedAmountInput}
                onChange={(e) => setNegotiatedAmountInput(e.target.value)}
                placeholder="e.g. 1500"
                style={{
                  width: '100%', padding: '16px', borderRadius: 12, 
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,166,35,0.3)',
                  color: 'white', fontSize: 18, fontWeight: 700
                }}
              />
              {modalError && (
                <div style={{ 
                  marginTop: 12, padding: '10px 14px', borderRadius: 10, 
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', 
                  color: 'var(--error)', fontSize: 12, lineHeight: 1.4 
                }}>
                  {modalError}
                </div>
              )}
              {suggestedAmount && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setNegotiatedAmountInput(suggestedAmount.toString());
                      setModalError('');
                    }}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 10,
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)',
                      color: 'var(--green-light)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    ✨ Finalise (Ai reviewed ammount: Rs. {suggestedAmount})
                  </motion.button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => { setShowPickupModal(false); setNegotiatedAmountInput(''); }}
                className="btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: 12 }}
              >
                Cancel
              </button>
              <button 
                onClick={() => updateBookingStatus(selectedBookingId, 'in_progress', parseFloat(negotiatedAmountInput))}
                disabled={submittingStatus || !negotiatedAmountInput}
                className="btn-primary" style={{ flex: 2, padding: '14px', borderRadius: 12, background: 'var(--gold)', color: 'black' }}
              >
                {submittingStatus ? 'Verifying...' : '⚡ Confirm & Pickup'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

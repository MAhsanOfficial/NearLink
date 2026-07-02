'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProviderDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch(`${API_BASE}/api/providers/my-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404) {
        router.push('/provider/setup');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch(`${API_BASE}/api/bookings/provider/my-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, []);

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
  }, [user, authLoading, router, fetchProfile, fetchBookings]);

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
        body: JSON.stringify({ availability: !profile.availability })
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
    <div className="page-wrapper" style={{ padding: '84px 20px 40px' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 14, color: 'var(--primary-green)', marginBottom: 4, fontWeight: 600 }}>PROVIDER DASHBOARD</p>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Welcome, {profile.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Manage your services and bookings</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={toggleAvailability}
              disabled={updating}
              className="btn-primary"
              style={{
                background: profile.availability ? 'var(--primary-green)' : '#e5e5e5',
                color: profile.availability ? 'white' : 'var(--text-secondary)',
              }}
            >
              {updating ? 'Updating...' : profile.availability ? '🟢 Available' : '⏸ Busy'}
            </button>
            <button onClick={() => router.push('/provider/wallet')} className="btn-secondary">
              💳 Wallet
            </button>
            <button onClick={() => router.push('/provider/edit')} className="btn-secondary">
              ✏️ Edit Profile
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div className="card" style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Total Bookings</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary-green)' }}>{bookings.length}</p>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Rating</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary-green)' }}>{profile.rating || 0}⭐</p>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Total Reviews</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary-green)' }}>{profile.total_reviews || 0}</p>
          </div>
        </div>

        {/* Bookings */}
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Recent Bookings</h3>

          {bookings.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>📭</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>No bookings yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {bookings.map((b) => (
                <div key={b.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 700 }}>{b.customer_name}</h4>
                        <span className={`badge ${
                          b.status === 'completed' ? 'badge-success' : 
                          b.status === 'in_progress' ? 'badge-warning' : 
                          'badge-info'
                        }`}>
                          {b.status.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        📞 {b.customer_phone}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        🔧 {b.service_type}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                        ⏰ {b.scheduled_time}
                      </div>
                      {b.final_price > 0 && (
                        <div style={{ fontSize: 14, color: 'var(--primary-green)', fontWeight: 600, marginTop: 4 }}>
                          💰 Rs. {b.final_price}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => router.push(`/booking/${b.id}`)}
                      className="btn-primary"
                      style={{ padding: '10px 20px', fontSize: 14 }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

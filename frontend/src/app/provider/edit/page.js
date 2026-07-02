
'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const SERVICE_TYPES = [
  '⚡ Electrician',
  '🔧 Plumber',
  '❄️ AC Repair',
  '🪚 Carpenter',
  '🎨 Painter',
  '🧹 Cleaner',
  '🔨 Mason',
  '🚗 Mechanic'
];

export default function ProviderEditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [businessName, setBusinessName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [servicesOffered, setServicesOffered] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch(`${API_BASE}/api/providers/my-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBusinessName(data.name || '');
        setServiceType(SERVICE_TYPES.find(t => t.includes(data.service_type)) || '');
        setArea(data.area || '');
        setAddress(data.address || '');
        setLatitude(data.latitude?.toString() || '');
        setLongitude(data.longitude?.toString() || '');
        setPhone(data.phone || '');
        setDescription(data.description || '');
        setServicesOffered(data.services_offered?.join(', ') || '');
        setWorkingHours(data.working_hours || '');
        setPriceRange(data.price_range || '');
      }
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
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
      }
    }
  }, [user, authLoading, router, fetchProfile]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
        },
        () => alert('Could not get location. Please enter manually.')
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch(`${API_BASE}/api/providers/my-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: businessName,
          service_type: serviceType.replace(/[⚡🔧❄️🪚🎨🧹🔨🚗]\s*/g, '').trim(),
          area,
          address,
          latitude: parseFloat(latitude) || null,
          longitude: parseFloat(longitude) || null,
          phone,
          description,
          services_offered: servicesOffered.split(',').map(s => s.trim()).filter(s => s),
          working_hours: workingHours,
          price_range: priceRange
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Update failed');
      }

      setSuccess('✅ Profile updated successfully!');
      setTimeout(() => router.push('/provider/dashboard'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', padding: '100px 20px 60px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 750 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32, textAlign: 'center' }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>PROFILE EDITOR</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: '-1px' }}>
            Edit <span className="gradient-text">Business Profile</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Update your business information and services</p>
        </motion.div>

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', fontSize: 14 }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--green-light)', fontSize: 14 }}>
            {success}
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: 40, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold))', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite', borderRadius: '16px 16px 0 0' }} />
          
          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: 8 }}>📋 Basic Information</h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>BUSINESS NAME *</label>
              <input type="text" className="input-field" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.5px' }}>SERVICE CATEGORY *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {SERVICE_TYPES.map((type) => (
                  <button key={type} type="button" onClick={() => setServiceType(type)}
                    style={{
                      padding: '12px 14px', borderRadius: 10,
                      border: serviceType === type ? '2px solid var(--gold)' : '1px solid rgba(245,166,35,0.12)',
                      background: serviceType === type ? 'rgba(245,166,35,0.1)' : 'rgba(245,166,35,0.03)',
                      color: serviceType === type ? 'var(--gold-light)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.2s'
                    }}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>PHONE NUMBER *</label>
              <input type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, marginTop: 36, color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: 8 }}>📍 Location</h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>AREA/LOCALITY *</label>
              <input type="text" className="input-field" value={area} onChange={(e) => setArea(e.target.value)} required />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>FULL ADDRESS *</label>
              <textarea className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required />
            </div>

            <div style={{ marginBottom: 28, padding: 18, borderRadius: 12, background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.15)' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.5px' }}>GPS COORDINATES *</label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input type="number" step="any" className="input-field" placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} required style={{ flex: 1 }} />
                <input type="number" step="any" className="input-field" placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} required style={{ flex: 1 }} />
              </div>
              <button type="button" onClick={getCurrentLocation} className="btn-secondary" style={{ width: '100%', fontSize: 13, border: '1px solid rgba(245,166,35,0.3)', color: 'var(--gold)' }}>
                📍 Use Current Location
              </button>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, marginTop: 36, color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: 8 }}>✨ Business Details</h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>BUSINESS DESCRIPTION</label>
              <textarea className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>SERVICES OFFERED (COMMA SEPARATED)</label>
              <input type="text" className="input-field" value={servicesOffered} onChange={(e) => setServicesOffered(e.target.value)} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>WORKING HOURS</label>
              <input type="text" className="input-field" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} />
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>PRICE RANGE</label>
              <input type="text" className="input-field" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 14 }}>
              <button type="button" onClick={() => router.push('/provider/dashboard')} className="btn-secondary" style={{ flex: 1, borderRadius: 12 }}>
                Cancel
              </button>
              <motion.button type="submit" className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ flex: 2, padding: '16px', borderRadius: 12, fontWeight: 800, background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', opacity: saving ? 0.7 : 1 }} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

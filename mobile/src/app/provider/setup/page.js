'use client';
import { useState, useEffect } from 'react';
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

export default function ProviderSetupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [businessName, setBusinessName] = useState(user?.name || '');
  const [serviceType, setServiceType] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [description, setDescription] = useState('');
  const [servicesOffered, setServicesOffered] = useState('');
  const [workingHours, setWorkingHours] = useState('9 AM - 6 PM');
  const [priceRange, setPriceRange] = useState('Rs. 1000-3000');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.user_type === 'customer') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setBusinessName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

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
    setLoading(true);

    try {
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch(`${API_BASE}/api/providers/register`, {
        method: 'POST',
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
        throw new Error(data.detail || 'Registration failed');
      }

      alert('✅ Provider profile created successfully!');
      router.push('/provider/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', padding: '100px 20px 60px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>PROVIDER SETUP</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: '-1px' }}>Build Your <span className="gradient-text">Profile</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Complete your business details to start getting customers</p>
        </motion.div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: step >= i ? 'var(--gold)' : 'rgba(245,166,35,0.2)', transition: 'all 0.3s' }} />
          ))}
        </div>

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }}>
          <motion.div className="glass-card" style={{ padding: 40, position: 'relative' }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={step}>

            {/* Top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold))', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite', borderRadius: '16px 16px 0 0' }} />

            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div style={{ display: 'grid', gap: 20 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold-light)' }}>1. Basic Information</h3>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>BUSINESS NAME</label>
                  <input type="text" className="input-field" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>PRIMARY SERVICE CATEGORY</label>
                  <select className="input-field" value={serviceType} onChange={e => setServiceType(e.target.value)} required style={{ WebkitAppearance: 'none', background: 'rgba(16,185,129,0.03) url("data:image/svg+xml;utf8,<svg fill=\'%23f0f5f0\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>") no-repeat right 12px center' }}>
                    <option value="" disabled style={{ color: '#000' }}>Select a service</option>
                    {SERVICE_TYPES.map(type => <option key={type} value={type} style={{ color: '#000' }}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>CONTACT PHONE NUMBER</label>
                  <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} required />
                </div>
              </div>
            )}

            {/* STEP 2: Location */}
            {step === 2 && (
              <div style={{ display: 'grid', gap: 20 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold-light)' }}>2. Service Location</h3>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>PRIMARY AREA</label>
                  <input type="text" className="input-field" placeholder="e.g., Gulshan-e-Iqbal, DHA" value={area} onChange={e => setArea(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>COMPLETE ADDRESS</label>
                  <textarea className="input-field" rows={2} value={address} onChange={e => setAddress(e.target.value)} required />
                </div>
                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.15)' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.5px' }}>GPS COORDINATES (HELPS AI MATCHING)</label>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <input type="text" className="input-field" placeholder="Latitude" value={latitude} onChange={e => setLatitude(e.target.value)} />
                    <input type="text" className="input-field" placeholder="Longitude" value={longitude} onChange={e => setLongitude(e.target.value)} />
                  </div>
                  <button type="button" onClick={getCurrentLocation} className="btn-secondary" style={{ width: '100%', fontSize: 13, border: '1px solid rgba(245,166,35,0.3)', color: 'var(--gold)' }}>
                    📍 Get Current Location
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Details */}
            {step === 3 && (
              <div style={{ display: 'grid', gap: 20 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold-light)' }}>3. Business Details</h3>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>SERVICES OFFERED (COMMA SEPARATED)</label>
                  <input type="text" className="input-field" placeholder="e.g. AC Gas Filling, AC Service, Installation" value={servicesOffered} onChange={e => setServicesOffered(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>WORKING HOURS</label>
                  <input type="text" className="input-field" placeholder="e.g. 9 AM - 6 PM" value={workingHours} onChange={e => setWorkingHours(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>BASE PRICE RANGE</label>
                  <input type="text" className="input-field" placeholder="e.g. Rs. 1000 - 3000" value={priceRange} onChange={e => setPriceRange(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>SHORT DESCRIPTION</label>
                  <textarea className="input-field" rows={3} placeholder="Describe your experience and why customers should choose you..." value={description} onChange={e => setDescription(e.target.value)} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              {step > 1 && (
                <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)} style={{ flex: 1 }}>
                  Back
                </button>
              )}
              <motion.button type="submit" className="btn-primary" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ flex: 2, background: step === 3 ? 'linear-gradient(135deg, var(--gold), var(--gold-dark))' : 'var(--gradient-primary)' }}>
                {loading ? 'Saving...' : step === 3 ? '✅ Complete Profile' : 'Next Step →'}
              </motion.button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}

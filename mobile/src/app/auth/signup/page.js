'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState('customer');
  // Customer location fields
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

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
      const signupData = {
        name,
        email,
        password,
        phone,
        user_type: userType
      };
      
      // Add location for customers
      if (userType === 'customer' && area && address) {
        signupData.area = area;
        signupData.address = address;
        signupData.latitude = latitude ? parseFloat(latitude) : null;
        signupData.longitude = longitude ? parseFloat(longitude) : null;
      }
      
      await signup(signupData.name, signupData.email, signupData.password, signupData.phone, signupData.user_type, signupData.area, signupData.address, signupData.latitude, signupData.longitude);
      
      if (userType === 'provider') {
        router.push('/provider/setup');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.06), transparent 70%)',
        top: '-10%', right: '-10%', filter: 'blur(100px)',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,166,35,0.05), transparent 70%)',
        bottom: '-10%', left: '-5%', filter: 'blur(80px)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 120 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: 480, padding: 44, margin: 20, position: 'relative' }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, var(--green), var(--gold), var(--green))',
          backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite',
          borderRadius: '16px 16px 0 0',
        }} />

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            animate={{ y: [-5, 5, -5], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{ fontSize: 44, marginBottom: 14 }}
          >
            🚀
          </motion.div>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px' }}>
            Create <span className="gradient-text">Account</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
            Join NearLink and book services instantly
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '14px 18px', borderRadius: 12, marginBottom: 20,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--error)', fontSize: 14, fontWeight: 500,
            }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          {/* User Type Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '1px', textTransform: 'uppercase' }}>
              I am a
            </label>
            <div style={{ display: 'flex', gap: 12 }} className="mobile-stack">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUserType('customer')}
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: 12,
                  border: userType === 'customer' ? '2px solid var(--green)' : '1px solid rgba(16,185,129,0.12)',
                  background: userType === 'customer' ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.03)',
                  color: userType === 'customer' ? 'var(--green-light)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 700, transition: 'all 0.3s',
                  boxShadow: userType === 'customer' ? '0 4px 20px rgba(16,185,129,0.15)' : 'none',
                }}
              >
                👤 Customer
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUserType('provider')}
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: 12,
                  border: userType === 'provider' ? '2px solid var(--gold)' : '1px solid rgba(245,166,35,0.12)',
                  background: userType === 'provider' ? 'rgba(245,166,35,0.1)' : 'rgba(245,166,35,0.03)',
                  color: userType === 'provider' ? 'var(--gold-light)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 700, transition: 'all 0.3s',
                  boxShadow: userType === 'provider' ? '0 4px 20px rgba(245,166,35,0.15)' : 'none',
                }}
              >
                🔧 Service Provider
              </motion.button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center' }}>
              {userType === 'customer' ? 'Find and book local services' : 'Register your business and get customers'}
            </p>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {userType === 'provider' ? 'Business Name' : 'Full Name'}
            </label>
            <input type="text" className="input-field" placeholder={userType === 'provider' ? 'Ahmed Electricals' : 'Ahmed Khan'} value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Email</label>
            <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Phone {userType === 'customer' && '(optional)'}
            </label>
            <input type="tel" className="input-field" placeholder="0300-1234567" value={phone} onChange={e => setPhone(e.target.value)} required={userType === 'provider'} />
          </div>

          {/* Customer Location Fields */}
          {userType === 'customer' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                padding: 20, borderRadius: 14,
                background: 'rgba(16,185,129,0.04)',
                border: '1px solid rgba(16,185,129,0.12)',
                marginBottom: 18,
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, color: 'var(--green-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                📍 Your Location
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>(Optional)</span>
              </h3>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Area</label>
                <input type="text" className="input-field" placeholder="e.g., Shah Latif Town, Gulshan, DHA" value={area} onChange={e => setArea(e.target.value)} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Address</label>
                <textarea className="input-field" placeholder="Your complete address" value={address} onChange={e => setAddress(e.target.value)} rows={2} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>GPS Coordinates</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input type="number" step="any" className="input-field" placeholder="Latitude" value={latitude} onChange={e => setLatitude(e.target.value)} style={{ flex: 1 }} />
                  <input type="number" step="any" className="input-field" placeholder="Longitude" value={longitude} onChange={e => setLongitude(e.target.value)} style={{ flex: 1 }} />
                </div>
                <button type="button" onClick={getCurrentLocation} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>
                  📍 Use Current Location
                </button>
              </div>
            </motion.div>
          )}

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>

          <motion.button
            type="submit"
            className="btn-primary"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%', padding: '16px', opacity: loading ? 0.7 : 1, borderRadius: 14, fontSize: 15, fontWeight: 800 }}
          >
            {loading ? 'Creating Account...' : 'Create Account →'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--green-light)', textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}

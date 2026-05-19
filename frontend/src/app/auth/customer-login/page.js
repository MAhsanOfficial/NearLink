'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      
      // Check if user is actually a customer
      if (result.user.user_type !== 'customer') {
        setError('This is a customer login. Please use provider login.');
        setLoading(false);
        return;
      }
      
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
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

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 120 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: 460, padding: 44, margin: 20, position: 'relative' }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, var(--green), var(--green-light), var(--green))',
          backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite',
          borderRadius: '16px 16px 0 0',
        }} />

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontSize: 44, marginBottom: 14,
              width: 80, height: 80, borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,255,136,0.05))',
              border: '1px solid rgba(16,185,129,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 8px 30px rgba(16,185,129,0.2)',
            }}
          >
            👤
          </motion.div>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px' }}>
            Customer <span className="gradient-text">Login</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>Login to book services</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '14px 18px', borderRadius: 12, marginBottom: 20,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--error)', fontSize: 14,
            }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Email</label>
            <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <motion.button
            type="submit"
            className="btn-primary"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%', padding: '16px', opacity: loading ? 0.7 : 1, borderRadius: 14, fontSize: 15, fontWeight: 800 }}
          >
            {loading ? 'Logging in...' : 'Login as Customer →'}
          </motion.button>
        </form>

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Don't have an account?{' '}
            <Link href="/auth/signup" style={{ color: 'var(--green-light)', textDecoration: 'none', fontWeight: 700 }}>Sign Up</Link>
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Are you a service provider?{' '}
            <Link href="/auth/provider-login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 700 }}>Provider Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

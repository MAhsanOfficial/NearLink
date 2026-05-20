'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@nearlink.com');
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
      
      if (result.user.user_type !== 'admin') {
        setError('This is the administrator login. Standard accounts are restricted.');
        setLoading(false);
        return;
      }
      
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.03), transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(120px)',
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: 460, padding: 44, margin: 20, position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #555, #fff, #555)',
          backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite',
          borderRadius: '16px 16px 0 0',
        }} />

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{
              fontSize: 44, marginBottom: 14,
              width: 80, height: 80, borderRadius: 20,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 8px 30px rgba(255,255,255,0.05)',
            }}
          >
            🛡️
          </motion.div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
            ADMIN <span className="gradient-text">CONSOLE</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8, letterSpacing: '0.5px' }}>Restricted System Access</p>
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Identifier</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="admin@nearlink.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}
            />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '1px', textTransform: 'uppercase' }}>Security Key</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}
            />
          </div>
          <motion.button
            type="submit"
            className="btn-primary"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              width: '100%', 
              padding: '16px', 
              opacity: loading ? 0.7 : 1, 
              borderRadius: 14, 
              fontSize: 14, 
              fontWeight: 800, 
              letterSpacing: '1px',
              background: 'var(--text-primary)',
              color: 'var(--bg-primary)'
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS DASHBOARD →'}
          </motion.button>
        </form>

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Not an administrator?{' '}
            <Link href="/auth/login" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700 }}>Return to Safety</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

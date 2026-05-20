'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)',
        top: '10%',
        right: '-10%',
        filter: 'blur(100px)',
        animation: 'floatGlow1 12s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,166,35,0.06), transparent 70%)',
        bottom: '10%',
        left: '-5%',
        filter: 'blur(80px)',
        animation: 'floatGlow2 15s ease-in-out infinite',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 120 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: 520, padding: 48, margin: 20, position: 'relative' }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, var(--green), var(--gold), var(--green))',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
          borderRadius: '16px 16px 0 0',
        }} />

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: 52, marginBottom: 16 }}
          >
            🔗
          </motion.div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px' }}>
            Welcome to <span className="gradient-text">NearLink</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 10 }}>Choose your login type</p>
        </div>

        <div style={{ display: 'grid', gap: 16, marginBottom: 28 }}>
          {/* Customer Login */}
          <Link href="/auth/customer-login" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card"
              style={{
                padding: 28,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(0,255,136,0.03))',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <motion.div
                  whileHover={{ rotate: 10 }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,255,136,0.05))',
                    border: '1px solid rgba(16,185,129,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 30,
                    boxShadow: '0 4px 20px rgba(16,185,129,0.15)',
                  }}
                >
                  👤
                </motion.div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4, color: 'var(--green-light)' }}>
                    Customer Login
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Book services from local providers
                  </p>
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ fontSize: 22, color: 'var(--green)' }}
                >
                  →
                </motion.div>
              </div>
            </motion.div>
          </Link>

          {/* Provider Login */}
          <Link href="/auth/provider-login" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card"
              style={{
                padding: 28,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(255,215,0,0.03))',
                border: '1px solid rgba(245,166,35,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <motion.div
                  whileHover={{ rotate: 10 }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(255,215,0,0.05))',
                    border: '1px solid rgba(245,166,35,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 30,
                    boxShadow: '0 4px 20px rgba(245,166,35,0.15)',
                  }}
                >
                  🔧
                </motion.div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4, color: 'var(--gold-light)' }}>
                    Provider Login
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Manage your business and get customers
                  </p>
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  style={{ fontSize: 22, color: 'var(--gold)' }}
                >
                  →
                </motion.div>
              </div>
            </motion.div>
          </Link>

          {/* Admin Login */}
          <Link href="/auth/admin-login" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card"
              style={{
                padding: 20,
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                marginTop: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20
                }}>
                  🛡️
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Admin Console
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    System statistics & emergency protocols
                  </p>
                </div>
                <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>→</div>
              </div>
            </motion.div>
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" style={{ color: 'var(--green-light)', textDecoration: 'none', fontWeight: 700 }}>
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

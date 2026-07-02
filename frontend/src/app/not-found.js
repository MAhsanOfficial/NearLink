'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-wrapper" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ maxWidth: 500 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 style={{ 
            fontSize: '120px', 
            fontWeight: 900, 
            margin: 0,
            lineHeight: 1,
            background: 'linear-gradient(135deg, var(--green), var(--gold))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-5px'
          }}>
            404
          </h1>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, marginTop: 10 }}>
            Lost in <span className="gradient-text">Cyberspace?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 16, lineHeight: 1.6 }}>
            The page you&apos;re looking for has drifted out of reach or never existed in this dimension.
          </p>
          
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/" className="btn-primary" style={{ padding: '12px 30px' }}>
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.05), transparent 70%)',
        top: '20%', left: '10%', filter: 'blur(80px)', zIndex: -1
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,166,35,0.05), transparent 70%)',
        bottom: '20%', right: '10%', filter: 'blur(80px)', zIndex: -1
      }} />
    </div>
  );
}

'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ fontSize: 64, marginBottom: 20 }}
        >
          ⚠️
        </motion.div>
        
        <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>
          Something went <span className="gradient-text">wrong</span>
        </h2>
        
        <div className="glass-card" style={{ padding: 20, marginBottom: 30, textAlign: 'left', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
          <p className="font-mono" style={{ fontSize: 13, color: 'var(--error)', wordBreak: 'break-all' }}>
            {error?.message || "An unexpected system error occurred."}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            className="btn-primary"
            style={{ padding: '12px 30px' }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="btn-secondary"
            style={{ padding: '12px 30px' }}
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

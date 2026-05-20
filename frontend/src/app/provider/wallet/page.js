'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { providerAPI } from '@/lib/api';

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [wallet, setWallet] = useState({ wallet_balance: 0, commission_rate: 0.1 });
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!user || user.user_type !== 'provider') {
      router.push('/auth/login');
      return;
    }
    fetchWallet();
  }, [user, router]);

  const fetchWallet = async () => {
    try {
      const data = await providerAPI.wallet();
      setWallet(data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (amount) => {
    const val = amount || parseFloat(topupAmount);
    if (!val || val <= 0) return;

    setProcessing(true);
    try {
      const res = await providerAPI.topup(val);
      setWallet({ ...wallet, wallet_balance: res.new_balance });
      setMessage({ text: `Successfully added Rs. ${val} to your wallet!`, type: 'success' });
      setTopupAmount('');
    } catch (error) {
      setMessage({ text: 'Top-up failed. Please try again.', type: 'error' });
    } finally {
      setProcessing(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
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
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container" style={{ maxWidth: 600 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
            FINANCIAL CENTER
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>
            Provider <span className="gradient-text">Wallet</span> 💳
          </h1>
          <p className="section-subtitle">Manage your funds and platform commissions</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="glass-card" style={{ 
            padding: 40, 
            textAlign: 'center', 
            marginBottom: 32, 
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(245,166,35,0.05))',
            position: 'relative',
            overflow: 'hidden'
          }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--green), var(--gold), var(--green))', backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }} />
          
          <p className="font-mono" style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '2px' }}>CURRENT BALANCE</p>
          <h2 className="font-orbitron" style={{ fontSize: 56, fontWeight: 900, color: wallet.wallet_balance < 0 ? 'var(--error)' : 'var(--green-light)', marginBottom: 8 }}>
            Rs. {wallet.wallet_balance.toLocaleString()}
          </h2>
          
          {wallet.wallet_balance < 0 && (
            <div style={{ color: 'var(--error)', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
              ⚠️ Balance is low. Top-up required to accept new jobs.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24, padding: '16px', borderRadius: 12, background: 'rgba(0,0,0,0.2)' }}>
            <div>
              <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>COMMISSION RATE</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>{(wallet.commission_rate * 100).toFixed(0)}%</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>STATUS</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: wallet.wallet_balance >= 0 ? 'var(--green)' : 'var(--error)' }}>
                {wallet.wallet_balance >= 0 ? 'ACTIVE' : 'RESTRICTED'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Top-up Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Quick Top-up</h3>
          
          {message.text && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              style={{ 
                padding: '12px 16px', borderRadius: 10, marginBottom: 20, 
                background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: message.type === 'success' ? 'var(--green-light)' : 'var(--error)',
                fontSize: 14
              }}>
              {message.text}
            </motion.div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[500, 1000, 2000].map(amount => (
              <motion.button key={amount} whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }}
                onClick={() => handleTopup(amount)} disabled={processing}
                className="glass-card" style={{ padding: '16px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ADD</p>
                <p style={{ fontWeight: 800, fontSize: 16 }}>Rs. {amount}</p>
              </motion.button>
            ))}
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Custom Amount (Rs.)</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                type="number" 
                value={topupAmount} 
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="Enter amount"
                style={{ 
                  flex: 1, padding: '14px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', 
                  border: '1px solid rgba(255,255,255,0.1)', color: 'white' 
                }}
              />
              <button 
                onClick={() => handleTopup()} 
                disabled={processing || !topupAmount}
                className="btn-primary" 
                style={{ padding: '0 32px', borderRadius: 10, fontWeight: 700 }}
              >
                {processing ? '...' : 'Top-up'}
              </button>
            </div>
          </div>
        </motion.div>

        <button onClick={() => router.back()} className="btn-secondary" style={{ marginTop: 32, width: '100%', borderRadius: 12 }}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

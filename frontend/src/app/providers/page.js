'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { providerAPI } from '@/lib/api';

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    providerAPI.all().then(setProviders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = providers.filter(p =>
    !filter || p.service_type.toLowerCase().includes(filter.toLowerCase()) || p.area.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>MARKETPLACE</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>🔧 Service <span className="gradient-text">Providers</span></h1>
          <p className="section-subtitle">Browse all available providers across areas</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ maxWidth: 420, marginBottom: 28 }}>
          <input className="input-field" placeholder="🔍 Filter by service or area..." value={filter} onChange={e => setFilter(e.target.value)} />
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
            <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: 56, marginBottom: 16 }}>🔍</motion.div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>No Providers Found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{filter ? `No providers match "${filter}"` : 'No providers registered yet'}</p>
          </motion.div>
        ) : (
          <>
            <div className="font-mono" style={{ marginBottom: 20, color: 'var(--text-muted)', fontSize: 11, letterSpacing: '1px' }}>SHOWING {filtered.length} PROVIDER{filtered.length !== 1 ? 'S' : ''}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {filtered.map((p, i) => (
                <motion.div key={p.id} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }} whileHover={{ y: -5 }} style={{ padding: 26, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 14, right: 14 }}>
                    <span className={`badge ${p.availability ? 'badge-success' : 'badge-error'}`} style={{ fontSize: 10 }}>
                      {p.availability ? '✓ AVAILABLE' : '⏸ BUSY'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(245,166,35,0.06))', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔧</div>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, paddingRight: 80, letterSpacing: '-0.3px' }}>{p.name}</h3>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <span className="tag-chip" style={{ fontSize: 11 }}>🔧 {p.service_type}</span>
                        {p.verified && <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: 'var(--green-light)', fontWeight: 700 }}>✓ VERIFIED</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, padding: 12, borderRadius: 10, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(16,185,129,0.08)' }}>
                    <div>
                      <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px' }}>RATING</div>
                      <div className="font-orbitron" style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>{p.rating || 0}⭐</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.total_reviews || 0} reviews</div>
                    </div>
                    <div>
                      <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px' }}>PRICE</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-light)' }}>{p.price_range}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 7, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>📍</span><span>{p.area}{p.distance_km && ` • ${p.distance_km}km`}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>📞</span><span>{p.phone}</span></div>
                    {p.working_hours && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>⏰</span><span>{p.working_hours}</span></div>}
                  </div>
                  {p.services_offered && p.services_offered.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '1px' }}>SERVICES:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {p.services_offered.slice(0, 3).map((s, idx) => <span key={idx} className="tag-chip" style={{ fontSize: 10 }}>{s}</span>)}
                        {p.services_offered.length > 3 && <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '3px 8px' }}>+{p.services_offered.length - 3} more</span>}
                      </div>
                    </div>
                  )}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-primary"
                    onClick={() => window.location.href = `/booking/${p.id}`} disabled={!p.availability}
                    style={{ width: '100%', padding: '12px', fontSize: 13, borderRadius: 12, fontWeight: 800, opacity: p.availability ? 1 : 0.5 }}>
                    {p.availability ? '📅 Book Now' : '⏸ Currently Unavailable'}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

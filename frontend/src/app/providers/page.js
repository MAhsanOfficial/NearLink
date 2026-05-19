'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { providerAPI } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState([]);
  const [registered, setRegistered] = useState([]);
  const [external, setExternal] = useState([]);
  const [activeTab, setActiveTab] = useState('registered'); // 'registered' or 'public'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const service = searchParams.get('service');
    const location = searchParams.get('location');
    const requestId = searchParams.get('request_id');

    if (service && location) {
      fetchUnifiedResults(service, location, requestId);
    } else {
      fetchAllProviders();
    }
  }, []);

  const fetchUnifiedResults = async (service, location, requestId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/unified/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type: service, location, request_id: requestId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRegistered(data.registered_providers || []);
        setExternal(data.external_providers || []);
        setProviders(data.unified_providers || []);
        
        if ((data.registered_providers || []).length === 0 && (data.external_providers || []).length > 0) {
          setActiveTab('public');
        }
      } else {
        fetchAllProviders(); // Fallback
      }
    } catch (err) {
      console.error('Unified fetch error:', err);
      fetchAllProviders();
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProviders = async () => {
    setLoading(true);
    try {
      const data = await providerAPI.all();
      setRegistered(data || []);
      setExternal([]);
      setProviders(data || []);
      setActiveTab('registered');
    } catch (err) {
      setError('Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  const currentList = (activeTab === 'registered' ? registered : external).filter(p =>
    !filter || p.service_type.toLowerCase().includes(filter.toLowerCase()) || p.area.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>DISCOVERY</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>🔍 Search <span className="gradient-text">Results</span></h1>
          <p className="section-subtitle">We found {activeTab === 'registered' ? registered.length : external.length} results in this category.</p>
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 30 }}>
          {/* Tabs */}
          <div style={{ 
            display: 'flex', gap: 6, padding: '4px', 
            background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)',
            width: '100%', maxWidth: 400
          }}>
            <button 
              onClick={() => setActiveTab('registered')}
              style={{ 
                flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, transition: 'all 0.3s ease',
                background: activeTab === 'registered' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                color: activeTab === 'registered' ? 'var(--green-light)' : 'var(--text-muted)',
                border: activeTab === 'registered' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent'
              }}
            >
              ✅ Verified ({registered.length})
            </button>
            <button 
              onClick={() => setActiveTab('public')}
              style={{ 
                flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, transition: 'all 0.3s ease',
                background: activeTab === 'public' ? 'rgba(245, 166, 35, 0.1)' : 'transparent',
                color: activeTab === 'public' ? 'var(--gold)' : 'var(--text-muted)',
                border: activeTab === 'public' ? '1px solid rgba(245, 166, 35, 0.2)' : '1px solid transparent'
              }}
            >
              🌍 Public ({external.length})
            </button>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ flex: 1, minWidth: 280 }}>
            <input className="input-field" placeholder="🔍 Filter results..." value={filter} onChange={e => setFilter(e.target.value)} style={{ marginBottom: 0 }} />
          </motion.div>
        </div>

        {currentList.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>No providers found in this category.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {currentList.map((p, i) => (
              <motion.div key={p.id} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} whileHover={{ y: -5 }} style={{ padding: 26, position: 'relative', overflow: 'hidden' }}>
                
                <div style={{ position: 'absolute', top: 14, right: 14 }}>
                  <span className={`badge ${activeTab === 'registered' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                    {activeTab === 'registered' ? 'VERIFIED' : 'PUBLIC'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(245,166,35,0.06))', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {activeTab === 'registered' ? '🔧' : '🏛️'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, paddingRight: 80, letterSpacing: '-0.3px' }}>{p.name}</h3>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span className="tag-chip" style={{ fontSize: 11 }}>{p.service_type}</span>
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
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px' }}>PROXIMITY</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-light)' }}>{p.distance_km?.toFixed(1) || 'N/A'} km</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 7, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>📍</span><span style={{ fontSize: 12 }}>{p.address || p.area}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>📞</span><span>{p.phone || 'N/A'}</span></div>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-primary"
                  onClick={() => {
                    if (activeTab === 'registered') {
                      router.push(`/booking/${p.id}`);
                    } else {
                      // External providers might not have a booking page, just show contact
                      alert(`Contact ${p.name} at ${p.phone || 'Google Maps'}`);
                    }
                  }}
                  style={{ width: '100%', padding: '12px', fontSize: 13, borderRadius: 12, fontWeight: 800 }}>
                  {activeTab === 'registered' ? '📅 Book Appointment' : '📞 View Contact'}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

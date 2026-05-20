'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function UnifiedSearchPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('registered'); // 'registered' or 'public'
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.user_type === 'provider') {
        router.push('/provider/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const handleCopy = (provider) => {
    const text = `Provider: ${provider.name}\nService: ${provider.service_type}\nPhone: ${provider.phone || 'Not available'}\nAddress: ${provider.address || 'Not available'}\nSource: ${provider.source_label || provider.source}`;
    navigator.clipboard.writeText(text);
    setCopiedId(provider.id || provider.osm_id || provider.place_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setActiveTab('registered');
    try {
      const words = query.toLowerCase().split(' ');
      let serviceType = 'Electrician';
      let location = 'Gulshan';
      if (words.some(w => w.includes('plumb'))) serviceType = 'Plumber';
      else if (words.some(w => w.includes('electric') || w.includes('bijli'))) serviceType = 'Electrician';
      else if (words.some(w => w.includes('ac') || w.includes('air'))) serviceType = 'AC Technician';
      else if (words.some(w => w.includes('carpenter') || w.includes('wood'))) serviceType = 'Carpenter';
      else if (words.some(w => w.includes('paint'))) serviceType = 'Painter';
      else if (words.some(w => w.includes('mechanic') || w.includes('car'))) serviceType = 'Mechanic';
      if (query.toLowerCase().includes('gulshan')) location = 'Gulshan-e-Iqbal';
      else if (query.toLowerCase().includes('dha')) location = 'DHA';
      else if (query.toLowerCase().includes('clifton')) location = 'Clifton';
      else if (query.toLowerCase().includes('nazimabad')) location = 'North Nazimabad';
      else if (query.toLowerCase().includes('malir')) location = 'Malir';
      else if (query.toLowerCase().includes('shah latif')) location = 'Shah Latif Town';
      const token = localStorage.getItem('quickfix_token');
      const response = await fetch(
        `${API_BASE}/api/unified/search?service_type=${encodeURIComponent(serviceType)}&location=${encodeURIComponent(location)}&min_results=5`,
        { method: 'POST', headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (provider) => {
    const data = {
      requestId: results?.trace_id || 'unified-search',
      providerId: provider.id,
      providerName: provider.name,
      serviceType: provider.service_type,
      scheduledTime: 'ASAP',
      price: provider.price_range || provider.trust_score >= 0.7 ? '$$' : '$',
      source: provider.source
    };
    localStorage.setItem('quickfix_booking_data', JSON.stringify(data));
    router.push(`/booking/confirm`);
  };

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>UNIFIED SEARCH</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>🔍 Provider <span className="gradient-text">Search</span></h1>
          <p className="section-subtitle">Search registered AND public providers from OpenStreetMap</p>
        </motion.div>

        <motion.div className="glass-card" style={{ padding: 28, marginBottom: 24, marginTop: 24, position: 'relative' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--green), var(--gold), var(--green))', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite', borderRadius: '16px 16px 0 0' }} />
          <textarea className="input-field" rows={2}
            placeholder='e.g. "I need Electrician near Gulshan" or "Plumber chahiye DHA mein"'
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ resize: 'none', fontSize: 15, marginBottom: 14 }} />
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-primary"
            onClick={handleSearch} disabled={loading || !query.trim()}
            style={{ width: '100%', padding: '14px', borderRadius: 12, fontWeight: 800 }}>
            {loading ? '🔍 Searching...' : '🚀 Search All Providers'}
          </motion.button>
        </motion.div>

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', fontSize: 14 }}>{error}</div>
        )}

        <AnimatePresence>
          {results && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }} className="mobile-grid-1">
                {[
                  { label: 'Total Providers', value: results.total_results, color: 'var(--green-light)', bg: 'rgba(16,185,129,0.08)' },
                  { label: '✅ Registered', value: results.registered_providers?.length || 0, color: 'var(--gold)', bg: 'rgba(245,166,35,0.08)' },
                  { label: '🗺️ Public OSM', value: results.external_providers?.length || 0, color: 'var(--green-light)', bg: 'rgba(16,185,129,0.06)' },
                ].map((s, i) => (
                  <motion.div key={i} className="glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ padding: 20, textAlign: 'center', background: s.bg }}>
                    <div className="font-orbitron" style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {results.sources_used && results.sources_used.length > 0 && (
                <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <div className="font-mono" style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: 'var(--green)', letterSpacing: '1px' }}>📊 DATA SOURCES:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[...new Set(results.sources_used)].map((source, i) => (
                      <span key={i} className="tag-chip" style={{ fontSize: 12 }}>{source}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div style={{ 
                display: 'flex', gap: 6, padding: '4px', 
                background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: 30, width: '100%', maxWidth: 450
              }}>
                <button 
                  onClick={() => setActiveTab('registered')}
                  style={{ 
                    flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, transition: 'all 0.3s ease',
                    background: activeTab === 'registered' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    color: activeTab === 'registered' ? 'var(--green-light)' : 'var(--text-muted)',
                    border: activeTab === 'registered' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent'
                  }}
                >
                  ✅ Verified ({results.registered_providers?.length || 0})
                </button>
                <button 
                  onClick={() => setActiveTab('public')}
                  style={{ 
                    flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, transition: 'all 0.3s ease',
                    background: activeTab === 'public' ? 'rgba(245, 166, 35, 0.1)' : 'transparent',
                    color: activeTab === 'public' ? 'var(--gold)' : 'var(--text-muted)',
                    border: activeTab === 'public' ? '1px solid rgba(245, 166, 35, 0.2)' : '1px solid transparent'
                  }}
                >
                  🌍 Public ({results.external_providers?.length || 0})
                </button>
              </div>

              {(activeTab === 'registered' ? results.registered_providers : results.external_providers)?.length > 0 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                    <h3 style={{ fontSize: 22, fontWeight: 800 }}>🎯 Ranked {activeTab === 'registered' ? 'Verified' : 'Public'} Providers</h3>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(16,185,129,0.2), transparent)' }} />
                  </div>
                  {(activeTab === 'registered' ? results.registered_providers : results.external_providers).map((provider, i) => (
                    <motion.div key={provider.id || provider.osm_id || provider.place_id} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}
                      style={{ padding: 26, marginBottom: 16, background: i === 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(245,166,35,0.04))' : undefined, border: i === 0 ? '2px solid rgba(16,185,129,0.25)' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }} className="mobile-stack">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <motion.div whileHover={{ rotate: 8 }} style={{ width: 52, height: 52, borderRadius: 14, background: i === 0 ? 'linear-gradient(135deg, var(--green), var(--gold))' : 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, boxShadow: i === 0 ? '0 4px 20px rgba(16,185,129,0.3)' : 'none' }}>
                            {i === 0 ? '🏆' : `#${i + 1}`}
                          </motion.div>
                          <div>
                            <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{provider.name}</h4>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: provider.source === 'registered' ? 'rgba(16,185,129,0.12)' : 'rgba(245,166,35,0.12)', color: provider.source === 'registered' ? 'var(--green-light)' : 'var(--gold)' }}>{provider.source_label}</span>
                              {i === 0 && <span className="badge badge-success" style={{ fontSize: 10 }}>⭐ TOP MATCH</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }} className="mobile-center">
                          <div className="font-orbitron" style={{ fontSize: 20, fontWeight: 800, color: 'var(--green-light)' }}>{provider.rank_score}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16, padding: 14, borderRadius: 10, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(16,185,129,0.08)' }} className="mobile-grid-1">
                        <div><div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px' }}>🔧 SERVICE</div><div style={{ fontSize: 14, fontWeight: 600 }}>{provider.service_type}</div></div>
                        <div><div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px' }}>📍 AREA</div><div style={{ fontSize: 14, fontWeight: 600 }}>{provider.area || 'N/A'}</div></div>
                        <div><div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px' }}>📏 DISTANCE</div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green-light)' }}>{provider.distance_km ? `${provider.distance_km} km` : 'N/A'}</div></div>
                        <div><div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px' }}>📞 PHONE</div><div style={{ fontSize: 14, fontWeight: 600 }}>{provider.phone || 'Not available'}</div></div>
                        {provider.source === 'registered' && (
                          <><div><div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px' }}>⭐ RATING</div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)' }}>{provider.rating || 0}/5</div></div>
                          <div><div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px' }}>💰 PRICE</div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green-light)' }}>{provider.price_range || 'N/A'}</div></div></>
                        )}
                        {provider.source !== 'registered' && (
                          <div><div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px' }}>🔒 TRUST</div><div style={{ fontSize: 14, fontWeight: 600 }}>{Math.round((provider.trust_score || 0.5) * 100)}%</div></div>
                        )}
                      </div>
                      {provider.address && (
                        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                          <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '1px' }}>📮 ADDRESS</div>
                          <div style={{ fontSize: 13 }}>{provider.address}</div>
                        </div>
                      )}
                      {provider.source === 'registered' ? (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-primary"
                          onClick={() => handleBook(provider)}
                          style={{ width: '100%', padding: '13px', borderRadius: 12, fontWeight: 800, background: i === 0 ? 'linear-gradient(135deg, var(--green), var(--gold))' : undefined }}>
                          {i === 0 ? '🚀 Book Top Provider Now' : '📅 Book This Provider'} →
                        </motion.button>
                      ) : (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-primary"
                          onClick={() => handleCopy(provider)}
                          style={{ 
                            width: '100%', padding: '13px', borderRadius: 12, fontWeight: 800, 
                            background: copiedId === (provider.id || provider.osm_id || provider.place_id) ? 'var(--green)' : 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: copiedId === (provider.id || provider.osm_id || provider.place_id) ? 'white' : 'var(--text-main)'
                          }}>
                          {copiedId === (provider.id || provider.osm_id || provider.place_id) ? '✅ Copied to Clipboard!' : '📋 Copy Contact Details'}
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </>
              ) : (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                  <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: 56, marginBottom: 16 }}>😔</motion.div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Providers Found</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>No {activeTab === 'registered' ? 'verified' : 'public'} providers match your request in this area.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

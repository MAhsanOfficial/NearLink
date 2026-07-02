'use client';
import { useState, useEffect } from 'react';
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
    const text = `Provider: ${provider.name}\nPhone: ${provider.phone || 'Not available'}\nAddress: ${provider.address || 'Not available'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(provider.id || provider.place_id);
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
      else if (words.some(w => w.includes('electric'))) serviceType = 'Electrician';
      else if (words.some(w => w.includes('ac'))) serviceType = 'AC Technician';
      else if (words.some(w => w.includes('carpenter'))) serviceType = 'Carpenter';
      else if (words.some(w => w.includes('paint'))) serviceType = 'Painter';
      
      if (query.toLowerCase().includes('gulshan')) location = 'Gulshan-e-Iqbal';
      else if (query.toLowerCase().includes('dha')) location = 'DHA';
      else if (query.toLowerCase().includes('clifton')) location = 'Clifton';
      
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
      price: provider.price_range || '$$',
      source: provider.source
    };
    localStorage.setItem('quickfix_booking_data', JSON.stringify(data));
    router.push(`/booking/confirm`);
  };

  return (
    <div className="page-wrapper" style={{ padding: '84px 20px 40px' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: 'var(--primary-green)', marginBottom: 4, fontWeight: 600 }}>UNIFIED SEARCH</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Provider Search</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Search registered AND external providers from Google Places</p>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <textarea className="input-field" rows={2}
            placeholder='e.g. "I need Electrician near Gulshan" or "Plumber chahiye DHA mein"'
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ resize: 'none', fontSize: 15, marginBottom: 14 }} />
          <button className="btn-primary" onClick={handleSearch} disabled={loading || !query.trim()}
            style={{ width: '100%', padding: '14px', fontWeight: 600 }}>
            {loading ? 'Searching...' : '🚀 Search All Providers'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 6, marginBottom: 20, background: '#fee', border: '1px solid #fcc', color: '#c33', fontSize: 14 }}>{error}</div>
        )}

        {results && (
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
              <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-green)' }}>{results.total_results}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Providers</div>
              </div>
              <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-green)' }}>{results.registered_providers?.length || 0}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>✅ Registered</div>
              </div>
              <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-green)' }}>{results.external_providers?.length || 0}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🌍 External</div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid var(--border-color)' }}>
              <button onClick={() => setActiveTab('registered')}
                style={{
                  padding: '12px 24px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, borderBottom: activeTab === 'registered' ? '2px solid var(--primary-green)' : 'none',
                  color: activeTab === 'registered' ? 'var(--primary-green)' : 'var(--text-secondary)',
                  marginBottom: '-2px'
                }}
              >
                ✅ Verified ({results.registered_providers?.length || 0})
              </button>
              <button onClick={() => setActiveTab('public')}
                style={{
                  padding: '12px 24px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, borderBottom: activeTab === 'public' ? '2px solid var(--primary-green)' : 'none',
                  color: activeTab === 'public' ? 'var(--primary-green)' : 'var(--text-secondary)',
                  marginBottom: '-2px'
                }}
              >
                🌍 External ({results.external_providers?.length || 0})
              </button>
            </div>

            {(activeTab === 'registered' ? results.registered_providers : results.external_providers)?.length > 0 ? (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                  Ranked {activeTab === 'registered' ? 'Verified' : 'External'} Providers
                </h3>
                {(activeTab === 'registered' ? results.registered_providers : results.external_providers).map((provider, i) => (
                  <div key={provider.id || provider.place_id} className="card" style={{
                    padding: 24, marginBottom: 16,
                    border: i === 0 ? '2px solid var(--primary-green)' : '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          {i === 0 && <span style={{ fontSize: 20 }}>🏆</span>}
                          <h4 style={{ fontSize: 18, fontWeight: 700 }}>{provider.name}</h4>
                          <span className="badge badge-success" style={{ fontSize: 11 }}>
                            {provider.source_label || provider.source}
                          </span>
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          🔧 {provider.service_type}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          📍 {provider.area || 'N/A'} {provider.distance_km && `(${provider.distance_km} km)`}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          📞 {provider.phone || 'Not available'}
                        </div>
                        {provider.address && (
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                            📮 {provider.address}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-green)' }}>
                          {provider.rank_score || (provider.rating ? `${provider.rating}⭐` : 'N/A')}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {provider.source === 'registered' ? `${provider.total_reviews || 0} reviews` : 'Score'}
                        </div>
                      </div>
                    </div>

                    {provider.source === 'registered' ? (
                      <button className="btn-primary" onClick={() => handleBook(provider)}
                        style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600 }}>
                        {i === 0 ? '🚀 Book Top Provider' : '📅 Book This Provider'}
                      </button>
                    ) : (
                      <button className="btn-secondary" onClick={() => handleCopy(provider)}
                        style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600,
                          background: copiedId === (provider.id || provider.place_id) ? 'var(--primary-green)' : 'white',
                          color: copiedId === (provider.id || provider.place_id) ? 'white' : 'var(--text-primary)'
                        }}>
                        {copiedId === (provider.id || provider.place_id) ? '✅ Copied!' : '📋 Copy Contact Details'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>😔</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Providers Found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  No {activeTab === 'registered' ? 'verified' : 'external'} providers match your request.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

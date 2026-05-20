'use client';
import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { requestAPI, providerAPI } from '@/lib/api';

const exampleRequests = [
  'Mujhe kal subah G-13 mein AC technician chahiye',
  'DHA mein bijli ka kaam karna hai, fori zaroorat hai',
  'Need a plumber in Gulshan tomorrow evening',
  'North Nazimabad mein painter chahiye next week',
  'Ghar ki safai karwani hai aaj shaam Gulshan mein',
];

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>}>
      <RequestContent />
    </Suspense>
  );
}

function RequestContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState('');
  const [step, setStep] = useState('input'); // input | parsing | parsed | finding | results
  const [parsed, setParsed] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [providers, setProviders] = useState([]);
  const [ranking, setRanking] = useState(null);
  const [traces, setTraces] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.user_type === 'provider') {
        router.push('/provider/dashboard');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const q = searchParams.get('q');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setText(q);
  }, [searchParams]);

  const handleParse = async () => {
    if (!text.trim()) return;
    setError('');
    setStep('parsing');
    setTraces([{ agent: '🧠 IntentAgent', status: 'running', message: 'Parsing your request...' }]);
    try {
      const res = await requestAPI.parse(text);
      setParsed(res.parsed);
      setRequestId(res.request_id);
      setTraces(prev => [
        { ...prev[0], status: 'done', message: `Detected: ${res.parsed.service_type} in ${res.parsed.location}`, duration: res.trace?.duration_ms },
      ]);
      setStep('parsed');
    } catch (err) {
      setError(err.message);
      setStep('input');
    }
  };

  const handleFindProviders = async () => {
    setStep('finding');
    setTraces(prev => [
      ...prev,
      { agent: '🔍 ProviderDiscoveryAgent', status: 'running', message: 'Searching providers...' },
      { agent: '⭐ RankingAgent', status: 'waiting', message: 'Waiting...' },
    ]);
    try {
      const res = await providerAPI.rank(parsed.service_type, parsed.location, requestId);
      setProviders(res.providers || []);
      setRanking(res.ranking || {});
      setTraces(prev => {
        const updated = [...prev];
        updated[1] = { ...updated[1], status: 'done', message: `Found ${res.providers?.length || 0} providers`, duration: res.traces?.[0]?.duration_ms };
        updated[2] = { ...updated[2], status: 'done', message: res.ranking?.recommendation || 'Ranked', duration: res.traces?.[1]?.duration_ms };
        return updated;
      });
      setStep('results');
    } catch (err) {
      setError(err.message);
      setStep('parsed');
    }
  };

  const handleBook = (provider) => {
    const data = {
      requestId,
      providerId: provider.id,
      providerName: provider.name,
      serviceType: provider.service_type,
      scheduledTime: parsed?.time || 'ASAP',
      price: provider.price_range,
    };
    localStorage.setItem('quickfix_booking_data', JSON.stringify(data));
    router.push(`/booking?id=confirm`);
  };

  if (authLoading || !user) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container" style={{ maxWidth: 850 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
            AI ORCHESTRATION
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>
            ✨ New Service <span className="gradient-text">Request</span>
          </h1>
          <p className="section-subtitle">Describe what you need — in Urdu, Roman Urdu, or English</p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ padding: '14px 18px', borderRadius: 14, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', fontSize: 14 }}>
            {error}
          </motion.div>
        )}

        {/* Input */}
        <motion.div className="glass-card" style={{ padding: 28, marginBottom: 24, position: 'relative' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--green), var(--gold), var(--green))', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite', borderRadius: '16px 16px 0 0' }} />

          <textarea className="input-field" rows={3}
            placeholder='e.g. "Mujhe kal subah G-13 mein AC technician chahiye"'
            value={text} onChange={e => setText(e.target.value)}
            disabled={step !== 'input' && step !== 'parsed'}
            style={{ resize: 'none', fontSize: 16 }} />
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {step === 'input' && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="btn-primary" onClick={handleParse} disabled={!text.trim()}
                style={{ borderRadius: 12, fontWeight: 800 }}>
                🧠 Parse Request
              </motion.button>
            )}
            {step === 'parsed' && (
              <>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="btn-primary" onClick={handleFindProviders} style={{ borderRadius: 12, fontWeight: 800 }}>
                  🔍 Find Providers
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="btn-secondary" onClick={() => { setStep('input'); setParsed(null); }} style={{ borderRadius: 12 }}>
                  ✏️ Edit
                </motion.button>
              </>
            )}
            {(step === 'parsing' || step === 'finding') && (
              <button className="btn-secondary" disabled style={{ opacity: 0.6, borderRadius: 12 }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing...
              </button>
            )}
          </div>

          {/* Example chips */}
          {step === 'input' && (
            <div style={{ marginTop: 20 }}>
              <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '1.5px', textTransform: 'uppercase' }}>TRY AN EXAMPLE:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {exampleRequests.map((ex, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setText(ex)}
                    className="tag-chip"
                    style={{ cursor: 'pointer', fontSize: 12 }}
                  >
                    {ex.length > 45 ? ex.slice(0, 45) + '...' : ex}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Parsed Result */}
        <AnimatePresence>
          {parsed && step !== 'input' && (
            <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} style={{ padding: 28, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--green-neon)', fontSize: 20 }}>✓</span> Parsed Intent
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
                {[
                  { label: 'Service', value: parsed.service_type, icon: '🔧', color: 'green' },
                  { label: 'Location', value: parsed.location, icon: '📍', color: 'gold' },
                  { label: 'Time', value: parsed.time, icon: '⏰', color: 'green' },
                  { label: 'Urgency', value: parsed.urgency, icon: '🔥', color: 'gold' },
                  { label: 'Language', value: parsed.language_detected, icon: '🗣️', color: 'green' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      padding: 16, borderRadius: 14,
                      background: item.color === 'gold' ? 'rgba(245,166,35,0.05)' : 'rgba(16,185,129,0.05)',
                      border: `1px solid ${item.color === 'gold' ? 'rgba(245,166,35,0.12)' : 'rgba(16,185,129,0.12)'}`,
                    }}
                  >
                    <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>{item.icon} {item.label}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, textTransform: 'capitalize', color: item.color === 'gold' ? 'var(--gold-light)' : 'var(--green-light)' }}>{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Provider Results */}
        <AnimatePresence>
          {step === 'results' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {ranking?.recommendation && providers.length > 0 && (
                <div className="glass-card" style={{ padding: 22, marginBottom: 22, background: 'linear-gradient(135deg, rgba(245,166,35,0.06), rgba(16,185,129,0.04))' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>💡</span> <span style={{ color: 'var(--gold)' }}>AI Recommendation</span>
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.7 }}>{ranking.recommendation}</p>
                </div>
              )}

              {providers.length === 0 && (
                <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
                  <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: 64, marginBottom: 16 }}>😔</motion.div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>No Providers Found</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
                    We couldn't find any registered providers for {parsed?.service_type} in {parsed?.location}.
                  </p>
                  <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="btn-primary" onClick={() => { setStep('input'); setParsed(null); setProviders([]); }} style={{ borderRadius: 14 }}>
                      🔍 Try Different Search
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="btn-secondary" onClick={() => router.push('/providers')} style={{ borderRadius: 14 }}>
                      👀 Browse All Providers
                    </motion.button>
                  </div>
                </div>
              )}

              {providers.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                    <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
                      🎯 Top Providers ({providers.length})
                    </h3>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(16,185,129,0.2), transparent)' }} />
                  </div>

                  {providers.map((provider, i) => {
                    const rankInfo = ranking?.ranked_providers?.find(r => r.provider_id === provider.id);
                    return (
                      <motion.div key={provider.id} className="glass-card" initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -4 }}
                        style={{
                          padding: 28, marginBottom: 18,
                          background: i === 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(245,166,35,0.04))' : undefined,
                          border: i === 0 ? '2px solid rgba(16,185,129,0.25)' : undefined,
                        }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <motion.div
                              whileHover={{ rotate: 10 }}
                              style={{
                                width: 52, height: 52, borderRadius: 14,
                                background: i === 0 ? 'linear-gradient(135deg, var(--green), var(--gold))' : 'rgba(16,185,129,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22, fontWeight: 700,
                                boxShadow: i === 0 ? '0 4px 20px rgba(16,185,129,0.3)' : 'none',
                              }}>
                              {i === 0 ? '🏆' : `#${i + 1}`}
                            </motion.div>
                            <div>
                              <h4 style={{ fontSize: 19, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.3px' }}>{provider.name}</h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {i === 0 && <span className="badge badge-success" style={{ fontSize: 10 }}>⭐ TOP PICK</span>}
                                {provider.verified && <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: 'var(--green-light)', fontWeight: 700 }}>✓ VERIFIED</span>}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="font-orbitron" style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)' }}>
                              {provider.rating || 0}⭐
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{provider.total_reviews || 0} reviews</div>
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div style={{
                          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: 16, marginBottom: 18, padding: 18, borderRadius: 12,
                          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(16,185,129,0.08)',
                        }}>
                          <div>
                            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700, letterSpacing: '1px' }}>📍 LOCATION</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{provider.area}</div>
                            <div style={{ fontSize: 12, color: 'var(--green-light)' }}>{provider.distance_km}km away</div>
                          </div>
                          <div>
                            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700, letterSpacing: '1px' }}>💰 PRICE</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{provider.price_range}</div>
                          </div>
                          <div>
                            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700, letterSpacing: '1px' }}>📞 CONTACT</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{provider.phone}</div>
                          </div>
                          <div>
                            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700, letterSpacing: '1px' }}>⏰ HOURS</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{provider.working_hours || 'Call for hours'}</div>
                          </div>
                        </div>

                        {provider.description && (
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.7 }}>{provider.description}</p>
                        )}

                        {provider.services_offered && provider.services_offered.length > 0 && (
                          <div style={{ marginBottom: 18 }}>
                            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 700, letterSpacing: '1px' }}>SERVICES:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {provider.services_offered.map((service, idx) => (
                                <span key={idx} className="tag-chip" style={{ fontSize: 11 }}>{service}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {rankInfo?.reasoning && (
                          <div style={{
                            padding: 14, borderRadius: 10,
                            background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)', marginBottom: 18,
                          }}>
                            <div className="font-mono" style={{ fontSize: 10, color: 'var(--gold)', marginBottom: 6, fontWeight: 700, letterSpacing: '1px' }}>🤖 AI RECOMMENDATION</div>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>{rankInfo.reasoning}</p>
                          </div>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="btn-primary"
                          onClick={() => handleBook(provider)}
                          style={{
                            width: '100%', padding: '16px', fontSize: 15, fontWeight: 800, borderRadius: 14,
                            background: i === 0 ? 'linear-gradient(135deg, var(--green), var(--gold))' : undefined,
                            boxShadow: i === 0 ? '0 4px 20px rgba(16,185,129,0.3)' : undefined,
                          }}
                        >
                          {i === 0 ? '🚀 Book Top Provider Now' : '📅 Book This Provider'} →
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent Trace Timeline */}
        {traces.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-secondary)' }}>🔍 Agent Trace Log</h3>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(245,166,35,0.2), transparent)' }} />
            </div>
            {traces.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'flex-start' }}>
                <motion.div
                  animate={t.status === 'running' ? { boxShadow: ['0 0 10px rgba(16,185,129,0.2)', '0 0 25px rgba(16,185,129,0.4)', '0 0 10px rgba(16,185,129,0.2)'] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    minWidth: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: t.status === 'done' ? 'rgba(16,185,129,0.12)' : t.status === 'running' ? 'rgba(16,185,129,0.08)' : 'rgba(245,166,35,0.06)',
                    border: `1px solid ${t.status === 'done' ? 'rgba(16,185,129,0.25)' : t.status === 'running' ? 'rgba(16,185,129,0.2)' : 'rgba(245,166,35,0.12)'}`,
                    fontSize: 14, fontWeight: 700,
                  }}>
                  {t.status === 'done' ? '✓' : t.status === 'running' ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '⏳'}
                </motion.div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>{t.agent}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.message}</p>
                  {t.duration && <p className="font-mono" style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4 }}>⏱ {t.duration}ms</p>}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}


'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { traceAPI } from '@/lib/api';

const agentColors = {
  IntentAgent: 'var(--green-light)',
  ProviderDiscoveryAgent: 'var(--gold)',
  RankingAgent: 'var(--gold-light)',
  BookingAgent: 'var(--green-neon)',
};

const agentIcons = {
  IntentAgent: '🧠',
  ProviderDiscoveryAgent: '🔍',
  RankingAgent: '⭐',
  BookingAgent: '📅',
};

export default function TracesPage() {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    traceAPI.all().then(setTraces).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>ADMIN CONSOLE</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>🔍 Agent <span className="gradient-text">Trace Logs</span></h1>
          <p className="section-subtitle">Real-time visibility into AI agent reasoning and decisions</p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : traces.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
            <motion.p animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: 56, marginBottom: 16 }}>🔬</motion.p>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No Traces Yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Make a service request to see agent logs.</p>
          </motion.div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            {/* Timeline Line */}
            <div style={{ position: 'absolute', left: 4, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, var(--green), var(--gold), transparent)' }} />

            {traces.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ position: 'relative', marginBottom: 20 }}>
                {/* Dot */}
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                  style={{ position: 'absolute', left: -26, top: 20, width: 14, height: 14, borderRadius: '50%', background: agentColors[t.agent_name] || 'var(--green)', boxShadow: `0 0 15px ${agentColors[t.agent_name] || 'var(--green)'}`, border: '2px solid var(--bg-primary)', zIndex: 2 }} />

                <div className="glass-card" style={{ padding: 24, borderLeft: `2px solid ${agentColors[t.agent_name] || 'var(--green)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{agentIcons[t.agent_name] || '🤖'}</span>
                      <span className="font-mono" style={{ fontSize: 14, fontWeight: 800, color: agentColors[t.agent_name] || 'var(--text-primary)', letterSpacing: '0.5px' }}>
                        {t.agent_name}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {t.action}
                      </span>
                    </div>
                    {t.duration_ms && (
                      <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-light)' }}>⏱ {t.duration_ms}ms</span>
                    )}
                  </div>

                  {t.reasoning && (
                    <div style={{ padding: 14, borderRadius: 10, background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.1)', marginBottom: 16 }}>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                        <span style={{ color: 'var(--gold)', marginRight: 6 }}>💡</span>
                        {t.reasoning}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {t.input_data && (
                      <details style={{ flex: 1, minWidth: 250 }}>
                        <summary style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 8, outline: 'none', letterSpacing: '1px', textTransform: 'uppercase' }}>📥 INPUT PAYLOAD</summary>
                        <pre className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 10, overflow: 'auto', maxHeight: 200, border: '1px solid rgba(16,185,129,0.1)' }}>
                          {JSON.stringify(t.input_data, null, 2)}
                        </pre>
                      </details>
                    )}
                    {t.output_data && (
                      <details style={{ flex: 1, minWidth: 250 }}>
                        <summary style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 8, outline: 'none', letterSpacing: '1px', textTransform: 'uppercase' }}>📤 OUTPUT PAYLOAD</summary>
                        <pre className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 10, overflow: 'auto', maxHeight: 200, border: '1px solid rgba(245,166,35,0.1)' }}>
                          {JSON.stringify(t.output_data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>

                  {t.created_at && (
                    <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 16, letterSpacing: '0.5px' }}>
                      {new Date(t.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

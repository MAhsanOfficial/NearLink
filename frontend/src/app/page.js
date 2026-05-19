'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

const features = [
  { icon: '🗣️', title: 'Multilingual Input', desc: 'Speak in Urdu, Roman Urdu, or English — our AI understands it all.', color: 'green' },
  { icon: '🤖', title: 'AI Agent Orchestration', desc: '4 specialized agents parse, discover, rank, and book — autonomously.', color: 'gold' },
  { icon: '📍', title: 'Local Provider Discovery', desc: 'Finds trusted service providers near you from our verified database.', color: 'green' },
  { icon: '⭐', title: 'Smart Ranking', desc: 'AI ranks providers by distance, rating, and availability for the best match.', color: 'gold' },
  { icon: '📅', title: 'Instant Booking', desc: 'One-tap booking with automated confirmation and slot scheduling.', color: 'green' },
  { icon: '🔔', title: 'Follow-up Automation', desc: 'Reminders, status updates, and completion confirmations — hands-free.', color: 'gold' },
];

const steps = [
  { num: '01', title: 'Describe Your Need', desc: '"Mujhe kal subah G-13 mein AC technician chahiye"', icon: '🎤' },
  { num: '02', title: 'AI Understands', desc: 'Intent Agent parses language, extracts service, location, time, urgency', icon: '🧠' },
  { num: '03', title: 'Find & Rank', desc: 'Discovery Agent finds providers, Ranking Agent picks the best', icon: '🔍' },
  { num: '04', title: 'Book & Track', desc: 'Instant booking with automated reminders and status updates', icon: '🚀' },
];

const stats = [
  { number: '4', label: 'AI Agents', suffix: '' },
  { number: '3', label: 'Languages', suffix: '+' },
  { number: '100', label: 'Providers', suffix: '+' },
  { number: '99', label: 'Uptime', suffix: '%' },
];

// Floating Particle Component
function FloatingParticles() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 6,
      size: 2 + Math.random() * 4,
      isGold: Math.random() > 0.6,
    }));
    setParticles(generated);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.isGold ? '#ffd700' : '#00ff88',
            boxShadow: `0 0 ${p.size * 3}px ${p.isGold ? 'rgba(255,215,0,0.4)' : 'rgba(0,255,136,0.4)'}`,
          }}
          animate={{
            y: [-20, -60, -20],
            x: [-10, 15, -10],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Typing Effect Component
function TypingText({ texts }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const text = texts[currentIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(text.slice(0, currentText.length + 1));
        if (currentText.length === text.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setCurrentText(text.slice(0, currentText.length - 1));
        if (currentText.length === 0) {
          setIsDeleting(false);
          setCurrentIndex((currentIndex + 1) % texts.length);
        }
      }
    }, isDeleting ? 40 : 80);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentIndex, texts]);

  return (
    <span>
      {currentText}
      <span style={{ animation: 'typing 0.8s infinite', color: 'var(--green-neon)' }}>|</span>
    </span>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  return (
    <div className="page-wrapper" style={{ paddingTop: 0 }}>
      {/* ===== HERO SECTION ===== */}
      <motion.section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 20px 80px',
          position: 'relative',
          overflow: 'hidden',
          opacity: heroOpacity,
          scale: heroScale,
        }}
      >
        <FloatingParticles />

        {/* Hero Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(16,185,129,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: 1200,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}>
          {/* Left Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 20px',
                borderRadius: 100,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                marginBottom: 28,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--green-light)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--green-neon)', boxShadow: '0 0 10px var(--green-neon)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                AI-Powered Service Platform
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              style={{
                fontSize: 'clamp(36px, 5vw, 64px)',
                fontWeight: 900,
                lineHeight: 1.08,
                marginBottom: 24,
                letterSpacing: '-2px',
              }}
            >
              Get Any Service{' '}
              <span className="gradient-text" style={{ display: 'block' }}>Fixed Instantly</span>
              <span style={{ color: 'var(--gold)' }}> with AI</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              style={{
                fontSize: 17,
                color: 'var(--text-secondary)',
                maxWidth: 520,
                lineHeight: 1.8,
                marginBottom: 40,
              }}
            >
              Describe what you need in{' '}
              <strong style={{ color: 'var(--green-light)' }}>Urdu, Roman Urdu, or English</strong>{' '}
              — our AI agents find, rank, and book the best local service providers for you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}
            >
              <Link href="/auth/signup" className="btn-primary" style={{
                padding: '18px 44px',
                fontSize: 16,
                borderRadius: 14,
                fontWeight: 800,
              }}>
                Get Started Free →
              </Link>
              <Link href="/auth/login" className="btn-secondary" style={{
                padding: '18px 44px',
                fontSize: 16,
                borderRadius: 14,
              }}>
                Sign In
              </Link>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}
            >
              {stats.map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div className="font-orbitron" style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: i % 2 === 0 ? 'var(--green-light)' : 'var(--gold)',
                    lineHeight: 1.2,
                  }}>
                    {s.number}{s.suffix}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — 3D Robot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 60 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, type: 'spring', stiffness: 100 }}
            className="hero-robot-container"
            style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}
          >
            {/* Glowing rings behind robot */}
            <motion.div
              style={{
                position: 'absolute',
                width: 420,
                height: 420,
                borderRadius: '50%',
                border: '1px solid rgba(16,185,129,0.15)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              style={{
                position: 'absolute',
                width: 340,
                height: 340,
                borderRadius: '50%',
                border: '1px solid rgba(245,166,35,0.12)',
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              style={{
                position: 'absolute',
                width: 260,
                height: 260,
                borderRadius: '50%',
                border: '1px dashed rgba(16,185,129,0.1)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />

            {/* Orbiting dots */}
            <motion.div
              style={{ position: 'absolute', width: 420, height: 420 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            >
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: 'var(--green-neon)', boxShadow: '0 0 15px var(--green-neon)' }} />
            </motion.div>
            <motion.div
              style={{ position: 'absolute', width: 340, height: 340 }}
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: 'var(--gold-neon)', boxShadow: '0 0 15px var(--gold-neon)' }} />
            </motion.div>

            <Image
              src="/hero-robot.png"
              alt="AI Robot Assistant"
              width={380}
              height={380}
              className="hero-robot-img"
              priority
            />
          </motion.div>
        </div>
      </motion.section>

      {/* ===== DEMO INPUT PREVIEW ===== */}
      <section style={{ padding: '0 20px 80px', maxWidth: 700, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card scan-effect"
          style={{ padding: 28, position: 'relative' }}
        >
          <div style={{
            position: 'absolute',
            top: -1,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, var(--green), var(--gold), var(--green))',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div className="pulse-dot" />
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, letterSpacing: '2px' }}>LIVE AI DEMO</span>
          </div>
          <p className="font-mono" style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.8 }}>
            <TypingText texts={[
              '"Mujhe kal subah G-13 mein AC technician chahiye"',
              '"Need a plumber in DHA tomorrow evening"',
              '"Bijli ka kaam karna hai, fori zaroorat hai"',
            ]} />
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span className="badge badge-success">🔧 AC Repair</span>
            <span className="badge badge-info">📍 G-13</span>
            <span className="badge badge-warning">⏰ Tomorrow AM</span>
            <span className="badge badge-error">🔥 High Urgency</span>
          </div>
        </motion.div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section style={{ padding: '80px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <div className="tag-chip gold" style={{ display: 'inline-flex', marginBottom: 16 }}>✨ FEATURES</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, marginBottom: 12, letterSpacing: '-1px' }}>
            Powered by <span className="gradient-text">4 AI Agents</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Each agent specializes in one step of the service orchestration pipeline
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="glass-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              style={{ padding: 32, cursor: 'default' }}
            >
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                marginBottom: 20,
                background: f.color === 'gold'
                  ? 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(251,191,36,0.06))'
                  : 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(0,255,136,0.06))',
                border: `1px solid ${f.color === 'gold' ? 'rgba(245,166,35,0.2)' : 'rgba(16,185,129,0.2)'}`,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: '80px 20px', maxWidth: 900, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <div className="tag-chip" style={{ display: 'inline-flex', marginBottom: 16 }}>🔄 WORKFLOW</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-1px' }}>
            How It <span className="gradient-text">Works</span>
          </h2>
        </motion.div>

        <div style={{ position: 'relative' }}>
          {/* Vertical Timeline Line */}
          <div style={{
            position: 'absolute',
            left: 32,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'linear-gradient(180deg, var(--green), var(--gold), transparent)',
          }} />

          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              style={{
                display: 'flex',
                gap: 28,
                marginBottom: 40,
                alignItems: 'flex-start',
                position: 'relative',
              }}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                style={{
                  minWidth: 64,
                  height: 64,
                  borderRadius: 18,
                  background: i % 2 === 0
                    ? 'linear-gradient(135deg, var(--green), var(--green-dark))'
                    : 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  boxShadow: i % 2 === 0
                    ? '0 8px 30px rgba(16,185,129,0.3)'
                    : '0 8px 30px rgba(245,166,35,0.3)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {s.icon}
              </motion.div>
              <div className="glass-card" style={{ padding: 24, flex: 1 }}>
                <div className="font-orbitron" style={{
                  fontSize: 11,
                  color: i % 2 === 0 ? 'var(--green)' : 'var(--gold)',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  marginBottom: 6,
                }}>
                  STEP {s.num}
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section style={{ padding: '80px 20px 120px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card"
          style={{
            maxWidth: 700,
            margin: '0 auto',
            padding: '64px 40px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(245,166,35,0.05))',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated Border Top */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, var(--green), var(--gold), var(--green))',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite',
          }} />

          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: 56, marginBottom: 20 }}
          >
            ⚡
          </motion.div>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 14, letterSpacing: '-1px' }}>
            Ready to get <span className="gradient-text">started</span>?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: 16, maxWidth: 400, margin: '0 auto 36px' }}>
            Join thousands using AI to find trusted service providers
          </p>
          <Link href="/auth/signup" className="btn-primary" style={{
            padding: '18px 56px',
            fontSize: 17,
            borderRadius: 14,
            fontWeight: 800,
          }}>
            Create Free Account →
          </Link>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        borderTop: '1px solid rgba(16,185,129,0.1)',
        padding: '40px 20px',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--green), var(--gold), transparent)',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
          © 2026 <span style={{ color: 'var(--green-light)' }}>NearLink</span> — AI Service Orchestrator for the Informal Economy
        </p>
        <p style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 12 }}>
          Built with <span style={{ color: 'var(--gold)' }}>Gemini 2.0 Flash</span> · OpenAI Agents SDK · Next.js · FastAPI
        </p>
      </footer>
    </div>
  );
}

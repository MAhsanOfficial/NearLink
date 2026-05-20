'use client';
import { motion } from 'framer-motion';

export default function InteractiveIllustration() {
  return (
    <div style={{ position: 'relative', width: 380, height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        viewBox="0 0 400 400"
        width="100%"
        height="100%"
        style={{ overflow: 'visible', filter: 'drop-shadow(0 0 25px rgba(0, 255, 136, 0.2))' }}
      >
        {/* Glow & Grid Background */}
        <defs>
          <radialGradient id="greenGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff88" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#f5a623" />
          </linearGradient>
        </defs>

        <circle cx="200" cy="200" r="160" fill="url(#greenGlow)" />

        {/* Orbiting Technical Grid */}
        <g stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" fill="none">
          <circle cx="200" cy="200" r="140" />
          <circle cx="200" cy="200" r="100" strokeDasharray="5,5" />
          <line x1="200" y1="40" x2="200" y2="360" strokeDasharray="3,3" />
          <line x1="40" y1="200" x2="360" y2="200" strokeDasharray="3,3" />
        </g>

        {/* Dynamic Holographic Elements */}
        <motion.circle
          cx="200"
          cy="200"
          r="120"
          stroke="url(#neonGradient)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="40 180"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <motion.circle
          cx="200"
          cy="200"
          r="80"
          stroke="rgba(245, 166, 35, 0.3)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="60 120"
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />

        {/* --- Handyman/Provider Stylized Vector Character --- */}
        <motion.g
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Provider Body Base */}
          <path d="M 230 260 L 320 260 L 300 340 L 250 340 Z" fill="#10b981" opacity="0.85" />
          {/* Provider Tool Jacket/Uniform trim */}
          <path d="M 260 260 L 290 260 L 285 340 L 265 340 Z" fill="#fbbf24" />
          {/* Handyman arm reaching to help */}
          <motion.path
            d="M 240 280 Q 180 250 140 230"
            stroke="#10b981"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
            animate={{ rotate: [0, 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Handyman tool icon floating above hand */}
          <motion.g
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <circle cx="130" cy="220" r="18" fill="#ffd700" opacity="0.9" />
            <path d="M 124 226 L 136 214" stroke="#050505" strokeWidth="4" strokeLinecap="round" />
            <path d="M 128 214 Q 134 222 136 226" stroke="#050505" strokeWidth="2" fill="none" />
          </motion.g>

          {/* Provider Head */}
          <circle cx="275" cy="220" r="28" fill="rgba(240, 245, 240, 0.9)" />
          {/* Provider cap / helmet */}
          <path d="M 245 220 Q 275 190 305 220 Z" fill="#059669" />
          <rect x="250" y="217" width="50" height="6" rx="3" fill="#fbbf24" />
        </motion.g>

        {/* --- Customer Stylized Vector Character --- */}
        <motion.g
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Customer Body */}
          <path d="M 80 280 L 170 280 L 155 350 L 95 350 Z" fill="rgba(240, 245, 240, 0.25)" stroke="rgba(240, 245, 240, 0.4)" strokeWidth="2" />
          {/* Customer Head */}
          <circle cx="125" cy="235" r="26" fill="rgba(240, 245, 240, 0.85)" />
          {/* Customer Hair */}
          <path d="M 100 230 Q 125 205 150 230 C 145 220 105 220 100 230" fill="#f5a623" />
          {/* Customer reaching arm */}
          <path d="M 145 290 Q 185 270 200 270" stroke="rgba(240, 245, 240, 0.6)" strokeWidth="12" strokeLinecap="round" fill="none" />
        </motion.g>

        {/* Sparkles / Connection points indicating NearLink active matching */}
        <motion.g
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <line x1="140" y1="230" x2="275" y2="220" stroke="#00ff88" strokeWidth="2" strokeDasharray="5,10" />
          <circle cx="207" cy="225" r="5" fill="#ffd700" />
        </motion.g>
      </svg>
      {/* Dynamic Glow Effect Overlay */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, rgba(0, 255, 136, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
    </div>
  );
}

'use client';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function InteractiveIllustration() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', height: '500px', margin: '0 auto' }}>
      {/* Glowing rings behind robot */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 420,
          height: 420,
          borderRadius: '50%',
          border: '1px solid rgba(212, 175, 55, 0.15)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 340,
          height: 340,
          borderRadius: '50%',
          border: '1px solid rgba(0, 177, 64, 0.12)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 260,
          height: 260,
          borderRadius: '50%',
          border: '1px dashed rgba(212, 175, 55, 0.1)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Orbiting dots */}
      <motion.div
        style={{ 
          position: 'absolute', 
          left: '50%',
          top: '50%',
          width: 420, 
          height: 420,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      >
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          background: '#00ff88', 
          boxShadow: '0 0 15px #00ff88' 
        }} />
      </motion.div>
      <motion.div
        style={{ 
          position: 'absolute', 
          left: '50%',
          top: '50%',
          width: 340, 
          height: 340,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      >
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: 6, 
          height: 6, 
          borderRadius: '50%', 
          background: 'var(--gold)', 
          boxShadow: '0 0 15px var(--gold)' 
        }} />
      </motion.div>

      {/* Customer Robot (Left) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{
          position: 'absolute',
          left: '8%',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '100px',
            height: '120px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(244, 208, 63, 0.2))',
            borderRadius: '20px',
            border: '2px solid var(--gold)',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)',
            position: 'relative',
            padding: '10px',
          }}
        >
          {/* Head */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
              borderRadius: '10px',
              margin: '0 auto 8px',
              position: 'relative',
            }}
          >
            {/* Eyes */}
            <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '12px' }}>
              <motion.div
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#1a0f0a',
                  borderRadius: '50%',
                }}
              />
              <motion.div
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#1a0f0a',
                  borderRadius: '50%',
                }}
              />
            </div>
            {/* Antenna */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '2px',
              height: '12px',
              background: 'var(--gold)',
            }}>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: '-5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '6px',
                  height: '6px',
                  background: '#00ff88',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px #00ff88',
                }}
              />
            </div>
          </motion.div>
          {/* Body Icon */}
          <div style={{
            fontSize: '28px',
            textAlign: 'center',
            filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))',
          }}>
            👤
          </div>
        </motion.div>
        {/* Label */}
        <div style={{
          marginTop: '12px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '700',
          color: 'var(--gold-light)',
          textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
        }}>
          Customer
        </div>
      </motion.div>

      {/* Provider Robot (Right) */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        style={{
          position: 'absolute',
          right: '8%',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <motion.div
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{
            width: '100px',
            height: '120px',
            background: 'linear-gradient(135deg, rgba(0, 177, 64, 0.2), rgba(0, 213, 81, 0.2))',
            borderRadius: '20px',
            border: '2px solid var(--green)',
            boxShadow: '0 0 30px rgba(0, 177, 64, 0.5)',
            position: 'relative',
            padding: '10px',
          }}
        >
          {/* Head */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, var(--green), var(--green-light))',
              borderRadius: '10px',
              margin: '0 auto 8px',
              position: 'relative',
            }}
          >
            {/* Eyes */}
            <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '12px' }}>
              <motion.div
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: 0.5 }}
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#1a0f0a',
                  borderRadius: '50%',
                }}
              />
              <motion.div
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: 0.5 }}
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#1a0f0a',
                  borderRadius: '50%',
                }}
              />
            </div>
            {/* Antenna */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '2px',
              height: '12px',
              background: 'var(--green)',
            }}>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                style={{
                  position: 'absolute',
                  top: '-5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '6px',
                  height: '6px',
                  background: '#00ff88',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px #00ff88',
                }}
              />
            </div>
          </motion.div>
          {/* Body Icon */}
          <div style={{
            fontSize: '28px',
            textAlign: 'center',
            filter: 'drop-shadow(0 0 10px rgba(0, 177, 64, 0.5))',
          }}>
            🔧
          </div>
        </motion.div>
        {/* Label */}
        <div style={{
          marginTop: '12px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '700',
          color: '#00ff88',
          textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
        }}>
          Provider
        </div>
      </motion.div>

      {/* Center AI Node */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6, type: 'spring' }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '110px',
            height: '110px',
            background: 'linear-gradient(135deg, var(--gold), var(--green-light))',
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 0 50px rgba(212, 175, 55, 0.7), 0 0 100px rgba(0, 177, 64, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '50px',
            position: 'relative',
          }}
        >
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            🤖
          </motion.span>
          {/* Rotating ring */}
          <motion.div
            style={{
              position: 'absolute',
              width: '135px',
              height: '135px',
              border: '3px solid transparent',
              borderTopColor: 'var(--gold)',
              borderRightColor: 'var(--green)',
              borderRadius: '50%',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '15px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--gold), var(--green-light))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '1px',
          }}
        >
          AI MATCH
        </motion.div>
      </motion.div>

      {/* Connection Lines with animated packets */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00b140" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {/* Left to center */}
        <line
          x1="18%"
          y1="50%"
          x2="42%"
          y2="50%"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeDasharray="8 4"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1s" repeatCount="indefinite" />
        </line>
        {/* Center to right */}
        <line
          x1="58%"
          y1="50%"
          x2="82%"
          y2="50%"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeDasharray="8 4"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1s" repeatCount="indefinite" />
        </line>
        
        {/* Data packets */}
        <circle r="5" fill="var(--gold-light)" filter="url(#glow)">
          <animate attributeName="cx" from="18%" to="82%" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="cy" values="50%;48%;50%;52%;50%" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle r="4" fill="#00ff88" filter="url(#glow)">
          <animate attributeName="cx" from="82%" to="18%" dur="3s" repeatCount="indefinite" begin="1s" />
          <animate attributeName="cy" values="50%;52%;50%;48%;50%" dur="3s" repeatCount="indefinite" begin="1s" />
        </circle>
        
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </svg>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Bot, Globe, MessageSquare, Mic, Wrench, Zap, Snowflake, Hammer, Paintbrush, Wind, Pickaxe, Car, Users, Smile, CheckCircle, Star, Rocket, Check, Bug, Tv } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (user) {
      if (user.user_type === 'provider') {
        router.push('/provider/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const slides = [
    {
      image: '/robotic_agent_plumber_1782920885923.jpg',
      title: 'AI Plumber Agent',
      desc: 'Orchestrating plumbing repairs with 3D geolocation matching and AI price validation.',
      icon: <Wrench size={24} />,
      color: 'rgba(212, 175, 55, 0.2)',
      textColor: 'var(--gold-light)'
    },
    {
      image: '/robotic_agent_electrician_1782920898493.jpg',
      title: 'AI Electrician Agent',
      desc: 'Hyperlocal electrical dispatching with secure real-time tracking.',
      icon: <Zap size={24} />,
      color: 'rgba(0, 177, 64, 0.2)',
      textColor: 'var(--green)'
    },
    {
      image: '/robotic_agent_mechanic_1782920907820.jpg',
      title: 'AI Mechanic Agent',
      desc: 'Instant automotive matching and verified local diagnostics.',
      icon: <Car size={24} />,
      color: 'rgba(0, 255, 136, 0.2)',
      textColor: '#00ff88'
    }
  ];

  // Auto-slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const features = [
    {
      icon: <Bot size={56} strokeWidth={1.5} />,
      title: 'AI-Powered Matching',
      description: 'Multi-agent system intelligently connects you with the best service providers instantly.',
      gradient: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(244, 208, 63, 0.1))',
    },
    {
      icon: <Globe size={56} strokeWidth={1.5} />,
      title: 'Real-Time Discovery',
      description: 'Find registered providers & real businesses from Google Places on a live interactive map.',
      gradient: 'linear-gradient(135deg, rgba(0, 177, 64, 0.15), rgba(0, 213, 81, 0.1))',
    },
    {
      icon: <MessageSquare size={56} strokeWidth={1.5} />,
      title: 'Smart Negotiation',
      description: 'Chat directly, negotiate prices with AI verification ensuring total transparency and safety.',
      gradient: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(0, 177, 64, 0.1))',
    },
    {
      icon: <Mic size={56} strokeWidth={1.5} />,
      title: 'Multi-Lingual Support',
      description: 'Speak naturally in Urdu, Roman Urdu, or English - our NLP models understand everything.',
      gradient: 'linear-gradient(135deg, rgba(0, 177, 64, 0.15), rgba(212, 175, 55, 0.1))',
    },
  ];

  const services = [
    { icon: <Wrench size={40} strokeWidth={1.5} />, name: 'Plumber', color: 'var(--gold)' },
    { icon: <Zap size={40} strokeWidth={1.5} />, name: 'Electrician', color: 'var(--green)' },
    { icon: <Snowflake size={40} strokeWidth={1.5} />, name: 'AC Technician', color: 'var(--gold-light)' },
    { icon: <Hammer size={40} strokeWidth={1.5} />, name: 'Carpenter', color: '#00ff88' },
    { icon: <Paintbrush size={40} strokeWidth={1.5} />, name: 'Painter', color: 'var(--gold)' },
    { icon: <Wind size={40} strokeWidth={1.5} />, name: 'Cleaner', color: 'var(--green)' },
    { icon: <Pickaxe size={40} strokeWidth={1.5} />, name: 'Mason', color: 'var(--gold-light)' },
    { icon: <Car size={40} strokeWidth={1.5} />, name: 'Mechanic', color: '#00ff88' },
    { icon: <Bug size={40} strokeWidth={1.5} />, name: 'Pest Control', color: 'var(--gold)' },
    { icon: <Tv size={40} strokeWidth={1.5} />, name: 'Appliance', color: 'var(--green)' },
  ];

  const stats = [
    { number: '1000+', label: 'Service Providers', icon: <Users size={48} strokeWidth={1.5} /> },
    { number: '5000+', label: 'Happy Customers', icon: <Smile size={48} strokeWidth={1.5} /> },
    { number: '10K+', label: 'Services Completed', icon: <CheckCircle size={48} strokeWidth={1.5} /> },
    { number: '4.8★', label: 'Average Rating', icon: <Star size={48} strokeWidth={1.5} /> },
  ];

  return (
    <div className="page-wrapper" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      
      {/* Top Hero Section */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        padding: '120px 5% 60px',
      }}>
        {/* Animated Background Glows */}
        <div style={{
          position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px',
          background: 'radial-gradient(circle, var(--glow-1) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)', zIndex: 0
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '10%', width: '250px', height: '250px',
          background: 'radial-gradient(circle, var(--glow-2) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)', zIndex: 0
        }} />

        <div className="hero-container" style={{
          display: 'flex',
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          gap: '50px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Left Content */}
          <motion.div style={{ flex: 1, maxWidth: '600px' }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
              <motion.div 
                whileHover={{ rotate: 180, scale: 1.1 }} transition={{ duration: 0.5 }}
                style={{
                  background: 'var(--card-bg-subtle)',
                  padding: '10px', borderRadius: '15px', 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                  border: '1px solid var(--border-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                <img src="/n-logo.svg" alt="Logo" style={{ width: '65px', height: '65px', objectFit: 'contain' }} />
              </motion.div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="font-orbitron" style={{ 
                  fontSize: '32px', fontWeight: '900', letterSpacing: '6px', lineHeight: '1',
                  background: 'var(--brand-title-gradient)', 
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(212,175,55,0.5)', textTransform: 'uppercase'
                }}>
                  NEARLINK
                </span>
                <span style={{ fontSize: '10px', color: 'var(--gold-light)', letterSpacing: '8px', textTransform: 'uppercase', fontWeight: '700', marginTop: '4px', opacity: 0.8 }}>
                  AI Orchestrator
                </span>
              </div>
            </div>
            <h1 style={{
              fontSize: 'clamp(40px, 5vw, 70px)',
              fontWeight: '900',
              marginBottom: '20px',
              lineHeight: '1.1',
              background: 'var(--hero-title-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px'
            }}>
              Smart Services.<br/> 
              <span style={{ color: 'var(--green)', WebkitTextFillColor: 'var(--green)' }}>Zero Hassle.</span>
            </h1>
            <p style={{
              fontSize: 'clamp(16px, 1.5vw, 20px)',
              color: 'var(--text-secondary)',
              marginBottom: '40px',
              lineHeight: '1.7',
            }}>
              Experience the future of local services. Our AI agents match you with the best professionals instantly. Fast, reliable, and premium quality service at your fingertips.
            </p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <Link href="/auth/signup" style={{
                padding: '16px 40px', fontSize: '18px', borderRadius: '30px', fontWeight: '800',
                background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
                color: '#000', textDecoration: 'none',
                boxShadow: '0 10px 30px rgba(212, 175, 55, 0.3)',
                transition: 'transform 0.2s',
                display: 'inline-block'
              }} className="btn-hover-scale">
                Get Started Free
              </Link>
              <Link href="#explore" style={{
                padding: '16px 40px', fontSize: '18px', borderRadius: '30px', fontWeight: '700',
                background: 'var(--btn-sec-bg)', border: '1px solid var(--btn-sec-border)',
                color: 'var(--text-primary)', textDecoration: 'none', transition: 'all 0.3s',
                display: 'inline-block'
              }} className="btn-hover-glow">
                Explore App ↓
              </Link>
            </div>
          </motion.div>

          {/* Right Images (Auto Carousel) */}
          <div className="hero-slider" style={{ flex: 1, position: 'relative', height: '600px', width: '100%', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundImage: `url(${slides[currentSlide].image})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }}
              >
                {/* Ambient VVIP Light Glow Tint Overlay */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(to top, rgba(26, 15, 10, 0.9) 0%, rgba(212, 175, 55, 0.1) 40%, transparent 100%)',
                  pointerEvents: 'none'
                }} />
                
                {/* 3D Glass Glossy overlay */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)',
                  pointerEvents: 'none'
                }} />

                {/* Radial Vignette Mask to cover edge/corner text (Careem/Bykea) and spotlight the robot */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'radial-gradient(circle, transparent 35%, rgba(26, 15, 10, 0.9) 80%)',
                  pointerEvents: 'none'
                }} />

                {/* Top-Left VVIP Branding Badge */}
                <div style={{
                  position: 'absolute', top: 24, left: 24,
                  background: 'rgba(26, 15, 10, 0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(212, 175, 55, 0.4)', padding: '10px 18px', borderRadius: '30px',
                  display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 32px rgba(212, 175, 55, 0.25)'
                }}>
                  <span style={{ fontSize: 8, color: 'var(--green-light)', animation: 'pulse 1.5s infinite' }}>●</span>
                  <span style={{ fontSize: '11px', color: 'var(--gold-light)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    NearLink AI Orchestrator
                  </span>
                </div>

                {/* Top-Right Active Status Indicator */}
                <div style={{
                  position: 'absolute', top: 24, right: 24,
                  background: 'rgba(0, 177, 64, 0.12)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 177, 64, 0.3)', padding: '8px 14px', borderRadius: '20px',
                  color: 'var(--green-light)', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px'
                }}>
                  🤖 ACTIVE AGENT
                </div>

                {/* Holographic Controls panel info box */}
                <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40, background: 'rgba(26, 15, 10, 0.85)', padding: '28px', borderRadius: '25px', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.35)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: slides[currentSlide].color, border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: slides[currentSlide].textColor, boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)' }}>
                      {slides[currentSlide].icon}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '26px', margin: 0, color: 'var(--gold-light)', fontWeight: '900', letterSpacing: '-0.5px' }}>
                        {slides[currentSlide].title}
                      </h3>
                      <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5' }}>
                        {slides[currentSlide].desc}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Indicators */}
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' }}>
              {slides.map((_, idx) => (
                <div key={idx} onClick={() => setCurrentSlide(idx)} style={{
                  width: currentSlide === idx ? '30px' : '10px',
                  height: '10px',
                  borderRadius: '10px',
                  background: currentSlide === idx ? 'var(--gold-light)' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Explore Journey / Deep Dive Section */}
      <section className="shutter-section" id="explore" style={{ padding: '120px 5%', position: 'relative', zIndex: 11, background: 'var(--section-bg-gradient-1)' }}>
        {/* Shutter Effect Overlay */}
        <motion.div 
          initial={{ height: '100%' }} whileInView={{ height: '0%' }} viewport={{ once: true, margin: "0px" }}
          transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1] }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'var(--page-bg)', zIndex: 50, borderBottom: '2px solid var(--gold-light)' }} 
        />
        <div className="container" style={{ maxWidth: '1400px' }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
            style={{ textAlign: 'center', marginBottom: '100px' }}
          >
            <h2 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: '900', marginBottom: '20px', letterSpacing: '-1px' }}>
              Designed for the <span style={{ color: 'var(--gold-light)' }}>Future</span>
            </h2>
            <p style={{ fontSize: '20px', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
              Take a closer look at the revolutionary interface powering the NearLink ecosystem. Every interaction is optimized for speed, clarity, and trust.
            </p>
          </motion.div>

          {/* Feature Highlight 1: AI Chat Negotiation */}
          <div className="feature-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '60px', marginBottom: '150px' }}>
            <motion.div style={{ flex: 1, minWidth: '300px' }}
              initial={{ opacity: 0, x: -60, rotateY: -15 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }} 
              viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
            >
              <div style={{ position: 'relative', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(45deg, rgba(212,175,55,0.2), transparent)', pointerEvents: 'none' }} />
                <img src="/ui_mockup_ai_chat_1782921785507.jpg" alt="AI Chat Mockup" style={{ width: '100%', display: 'block', transition: 'transform 0.5s hover' }} className="zoom-on-hover" />
              </div>
            </motion.div>
            <motion.div style={{ flex: 1, minWidth: '300px' }}
              initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', background: 'rgba(212,175,55,0.1)', color: 'var(--gold-light)', borderRadius: '20px', fontWeight: '700', marginBottom: '20px', border: '1px solid rgba(212,175,55,0.3)' }}>
                <MessageSquare size={18} style={{ marginRight: '8px' }} /> AI-Powered Negotiation
              </div>
              <h3 style={{ fontSize: 'clamp(32px, 3vw, 44px)', fontWeight: '900', marginBottom: '24px', lineHeight: '1.2' }}>
                Chat securely. <br />Agree on prices effortlessly.
              </h3>
              <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '24px' }}>
                Our intelligent chat interface allows you to communicate directly with service providers in your preferred language. The integrated AI monitors the conversation, helps suggest fair market prices, and ensures a transparent agreement before work begins.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: 'var(--text-primary)' }}>
                  <Check size={18} color="var(--gold-light)" /> Multi-lingual real-time translation
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: 'var(--text-primary)' }}>
                  <Check size={18} color="var(--gold-light)" /> Smart contract-based agreements
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: 'var(--text-primary)' }}>
                  <Check size={18} color="var(--gold-light)" /> End-to-end encrypted messaging
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Feature Highlight 2: Map Tracking */}
          <div className="feature-row reverse" style={{ display: 'flex', flexWrap: 'wrap-reverse', alignItems: 'center', gap: '60px' }}>
            <motion.div style={{ flex: 1, minWidth: '300px' }}
              initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', background: 'rgba(0,177,64,0.1)', color: 'var(--green)', borderRadius: '20px', fontWeight: '700', marginBottom: '20px', border: '1px solid rgba(0,177,64,0.3)' }}>
                <Globe size={18} style={{ marginRight: '8px' }} /> Real-Time Tracking
              </div>
              <h3 style={{ fontSize: 'clamp(32px, 3vw, 44px)', fontWeight: '900', marginBottom: '24px', lineHeight: '1.2' }}>
                Watch your provider <br />arrive on the map.
              </h3>
              <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '24px' }}>
                Never wonder when your service provider will arrive again. Our live tracking interface integrates seamlessly with OSM and Google Maps to give you pin-point accurate ETAs, complete with glowing routes and live updates.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: 'var(--text-primary)' }}>
                  <Check size={18} color="var(--green)" /> Hyper-accurate Geolocation
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: 'var(--text-primary)' }}>
                  <Check size={18} color="var(--green)" /> Predictive arrival times
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: 'var(--text-primary)' }}>
                  <Check size={18} color="var(--green)" /> Live status indicators
                </li>
              </ul>
            </motion.div>
            <motion.div style={{ flex: 1, minWidth: '300px' }}
              initial={{ opacity: 0, x: 60, rotateY: 15 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }} 
              viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
            >
              <div style={{ position: 'relative', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,177,64,0.15)', border: '1px solid rgba(0,177,64,0.3)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(45deg, rgba(0,177,64,0.2), transparent)', pointerEvents: 'none' }} />
                <img src="/ui_mockup_map_tracking_1782921796328.jpg" alt="Map Tracking Mockup" style={{ width: '100%', display: 'block', transition: 'transform 0.5s hover' }} className="zoom-on-hover" />
              </div>
            </motion.div>
          </div>

          {/* Feature Highlight 3: Multi-Lingual Support */}
          <div className="feature-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '60px', marginTop: '150px' }}>
            <motion.div style={{ flex: 1, minWidth: '300px' }}
              initial={{ opacity: 0, x: -60, rotateY: -15 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }} 
              viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
            >
              <div style={{ position: 'relative', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(45deg, rgba(212,175,55,0.2), transparent)', pointerEvents: 'none' }} />
                <img src="/ui_mockup_multilingual_1782922116424.jpg" alt="Multilingual UI Mockup" style={{ width: '100%', display: 'block', transition: 'transform 0.5s hover' }} className="zoom-on-hover" />
              </div>
            </motion.div>
            <motion.div style={{ flex: 1, minWidth: '300px' }}
              initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', background: 'rgba(212,175,55,0.1)', color: 'var(--gold-light)', borderRadius: '20px', fontWeight: '700', marginBottom: '20px', border: '1px solid rgba(212,175,55,0.3)' }}>
                <Mic size={18} style={{ marginRight: '8px' }} /> Universal Language AI
              </div>
              <h3 style={{ fontSize: 'clamp(32px, 3vw, 44px)', fontWeight: '900', marginBottom: '24px', lineHeight: '1.2' }}>
                Speak your mind. <br />We understand.
              </h3>
              <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '24px' }}>
                Whether you prefer Roman Urdu, English, or pure Urdu voice notes, our advanced NLP engine instantly processes your intent and communicates flawlessly with providers. Language barriers are a thing of the past.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: 'var(--text-primary)' }}>
                  <Check size={18} color="var(--gold-light)" /> Voice & Text Recognition
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: 'var(--text-primary)' }}>
                  <Check size={18} color="var(--gold-light)" /> Roman Urdu specialized models
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: 'var(--text-primary)' }}>
                  <Check size={18} color="var(--gold-light)" /> Seamless Auto-Translation
                </li>
              </ul>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Stats Section */}
      <section className="shutter-section" style={{ padding: '80px 20px', background: 'var(--section-bg-2)', borderTop: '1px solid var(--border-gold)', position: 'relative', zIndex: 12 }}>
        <motion.div 
          initial={{ height: '100%' }} whileInView={{ height: '0%' }} viewport={{ once: true, margin: "0px" }}
          transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1] }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'var(--section-bg-gradient-1)', zIndex: 50, borderBottom: '2px solid var(--gold-light)' }} 
        />
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '30px',
            maxWidth: '1000px',
            margin: '0 auto',
          }}>
            {stats.map((stat, i) => (
              <motion.div key={i} 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{
                  padding: '40px 20px', textAlign: 'center', background: 'var(--card-bg-subtle)',
                  borderRadius: '20px', border: '1px solid var(--border-gold)'
                }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  {stat.icon}
                </div>
                <div className="font-orbitron" style={{
                  fontSize: '36px', fontWeight: '800', color: 'var(--gold-light)', marginBottom: '8px',
                }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: '14px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="shutter-section" id="features" style={{ padding: '120px 20px', position: 'relative', zIndex: 13, background: 'var(--page-bg)' }}>
        <motion.div 
          initial={{ height: '100%' }} whileInView={{ height: '0%' }} viewport={{ once: true, margin: "0px" }}
          transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1] }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'var(--section-bg-2)', zIndex: 50, borderBottom: '2px solid var(--green)' }} 
        />
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: '900', marginBottom: '20px' }}>
              Why Choose NearLink?
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
              Experience the future of local service discovery with our advanced AI technology, designed to make your life easier.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px',
          }}>
            {features.map((feature, i) => (
              <motion.div key={i} 
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{
                  padding: '40px', background: feature.gradient, borderRadius: '30px',
                  border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)'
                }}>
                <div style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="shutter-section" style={{ padding: '120px 20px', background: 'var(--section-bg-2)', position: 'relative', zIndex: 14 }}>
        <motion.div 
          initial={{ height: '100%' }} whileInView={{ height: '0%' }} viewport={{ once: true, margin: "0px" }}
          transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1] }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'var(--page-bg)', zIndex: 50, borderBottom: '2px solid var(--gold-light)' }} 
        />
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: '900', marginBottom: '20px' }}>
              Popular Services
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
              Find trusted professionals for all your home service needs
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px',
            maxWidth: '1200px', margin: '0 auto',
          }}>
            {services.map((service, i) => (
              <motion.div key={i} 
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.5 }}
                whileHover={{ y: -15, scale: 1.05 }}
                className="service-card-vvip"
                style={{
                  position: 'relative',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--card-bg-subtle)',
                  borderRadius: '30px',
                  border: '1px solid var(--border-gold)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                  overflow: 'hidden'
                }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, transparent, ${service.color}, transparent)` }} />
                
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: `linear-gradient(135deg, ${service.color}15, ${service.color}05)`,
                  border: `1px solid ${service.color}33`,
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  color: service.color,
                  boxShadow: `0 0 20px ${service.color}22`
                }}>
                  {service.icon}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                  {service.name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="shutter-section" style={{ padding: '120px 20px', position: 'relative', zIndex: 15, background: 'var(--section-bg-3)' }}>
        <motion.div 
          initial={{ height: '100%' }} whileInView={{ height: '0%' }} viewport={{ once: true, margin: "0px" }}
          transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1] }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'var(--section-bg-2)', zIndex: 50, borderBottom: '2px solid var(--green)' }} 
        />
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            style={{
              padding: '80px 40px', textAlign: 'center', maxWidth: '800px', margin: '0 auto',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(0, 177, 64, 0.15))',
              borderRadius: '40px', border: '1px solid var(--border-gold)'
            }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', color: 'var(--text-primary)' }}>
              <Rocket size={64} strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: '900', marginBottom: '20px' }}>
              Ready to Get Started?
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.6' }}>
              Join thousands of satisfied customers and service providers on NearLink.<br />
              Create your free account in seconds.
            </p>
            <Link href="/auth/signup" style={{
              padding: '20px 56px', fontSize: '18px', borderRadius: '30px', fontWeight: '800',
              background: 'var(--text-primary)', color: 'var(--dark-bg)', textDecoration: 'none', display: 'inline-block',
              boxShadow: '0 10px 30px var(--border-gold)'
            }}>
              Create Free Account →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="shutter-section" style={{
        padding: '40px 20px', borderTop: '1px solid var(--border-gold)', textAlign: 'center',
        background: 'var(--footer-bg)', position: 'relative', zIndex: 16
      }}>
        <motion.div 
          initial={{ height: '100%' }} whileInView={{ height: '0%' }} viewport={{ once: true, margin: "0px" }}
          transition={{ duration: 0.7, ease: [0.77, 0, 0.175, 1] }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'var(--section-bg-3)', zIndex: 50, borderBottom: '2px solid var(--gold-light)' }} 
        />
        <div className="container" style={{ position: 'relative', zIndex: 60 }}>
          <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
            © 2026 NearLink. AI-Powered Local Services Marketplace.
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .btn-hover-scale:hover { transform: scale(1.05); }
        .btn-hover-glow:hover { background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.3) !important; }
        .zoom-on-hover:hover { transform: scale(1.02); }
        
        @media (max-width: 900px) {
          .feature-row {
            flex-direction: column !important;
            gap: 40px !important;
          }
          .feature-row.reverse {
            flex-direction: column-reverse !important;
          }
        }
        
        .shutter-section {
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .hero-container {
            flex-direction: column !important;
            padding-top: 40px;
          }
          .hero-slider {
            height: 400px !important;
          }
        }
      `}</style>
    </div>
  );
}

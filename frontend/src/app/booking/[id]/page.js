'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingAPI, chatAPI } from '@/lib/api';

export default function BookingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id;

  const [step, setStep] = useState('loading'); // loading | confirm | active
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [negotiatedAmountInput, setNegotiatedAmountInput] = useState('');
  const [suggestedAmount, setSuggestedAmount] = useState(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [modalError, setModalError] = useState('');
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (bookingId && user) {
      if (bookingId === 'confirm') {
        const data = localStorage.getItem('quickfix_booking_data');
        if (data) {
          setBooking(JSON.parse(data));
          setStep('confirm');
        } else {
          setStep('no-data');
        }
      } else {
        fetchBookingDetails();
      }
    }
  }, [bookingId, user]);

  // Poll for messages and status updates
  useEffect(() => {
    let interval;
    if (step === 'active' && bookingId !== 'confirm') {
      interval = setInterval(() => {
        fetchMessages(false);
        fetchBookingStatus();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [step, bookingId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchBookingDetails = async () => {
    try {
      const data = await bookingAPI.get(bookingId);
      setBooking(data);
      setStep('active');
      fetchMessages(true);
    } catch (err) {
      console.error(err);
      setStep('no-data');
    }
  };

  const fetchBookingStatus = async () => {
    try {
      const data = await bookingAPI.get(bookingId);
      if (data.status !== booking?.status || data.final_price !== booking?.final_price || data.safety_alert_triggered !== booking?.safety_alert_triggered) {
        setBooking(data);
      }
    } catch (err) {}
  };

  const updateBookingStatus = async (newStatus, amount = null) => {
    setSubmittingStatus(true);
    setModalError('');
    try {
      await bookingAPI.updateStatus(bookingId, newStatus, amount);
      setShowPickupModal(false);
      setNegotiatedAmountInput('');
      setSuggestedAmount(null);
      fetchBookingStatus();
    } catch (err) {
      // Check if error is structured with suggested_amount
      try {
        const rawDetail = JSON.parse(err.message);
        if (rawDetail && typeof rawDetail === 'object') {
          setModalError(rawDetail.detail);
          if (rawDetail.suggested_amount) {
            setSuggestedAmount(rawDetail.suggested_amount);
          }
          return;
        }
      } catch (parseErr) {}
      
      setModalError(err.message || "Failed to update status");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const triggerSOS = async () => {
    if (confirm("⚠️ EMERGENCY: This will alert admins and emergency services. Are you sure?")) {
      try {
        await bookingAPI.sos(bookingId);
        alert("SOS Alert Sent! Help is on the way.");
        fetchBookingStatus();
      } catch (err) {
        alert("Failed to send alert.");
      }
    }
  };

  const handleForceComplete = async () => {
    if (confirm("Did the provider finish the work? This will settle the payment and deduct commission.")) {
      try {
        await bookingAPI.updateStatus(bookingId, 'completed');
        alert("Job marked as completed. Thank you!");
        fetchBookingStatus();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleUploadWork = async () => {
    try {
      await bookingAPI.uploadWork(bookingId);
      alert("Proof of work uploaded successfully! You can now complete the job.");
      fetchBookingStatus();
    } catch (err) {
      alert("Upload failed.");
    }
  };

  const handleProviderComplete = async () => {
    if (!booking.completion_image_url) {
      alert("Please upload proof of work (photo) before completing the job.");
      return;
    }
    try {
      await bookingAPI.updateStatus(bookingId, 'completed');
      alert("Job completed successfully!");
      fetchBookingStatus();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchMessages = async (initial = false) => {
    if (initial) setMessagesLoading(true);
    try {
      const msgs = await chatAPI.history(bookingId);
      setMessages(msgs);
    } catch (err) {
    } finally {
      if (initial) setMessagesLoading(false);
    }
  };

  const handleConfirm = async () => {
    const data = JSON.parse(localStorage.getItem('quickfix_booking_data'));
    if (!data) return;
    setStep('loading');
    try {
      const res = await bookingAPI.create({
        request_id: data.requestId,
        provider_id: data.providerId,
        scheduled_time: data.scheduledTime,
        notes: '',
      });
      localStorage.removeItem('quickfix_booking_data');
      router.push(`/booking/${res.booking.id}`);
    } catch (err) {
      setError(err.message);
      setStep('confirm');
    }
  };

  const sendMessage = async (type = 'text') => {
    if (type === 'text' && !newMessage.trim()) return;
    if (type === 'offer' && !offerAmount) return;

    try {
      await chatAPI.send(
        bookingId, 
        type === 'offer' ? `Price Offer: Rs. ${offerAmount}` : newMessage,
        type,
        type === 'offer' ? parseFloat(offerAmount) : null
      );
      setNewMessage('');
      setOfferAmount('');
      setShowOfferInput(false);
      fetchMessages();
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const acceptOffer = async (msgId) => {
    try {
      await chatAPI.acceptOffer(msgId);
      fetchMessages();
      fetchBookingStatus();
    } catch (err) {
      alert('Failed to accept offer');
    }
  };

  if (step === 'loading' || authLoading) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  if (step === 'no-data') return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ fontSize: 64, marginBottom: 16 }}>📋</p>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Booking Not Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>We couldn't find the requested booking details.</p>
        <button className="btn-primary" onClick={() => router.push('/dashboard')} style={{ marginTop: 24, borderRadius: 12 }}>
          Return Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper" style={{ padding: '100px 20px 60px' }}>
      <div className="container" style={{ maxWidth: step === 'active' ? 900 : 650 }}>
        
        {/* Step: Confirm Booking */}
        {step === 'confirm' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>CHECKOUT</div>
            <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-1px' }}>📋 Confirm <span className="gradient-text">Booking</span></h1>
            <p className="section-subtitle">Review your service details before confirming</p>

            {error && (
              <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', fontSize: 14 }}>
                {error}
              </div>
            )}

            <div className="glass-card" style={{ padding: 32, marginBottom: 24, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--green), var(--gold), var(--green))', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite', borderRadius: '16px 16px 0 0' }} />
              
              <div style={{ display: 'grid', gap: 20 }}>
                <div style={{ paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, letterSpacing: '1px' }}>PROVIDER</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{booking.providerName}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, letterSpacing: '1px' }}>SERVICE</p>
                    <p style={{ fontSize: 15, fontWeight: 600 }}>{booking.serviceType}</p>
                  </div>
                  <div>
                    <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, letterSpacing: '1px' }}>SCHEDULE</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold-light)' }}>{booking.scheduledTime}</p>
                  </div>
                </div>
                <div>
                  <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, letterSpacing: '1px' }}>ESTIMATED PRICE</p>
                  <p className="font-orbitron" style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-light)' }}>{booking.price}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>*Final price will be decided after inspection/negotiation</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <button className="btn-secondary" onClick={() => router.back()} style={{ flex: 1, borderRadius: 12, fontWeight: 700 }}>
                ← Back
              </button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary" onClick={handleConfirm}
                style={{ flex: 2, borderRadius: 12, fontWeight: 800, padding: '16px' }}>
                🚀 Confirm Booking
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step: Active Booking Dashboard */}
        {step === 'active' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 24 }}>
            
            {/* Left: Chat & Negotiation */}
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
              <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800 }}>Chat with {booking.provider_name}</h3>
                    <p style={{ fontSize: 12, color: 'var(--green-light)' }}>● Online</p>
                  </div>
                  <a href={`tel:${booking.provider_phone || '000'}`} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📞 Call Now
                  </a>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {messagesLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <div className="spinner" style={{ width: 30, height: 30 }} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>
                      <p style={{ fontSize: 40, marginBottom: 12 }}>💬</p>
                      <p style={{ fontSize: 14 }}>Start a conversation to negotiate price or discuss details.</p>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} style={{ alignSelf: m.sender_id === user.id ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                        <div style={{ 
                          padding: '12px 16px', 
                          borderRadius: 14, 
                          background: m.sender_id === user.id ? 'var(--green)' : 'rgba(255,255,255,0.08)',
                          color: m.sender_id === user.id ? 'black' : 'white',
                          fontWeight: 500,
                          fontSize: 14,
                          position: 'relative'
                        }}>
                          {m.message_type === 'offer' ? (
                            <div style={{ textAlign: 'center' }}>
                              <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, fontWeight: 800 }}>💰 PRICE OFFER</p>
                              <p style={{ fontSize: 20, fontWeight: 900 }}>Rs. {m.offer_amount}</p>
                              {m.is_accepted ? (
                                <div style={{ marginTop: 8, padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.2)', fontSize: 11, fontWeight: 800 }}>
                                  ✅ ACCEPTED
                                </div>
                              ) : (
                                user.user_type === 'customer' && m.sender_id !== user.id && (
                                  <button onClick={() => acceptOffer(m.id)} className="btn-primary" style={{ marginTop: 12, width: '100%', padding: '8px', fontSize: 12, background: 'white', color: 'black' }}>
                                    Accept Offer
                                  </button>
                                )
                              )}
                            </div>
                          ) : (
                            m.content
                          )}
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: m.sender_id === user.id ? 'right' : 'left' }}>
                          {m.sender_name} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                  {booking.status === 'completed' ? (
                    <div style={{ textAlign: 'center', padding: '10px', color: 'var(--green-light)', fontWeight: 700, fontSize: 14 }}>
                      ✅ Negotiation Finalized & Job Completed
                    </div>
                  ) : (
                    <>
                      <AnimatePresence>
                        {showOfferInput && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            style={{ marginBottom: 16, padding: 16, borderRadius: 12, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>SEND PRICE OFFER</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <input type="number" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} placeholder="Amount (Rs.)"
                                style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                              <button onClick={() => sendMessage('offer')} className="btn-primary" style={{ padding: '0 20px', borderRadius: 8, fontSize: 12 }}>Send Offer</button>
                              <button onClick={() => setShowOfferInput(false)} className="btn-secondary" style={{ padding: '10px' }}>✕</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div style={{ display: 'flex', gap: 12 }}>
                        {user.user_type === 'provider' && !showOfferInput && (
                          <button onClick={() => setShowOfferInput(true)} style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', color: 'var(--gold)', fontSize: 20 }}>
                            💰
                          </button>
                        )}
                        <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type a message..." style={{ flex: 1, padding: '12px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                        <button onClick={() => sendMessage()} className="btn-primary" style={{ width: 44, height: 44, borderRadius: 12, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          🚀
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Status & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="glass-card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                {booking.safety_alert_triggered && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.1)', border: '2px solid var(--error)', pointerEvents: 'none', animation: 'pulse-red 2s infinite' }} />
                )}
                
                <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 12, letterSpacing: '1px' }}>BOOKING STATUS</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: booking.status === 'completed' ? 'var(--green)' : 'var(--gold)', boxShadow: `0 0 10px ${booking.status === 'completed' ? 'var(--green)' : 'var(--gold)'}` }} />
                  <span style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{booking.status?.replace('_', ' ')}</span>
                </div>
                
                <div style={{ display: 'grid', gap: 16 }}>
                  {/* Phase 8: Pickup Job for Provider */}
                  {user.user_type === 'provider' && booking.status === 'confirmed' && (
                    <div style={{ marginTop: 8, padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.05)', border: '1px dashed rgba(16,185,129,0.3)' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Ready to start the job?</p>
                      <button onClick={() => setShowPickupModal(true)} className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: 12, background: 'var(--green)', color: 'black' }}>
                        ⚡ Pickup Job
                      </button>
                    </div>
                  )}

                  <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>FINAL PRICE</p>
                    <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--green-light)' }}>
                      {booking.final_price > 0 ? `Rs. ${booking.final_price}` : 'TBD'}
                    </p>
                  </div>
                  
                  {/* Phase 8: Force Completion for Customer */}
                  {user.user_type === 'customer' && booking.status === 'in_progress' && (
                    <div style={{ marginTop: 8, padding: 16, borderRadius: 12, background: 'rgba(245,166,35,0.05)', border: '1px dashed rgba(245,166,35,0.3)' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Work finished but not marked by provider?</p>
                      <button onClick={handleForceComplete} className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: 12, background: 'var(--gold)', color: 'black' }}>
                        Confirm Completion
                      </button>
                    </div>
                  )}

                  {/* Phase 8: Proof of Work for Provider */}
                  {user.user_type === 'provider' && booking.status === 'in_progress' && (
                    <div style={{ marginTop: 8 }}>
                      {!booking.completion_image_url ? (
                        <button onClick={handleUploadWork} className="btn-secondary" style={{ width: '100%', padding: '12px', fontSize: 12, border: '1px solid var(--green-light)', color: 'var(--green-light)' }}>
                          📷 Upload Proof of Work
                        </button>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: 11, color: 'var(--green-light)', fontWeight: 800, marginBottom: 8 }}>✅ PROOF UPLOADED</p>
                          <button onClick={handleProviderComplete} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14, background: 'var(--green)' }}>
                            Mark as Completed
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SCHEDULED FOR</p>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>{booking.scheduled_time}</p>
                  </div>
                </div>
              </div>

              {/* Safety Section */}
              <div className="glass-card" style={{ padding: 24, border: booking.safety_alert_triggered ? '2px solid var(--error)' : '1px solid rgba(255,255,255,0.05)' }}>
                <p className="font-mono" style={{ fontSize: 11, color: 'var(--error)', fontWeight: 700, marginBottom: 12, letterSpacing: '1px' }}>SAFETY & SECURITY</p>
                <button 
                  onClick={triggerSOS}
                  disabled={booking.safety_alert_triggered}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: 12, 
                    background: booking.safety_alert_triggered ? 'var(--error)' : 'rgba(239,68,68,0.1)',
                    border: '1px solid var(--error)', color: 'white', fontWeight: 800,
                    cursor: booking.safety_alert_triggered ? 'not-allowed' : 'pointer',
                    boxShadow: booking.safety_alert_triggered ? '0 0 20px var(--error)' : 'none'
                  }}
                >
                  {booking.safety_alert_triggered ? '🚨 SOS ACTIVE' : '🆘 TRIGGER SOS'}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
                  Use only in case of immediate danger or harassment.
                </p>
              </div>

              <div className="glass-card" style={{ padding: 24 }}>
                <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 12, letterSpacing: '1px' }}>SERVICE INFO</p>
                <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{booking.provider_name}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{booking.service_type}</p>
                
                {booking.notes && (
                  <div style={{ padding: 12, borderRadius: 8, background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.1)' }}>
                    <p style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>NOTES:</p>
                    <p style={{ fontSize: 12, lineHeight: 1.5 }}>{booking.notes}</p>
                  </div>
                )}
              </div>

              <button onClick={() => router.push('/dashboard')} className="btn-secondary" style={{ width: '100%', borderRadius: 12 }}>
                🏠 Return to Dashboard
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Pickup Negotiation Modal */}
      {showPickupModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)'
        }}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card" style={{ maxWidth: 450, width: '100%', padding: 32, border: '1px solid var(--gold-light)' }}>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>⚡ Pickup Job</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Enter the final negotiated amount agreed upon in the chat. The AI will verify this against your conversation history.
            </p>

            <div style={{ marginBottom: 24 }}>
              <label className="font-mono" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: '1px' }}>NEGOTIATED AMOUNT (RS.)</label>
              <input 
                type="number"
                autoFocus
                value={negotiatedAmountInput}
                onChange={(e) => setNegotiatedAmountInput(e.target.value)}
                placeholder="e.g. 1500"
                style={{
                  width: '100%', padding: '16px', borderRadius: 12, 
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,166,35,0.3)',
                  color: 'white', fontSize: 18, fontWeight: 700
                }}
              />
              {modalError && (
                <div style={{ 
                  marginTop: 12, padding: '10px 14px', borderRadius: 10, 
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', 
                  color: 'var(--error)', fontSize: 12, lineHeight: 1.4 
                }}>
                  {modalError}
                </div>
              )}
              {suggestedAmount && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setNegotiatedAmountInput(suggestedAmount.toString());
                      setModalError('');
                    }}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 10,
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)',
                      color: 'var(--green-light)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    ✨ Finalise (Ai reviewed ammount: Rs. {suggestedAmount})
                  </motion.button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => { setShowPickupModal(false); setNegotiatedAmountInput(''); }}
                className="btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: 12 }}
              >
                Cancel
              </button>
              <button 
                onClick={() => updateBookingStatus('in_progress', parseFloat(negotiatedAmountInput))}
                disabled={submittingStatus || !negotiatedAmountInput}
                className="btn-primary" style={{ flex: 2, padding: '14px', borderRadius: 12, background: 'var(--gold)', color: 'black' }}
              >
                {submittingStatus ? 'Verifying...' : '⚡ Confirm & Pickup'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

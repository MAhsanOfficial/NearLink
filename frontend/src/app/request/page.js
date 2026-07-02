'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { requestAPI, providerAPI } from '@/lib/api';
import { Mic, MicOff, Play, Pause, Trash2 } from 'lucide-react';

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
  const [error, setError] = useState('');
  
  // Voice Recording & Speech Recognition States
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackState, setPlaybackState] = useState('idle');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startRecording = async () => {
    setError('');
    setAudioUrl(null);
    setRecordingDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      // Speech Recognition initialization (Safe check for browser support)
      const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'ur-PK'; // Urdu/Roman Urdu transcription language

        rec.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setText(prev => (prev ? prev + ' ' : '') + finalTranscript);
          }
        };

        rec.onerror = (e) => {
          console.error("Speech recognition error:", e);
        };

        rec.start();
        recognitionRef.current = rec;
      }

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Mic access error:", err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };

  const deleteVoiceNote = () => {
    setAudioUrl(null);
    setRecordingDuration(0);
    setPlaybackState('idle');
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (playbackState === 'playing') {
      audioRef.current.pause();
      setPlaybackState('paused');
    } else {
      audioRef.current.play();
      setPlaybackState('playing');
    }
  };

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
    if (q) setText(q);
  }, [searchParams]);

  const handleParse = async () => {
    if (!text.trim()) return;
    setError('');
    setStep('parsing');
    try {
      const res = await requestAPI.parse(text);
      setParsed(res.parsed);
      setRequestId(res.request_id);
      setStep('parsed');
    } catch (err) {
      setError(err.message);
      setStep('input');
    }
  };

  const handleFindProviders = async () => {
    setStep('finding');
    try {
      const res = await providerAPI.rank(parsed.service_type, parsed.location, requestId);
      setProviders(res.providers || []);
      setRanking(res.ranking || {});
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
    router.push(`/booking/confirm`);
  };

  if (authLoading || !user) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page-wrapper" style={{ padding: '84px 20px 40px' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: 'var(--primary-green)', marginBottom: 4, fontWeight: 600 }}>AI SEARCH</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>New Service Request</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Describe what you need in any language</p>
        </div>

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 6, marginBottom: 20, background: '#fee', border: '1px solid #fcc', color: '#c33', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Input */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <textarea className="input-field" rows={3}
              placeholder='e.g. "Mujhe kal subah G-13 mein AC technician chahiye"'
              value={text} onChange={e => setText(e.target.value)}
              disabled={step !== 'input' && step !== 'parsed' || isRecording}
              style={{ resize: 'none', fontSize: 15, paddingRight: 60, marginBottom: 16 }} />
            
            {step === 'input' && (
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={isRecording ? 'pulse-animation' : ''}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: isRecording ? 'var(--error)' : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                  color: isRecording ? '#fff' : '#1a0f0a',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isRecording ? '0 0 20px rgba(239,68,68,0.5)' : '0 6px 20px rgba(212,175,55,0.3)',
                  transition: 'all 0.3s ease',
                  zIndex: 2
                }}
                title={isRecording ? "Stop Recording" : "Record Voice Note"}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
          </div>

          {/* Equalizer animation while recording */}
          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: 'rgba(212,175,55,0.06)', border: '1px solid var(--border-gold)', padding: '14px 18px', borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-light)', minWidth: 45 }}>
                {formatTime(recordingDuration)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, height: 24 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((bar) => (
                  <div key={bar} style={{
                    width: 4,
                    height: '100%',
                    background: 'var(--gold-light)',
                    borderRadius: 2,
                    animation: `soundwave 0.5s ease-in-out infinite alternate`,
                    animationDelay: `${bar * 0.05}s`
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Urdu/English Voice Note...</span>
            </div>
          )}

          {/* Audio Player Pill if recorded */}
          {audioUrl && !isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: 'var(--card-bg-subtle, rgba(255,255,255,0.02))', border: '1px solid var(--border-gold)', padding: '12px 16px', borderRadius: 12 }}>
              <button 
                onClick={togglePlayback}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.15)', border: '1px solid var(--border-gold)',
                  color: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {playbackState === 'playing' ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, color: 'var(--text-primary)' }}>Voice Note</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Duration: {formatTime(recordingDuration)}</p>
              </div>
              <button 
                onClick={deleteVoiceNote}
                style={{
                  background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 8
                }}
              >
                <Trash2 size={16} />
              </button>
              <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaybackState('idle')} style={{ display: 'none' }} />
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {step === 'input' && (
              <button className="btn-primary" onClick={handleParse} disabled={!text.trim() || isRecording}>
                Parse Request
              </button>
            )}
            {step === 'parsed' && (
              <>
                <button className="btn-primary" onClick={handleFindProviders}>
                  Find Providers
                </button>
                <button className="btn-secondary" onClick={() => { setStep('input'); setParsed(null); }}>
                  Edit
                </button>
              </>
            )}
            {(step === 'parsing' || step === 'finding') && (
              <button className="btn-secondary" disabled style={{ opacity: 0.6 }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing...
              </button>
            )}
          </div>
        </div>

        {/* Parsed Result */}
        {parsed && step !== 'input' && (
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>✓ Parsed Intent</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { label: 'Service', value: parsed.service_type },
                { label: 'Location', value: parsed.location },
                { label: 'Time', value: parsed.time },
                { label: 'Urgency', value: parsed.urgency },
              ].map((item, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 6, background: 'var(--card-bg-subtle, rgba(255,255,255,0.02))', border: '1px solid var(--border-gold)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>{item.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize', color: 'var(--primary-green)' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provider Results */}
        {step === 'results' && (
          <div>
            {ranking?.recommendation && providers.length > 0 && (
              <div className="card" style={{ padding: 20, marginBottom: 20, background: 'var(--recommendation-bg, rgba(0, 177, 64, 0.1))', border: '1px solid var(--border-green)' }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--primary-green)' }}>💡 AI Recommendation</p>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{ranking.recommendation}</p>
              </div>
            )}

            {providers.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>😔</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Providers Found</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                  No registered providers for {parsed?.service_type} in {parsed?.location}
                </p>
                <button className="btn-primary" onClick={() => { setStep('input'); setParsed(null); setProviders([]); }}>
                  Try Different Search
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Top Providers ({providers.length})</h3>

                {providers.map((provider, i) => {
                  const rankInfo = ranking?.ranked_providers?.find(r => r.provider_id === provider.id);
                  return (
                    <div key={provider.id} className="card" style={{
                      padding: 24, marginBottom: 16,
                      border: i === 0 ? '2px solid var(--primary-green)' : '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            {i === 0 && <span style={{ fontSize: 20 }}>🏆</span>}
                            <h4 style={{ fontSize: 18, fontWeight: 700 }}>{provider.name}</h4>
                            {provider.verified && <span className="badge badge-success">VERIFIED</span>}
                          </div>
                          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            📍 {provider.area} ({provider.distance_km}km away)
                          </div>
                          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            📞 {provider.phone}
                          </div>
                          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                            💰 {provider.price_range}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-green)' }}>
                            {provider.rating || 0}⭐
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{provider.total_reviews || 0} reviews</div>
                        </div>
                      </div>

                      {rankInfo?.reasoning && (
                        <div style={{ padding: 12, borderRadius: 6, background: 'var(--recommendation-bg, rgba(0, 177, 64, 0.1))', border: '1px solid var(--border-green)', marginBottom: 16 }}>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{rankInfo.reasoning}</p>
                        </div>
                      )}

                      <button
                        className="btn-primary"
                        onClick={() => handleBook(provider)}
                        style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600 }}
                      >
                        {i === 0 ? '🚀 Book Top Provider' : '📅 Book This Provider'}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

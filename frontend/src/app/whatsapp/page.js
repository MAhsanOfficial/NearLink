'use client';
import { useEffect, useRef, useState } from 'react';
import { whatsappAPI } from '@/lib/api';
import AgentBrain from '@/components/AgentBrain';
import { Send, Mic, Square } from 'lucide-react';

const DEFAULT_PHONE = '+92 300 1234567';

export default function WhatsAppPage() {
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Assalam o Alaikum! Tell me what service you need and where - type it or send a voice note. 🎙️' },
  ]);
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const endRef = useRef(null);
  const replayRef = useRef([]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => () => replayRef.current.forEach(clearTimeout), []);

  // The server returns the complete trace with the reply; replay it step by step so the audience can follow it.
  const replay = (all) => {
    replayRef.current.forEach(clearTimeout);
    setEvents([]);
    replayRef.current = all.map((e, i) => setTimeout(() => setEvents((prev) => [...prev, e]), i * 350));
  };

  const send = async ({ message, audioBlob }) => {
    setBusy(true);
    setError('');
    if (message) setMessages((m) => [...m, { from: 'me', text: message }]);
    if (audioBlob) setMessages((m) => [...m, { from: 'me', text: '🎙️ Voice note…', voice: true }]);
    try {
      const res = await whatsappAPI.simulate({ phone, text: message, audioBlob });
      if (res.transcript) {
        setMessages((m) => m.map((x, i) => (i === m.length - 1 && x.voice ? { ...x, text: `🎙️ "${res.transcript}"`, voice: false } : x)));
      }
      setMessages((m) => [...m, { from: 'bot', text: res.reply }]);
      replay(res.result.events || []);
    } catch (e) {
      setError(e.message);
      setMessages((m) => m.filter((x) => !x.voice));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setText('');
    send({ message });
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0) send({ audioBlob: blob });
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('Microphone access was denied. You can still type your request.');
    }
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: 100, paddingBottom: 120 }}>
      <h1 className="section-title"><span className="gradient-text">NearLink on WhatsApp</span></h1>
      <p className="section-subtitle" style={{ marginBottom: 20 }}>
        The same agents, reached through the app people already use. Send text or a voice note in Urdu, Roman Urdu or English.
      </p>

      <div className="wa-layout">
        <div>
          <div className="wa-phone">
            <div className="wa-header">
              <span className="wa-avatar">N</span>
              <div><strong>NearLink</strong><div style={{ fontSize: 11, color: '#8696a0' }}>{busy ? 'typing…' : 'online'}</div></div>
            </div>
            <div className="wa-messages" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`wa-bubble ${m.from}`} dir="auto">{m.text}</div>
              ))}
              <div ref={endRef} />
            </div>
            <form className="wa-input" onSubmit={submit}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={recording ? 'Recording… tap the square to send' : 'Type a message'}
                disabled={recording}
                dir="auto"
                aria-label="Message"
              />
              {text.trim() ? (
                <button type="submit" className="wa-icon-btn" disabled={busy} aria-label="Send"><Send size={18} /></button>
              ) : (
                <button type="button" className={`wa-icon-btn${recording ? ' rec' : ''}`} onClick={toggleRecording} disabled={busy} aria-label={recording ? 'Stop and send voice note' : 'Record voice note'}>
                  {recording ? <Square size={16} /> : <Mic size={18} />}
                </button>
              )}
            </form>
          </div>
          <label style={{ display: 'block', maxWidth: 380, margin: '14px auto 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Your WhatsApp number (customers are identified by phone)
            <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', marginTop: 6 }} />
          </label>
          {error && <div className="result-card result-warn" role="alert" style={{ maxWidth: 380, margin: '14px auto 0' }}><p>{error}</p></div>}
        </div>

        <AgentBrain events={events} running={busy} planner={events.find((e) => e.type === 'plan')?.output?.planner} />
      </div>
    </div>
  );
}

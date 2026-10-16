'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingAPI, followupAPI, orchestratorAPI } from '@/lib/api';
import AgentBrain from '@/components/AgentBrain';
import BookingResult from '@/components/BookingResult';
import { Sparkles, Send, FastForward, UserX, LocateFixed, RotateCcw } from 'lucide-react';

const EXAMPLES = [
  'Mujhe kal subah G-13 mein AC technician chahiye',
  'Bhai pipe leak ho gaya hai kitchen me, defence phase 2, abhi plumber chahiye',
  'مجھے کل شام الیکٹریشن چاہیے G-11 میں',
  'AC kharab hai',
];

export default function AgentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [text, setText] = useState('');
  const [events, setEvents] = useState([]);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [coords, setCoords] = useState(null);
  const [info, setInfo] = useState('');
  const abortRef = useRef(null);

  const run = async (message, previousRequestId = null) => {
    if (!message.trim() || running) return;
    setRunning(true);
    setError('');
    setInfo('');
    if (!previousRequestId) {
      setEvents([]);
      setResult(null);
    }
    abortRef.current = new AbortController();
    try {
      const res = await orchestratorAPI.stream(
        {
          text: message,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          previous_request_id: previousRequestId,
        },
        { onStep: (e) => setEvents((prev) => [...prev, e]), signal: abortRef.current.signal },
      );
      setResult(res);
      setText('');
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'Something went wrong');
    } finally {
      setRunning(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    run(text, result?.status === 'clarify' ? result.request_id : null);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('Geolocation is not supported in this browser');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setInfo('Using your current location for the search.');
      },
      () => setError('Could not read your location - mention an area in your message instead.'),
    );
  };

  const fastForward = async () => {
    try {
      const res = await followupAPI.fastForward(result.booking.id);
      setInfo(`Time travel: ${res.delivered} follow-up message(s) delivered - ${res.notifications.map((n) => n.type).join(', ')}. See them in Alerts.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const simulateCancel = async () => {
    setError('');
    setRunning(true);
    try {
      const res = await bookingAPI.simulateProviderCancel(result.booking.id);
      setEvents((prev) => [...prev, ...(res.events || [])]);
      setInfo(res.message || 'Booking cancelled.');
      if (res.rebooked) {
        setResult((prev) => ({
          ...prev, booking: res.new_booking, provider: res.provider, scheduled_at: res.scheduled_at,
          schedule_before: null, schedule_after: null, notifications: [],
        }));
      } else {
        setResult(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setEvents([]);
    setResult(null);
    setText('');
    setError('');
    setInfo('');
  };

  const awaitingAnswer = result?.status === 'clarify';

  return (
    <div className="page-wrapper container" style={{ paddingTop: 100, paddingBottom: 120 }}>
      <h1 className="section-title">
        <span className="gradient-text">Tell NearLink what you need</span>
      </h1>
      <p className="section-subtitle" style={{ marginBottom: 20 }}>
        Urdu, Roman Urdu or English. The agents find providers, check real availability, book the slot and schedule follow-ups.
      </p>

      <div className="agent-layout">
        <div>
          <form onSubmit={submit} className="panel">
            {awaitingAnswer && <div className="agent-question">{result.question}</div>}
            <textarea
              className="input-field"
              rows={3}
              dir="auto"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={awaitingAnswer ? 'Type your answer...' : 'e.g. Mujhe kal subah G-13 mein AC technician chahiye'}
              style={{ width: '100%', resize: 'vertical' }}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e); }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <button type="submit" className="btn-primary" disabled={running || !text.trim()} style={{ padding: '12px 22px' }}>
                {running ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Send size={16} />}
                {awaitingAnswer ? 'Answer' : 'Book it'}
              </button>
              <button type="button" className="btn-secondary" onClick={useMyLocation} style={{ padding: '10px 14px', fontSize: 12 }}>
                <LocateFixed size={14} /> {coords ? 'Location set' : 'Use my location'}
              </button>
              {(events.length > 0 || result) && (
                <button type="button" className="btn-secondary" onClick={reset} style={{ padding: '10px 14px', fontSize: 12 }}>
                  <RotateCcw size={14} /> New
                </button>
              )}
            </div>
            {!awaitingAnswer && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                {EXAMPLES.map((ex) => (
                  <button type="button" key={ex} className="example-chip" onClick={() => setText(ex)} dir="auto">{ex}</button>
                ))}
              </div>
            )}
            {!user && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                You are not signed in: you will get the best match, but need to sign in to confirm the booking.
              </p>
            )}
          </form>

          {error && <div className="result-card result-warn" role="alert"><p>{error}</p></div>}
          {info && <div className="agent-question" style={{ marginTop: 12 }}>{info}</div>}

          <BookingResult result={result} onLogin={() => router.push('/auth/login')} />

          {result?.status === 'booked' && (
            <div className="action-row">
              <button className="btn-secondary" onClick={fastForward} disabled={running}>
                <FastForward size={14} /> Fast-forward time (fire reminders)
              </button>
              <button className="btn-secondary" onClick={simulateCancel} disabled={running}>
                <UserX size={14} /> Simulate: provider cancels
              </button>
            </div>
          )}
        </div>

        <AgentBrain events={events} running={running} planner={events.find((e) => e.type === 'plan')?.output?.planner} />
      </div>
    </div>
  );
}

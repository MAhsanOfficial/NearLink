'use client';
import { Phone, MapPin, Star, Clock, Bell, CheckCircle2, LogIn, SearchX } from 'lucide-react';

const BREAKDOWN_LABELS = {
  distance: 'Distance', rating: 'Rating', availability: 'Availability fit', trust: 'Trust', price: 'Price',
};
const BREAKDOWN_MAX = { distance: 25, rating: 25, availability: 25, trust: 15, price: 10 };

function formatLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  return d.toLocaleString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Karachi' });
}

function ScoreBars({ breakdown }) {
  return (
    <div className="score-bars">
      {Object.entries(breakdown || {}).map(([k, v]) => (
        <div key={k} className="score-row" title={`${v} / ${BREAKDOWN_MAX[k]}`}>
          <span className="score-name">{BREAKDOWN_LABELS[k] || k}</span>
          <span className="score-track"><span className="score-fill" style={{ width: `${Math.min(100, (v / BREAKDOWN_MAX[k]) * 100)}%` }} /></span>
          <span className="score-val">{v}</span>
        </div>
      ))}
    </div>
  );
}

function Schedule({ title, slots }) {
  if (!slots?.length) return null;
  return (
    <div className="sched">
      <div className="sched-title">{title}</div>
      <div className="sched-grid">
        {slots.map((s) => (
          <span key={s.start_utc} className={`sched-cell ${s.status}`}>{s.time}</span>
        ))}
      </div>
    </div>
  );
}

export default function BookingResult({ result, onLogin }) {
  if (!result) return null;
  const { status, provider, options = [], schedule_before, schedule_after, notifications = [] } = result;

  if (status === 'no_match') {
    return (
      <div className="result-card result-warn">
        <SearchX size={22} /> <p>{result.reply_text}</p>
      </div>
    );
  }
  if (status === 'clarify') return null; // the question is shown by the page

  if (!provider) {
    return result.error ? <div className="result-card result-warn"><p>{result.reply_text}</p></div> : null;
  }

  const booked = status === 'booked';
  const alternatives = options.filter((o) => o.id !== provider.id);

  return (
    <div className="result-card">
      <div className="result-top">
        {booked ? <CheckCircle2 size={22} color="#22c55e" /> : <LogIn size={22} color="#fbbf24" />}
        <div>
          <div className="result-status">{booked ? 'Booking confirmed' : 'Best match found'}</div>
          <div className="result-when"><Clock size={13} /> {formatLocal(result.scheduled_at)}</div>
        </div>
        <div className="result-score">{provider.score}<small>/100</small></div>
      </div>

      <h3 className="result-name">{provider.name}</h3>
      <div className="result-meta">
        <span><Star size={13} /> {provider.rating ?? '-'} ({provider.total_reviews ?? 0})</span>
        {provider.distance_km != null && <span><MapPin size={13} /> {provider.distance_km} km</span>}
        {provider.phone && <a href={`tel:${provider.phone}`}><Phone size={13} /> {provider.phone}</a>}
        <span className="result-source">{provider.source_label || provider.source}</span>
      </div>
      {provider.reasoning && <p className="result-why">{provider.reasoning}</p>}
      <ScoreBars breakdown={provider.score_breakdown} />

      {!booked && (
        <button className="btn-primary result-login" onClick={onLogin}>
          <LogIn size={16} /> Sign in to confirm this booking
        </button>
      )}

      {booked && (
        <>
          <div className="sched-pair">
            <Schedule title="Provider schedule - before" slots={schedule_before} />
            <Schedule title="Provider schedule - after" slots={schedule_after} />
          </div>
          <div className="notif-list">
            <div className="sched-title"><Bell size={13} /> Follow-ups scheduled</div>
            {notifications.map((n) => (
              <div key={n.type} className="notif-item">
                <span className={`notif-state ${n.sent ? 'sent' : ''}`}>{n.sent ? 'sent' : formatLocal(n.scheduled_for.replace(' ', 'T'))}</span>
                <span>{n.message}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {alternatives.length > 0 && (
        <div className="alts">
          <div className="sched-title">Other options considered</div>
          {alternatives.map((o) => (
            <div key={o.id} className="alt-item">
              <strong>#{o.rank} {o.name}</strong>
              <span>{o.distance_km != null ? `${o.distance_km} km` : ''} · {o.rating ?? '-'}★ · score {o.score}</span>
              <span className="alt-why">{o.slot_label ? `free ${o.slot_label}` : 'no free slot in the window'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

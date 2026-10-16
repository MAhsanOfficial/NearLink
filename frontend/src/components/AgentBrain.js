'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Brain, Compass, Search, CalendarClock, Scale, CalendarCheck, BellRing, MessageCircleQuestion,
  GitBranch, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Cpu,
} from 'lucide-react';

// How each agent/tool is shown in the timeline
const STYLE = {
  plan: { icon: Brain, label: 'Plan', color: '#a78bfa' },
  parse_request: { icon: Compass, label: 'Understand request', color: '#38bdf8' },
  search_providers: { icon: Search, label: 'Discover providers', color: '#34d399' },
  check_availability: { icon: CalendarClock, label: 'Check availability', color: '#fbbf24' },
  rank_candidates: { icon: Scale, label: 'Rank & explain', color: '#f472b6' },
  book_slot: { icon: CalendarCheck, label: 'Book slot', color: '#22c55e' },
  schedule_followups: { icon: BellRing, label: 'Schedule follow-ups', color: '#fb923c' },
  ask_user: { icon: MessageCircleQuestion, label: 'Ask the user', color: '#38bdf8' },
  decision: { icon: GitBranch, label: 'Decision', color: '#c084fc' },
  fallback: { icon: AlertTriangle, label: 'Fallback', color: '#f87171' },
  final: { icon: CheckCircle2, label: 'Outcome', color: '#22c55e' },
  error: { icon: AlertTriangle, label: 'Error', color: '#ef4444' },
};

function styleFor(event) {
  if (event.type === 'decision') return STYLE.decision;
  if (event.type === 'fallback') return STYLE.fallback;
  if (event.type === 'clarification') return STYLE.ask_user;
  return STYLE[event.tool] || STYLE[event.type] || { icon: Cpu, label: event.tool || event.type, color: '#94a3b8' };
}

function Json({ value }) {
  if (value === null || value === undefined) return null;
  return <pre className="brain-json">{JSON.stringify(value, null, 2)}</pre>;
}

function Step({ event, isLast, running }) {
  const [open, setOpen] = useState(false);
  const { icon: Icon, label, color } = styleFor(event);
  const hasDetail = event.input || event.output;
  return (
    <li className="brain-step">
      <div className="brain-rail">
        <span className="brain-dot" style={{ background: color, boxShadow: `0 0 0 4px ${color}22` }}>
          <Icon size={13} color="#0b0b0b" />
        </span>
        {!isLast || running ? <span className="brain-line" /> : null}
      </div>
      <div className="brain-body">
        <div className="brain-head">
          <span className="brain-label" style={{ color }}>{label}</span>
          <span className="brain-agent">{event.agent}</span>
          {event.duration_ms > 0 && <span className="brain-ms">{event.duration_ms} ms</span>}
        </div>
        {event.reasoning && <p className="brain-reason">{event.reasoning}</p>}
        {hasDetail && (
          <button className="brain-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} input / output
          </button>
        )}
        {open && (
          <div className="brain-detail">
            {event.input && <><div className="brain-detail-title">Input</div><Json value={event.input} /></>}
            {event.output && <><div className="brain-detail-title">Output</div><Json value={event.output} /></>}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Live timeline of everything the agents did: plan, every tool call, every decision and fallback.
 * `events` is appended to as the server streams them.
 */
export default function AgentBrain({ events, running, planner }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [events.length]);

  return (
    <section className="brain-panel" aria-label="Agent decision trace">
      <header className="brain-title">
        <Brain size={18} />
        <span>Agent Brain</span>
        {planner && <span className="brain-chip">{planner === 'llm' ? 'Gemini plans' : 'Policy plans'}</span>}
        {running && <span className="brain-live"><span className="brain-live-dot" /> live</span>}
      </header>
      {events.length === 0 && !running ? (
        <p className="brain-empty">Send a request and watch the agents plan, call tools and decide - step by step.</p>
      ) : (
        <ol className="brain-list">
          {events.map((e, i) => (
            <Step key={e.seq ?? i} event={e} isLast={i === events.length - 1} running={running} />
          ))}
          {running && (
            <li className="brain-step">
              <div className="brain-rail"><span className="brain-dot brain-pulse" /></div>
              <div className="brain-body"><span className="brain-reason">thinking...</span></div>
            </li>
          )}
        </ol>
      )}
      <div ref={endRef} />
    </section>
  );
}

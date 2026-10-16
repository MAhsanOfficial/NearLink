const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('quickfix_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// Auth
export const authAPI = {
  signup: (data) => apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiFetch(`/api/auth/me?token=${getToken()}`),
};

// Requests
export const requestAPI = {
  parse: (raw_text) => apiFetch('/api/request/parse', { method: 'POST', body: JSON.stringify({ raw_text }) }),
  history: () => apiFetch('/api/request/history'),
};

// Providers
export const providerAPI = {
  search: (service_type, location) => apiFetch('/api/providers/search', { method: 'POST', body: JSON.stringify({ service_type, location }) }),
  rank: (service_type, location, request_id) => apiFetch(`/api/providers/rank?request_id=${request_id || ''}`, { method: 'POST', body: JSON.stringify({ service_type, location }) }),
  all: () => apiFetch('/api/providers/all'),
  wallet: () => apiFetch('/api/providers/my-wallet'),
  topup: (amount) => apiFetch('/api/providers/topup', { method: 'POST', body: JSON.stringify({ amount }) }),
};

// Bookings
export const bookingAPI = {
  create: (data) => apiFetch('/api/bookings/create', { method: 'POST', body: JSON.stringify(data) }),
  history: () => apiFetch('/api/bookings/history'),
  get: (id) => apiFetch(`/api/bookings/${id}`),
  updateStatus: (id, status, negotiated_amount = null) => 
    apiFetch(`/api/bookings/${id}/status`, { 
      method: 'PATCH', 
      body: JSON.stringify({ status, negotiated_amount }) 
    }),
  rate: (id, rating, review) => apiFetch(`/api/bookings/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating, review }) }),
  sos: (id) => apiFetch(`/api/bookings/${id}/sos`, { method: 'POST' }),
  cancel: (id) => apiFetch(`/api/bookings/${id}/cancel`, { method: 'POST' }),
  simulateProviderCancel: (id) => apiFetch(`/api/bookings/${id}/simulate-provider-cancel`, { method: 'POST' }),
  uploadWork: (id) => apiFetch(`/api/bookings/${id}/upload-work`, { method: 'POST' }),
};

// Chat
export const chatAPI = {
  history: (bookingId) => apiFetch(`/api/chat/${bookingId}`),
  send: (bookingId, content, type = 'text', offerAmount = null) => 
    apiFetch(`/api/chat/send/${bookingId}`, { 
      method: 'POST', 
      body: JSON.stringify({ content, message_type: type, offer_amount: offerAmount }) 
    }),
  acceptOffer: (messageId) => apiFetch(`/api/chat/offer/${messageId}/accept`, { method: 'POST' }),
};

// Follow-up
export const followupAPI = {
  notifications: () => apiFetch('/api/followup/notifications'),
  byBooking: (bookingId) => apiFetch(`/api/followup/booking/${bookingId}`),
  fastForward: (bookingId) => apiFetch(`/api/followup/fast-forward/${bookingId}`, { method: 'POST' }),
};

// Traces
export const traceAPI = {
  all: () => apiFetch('/api/agent-logs/'),
  byRequest: (requestId) => apiFetch(`/api/agent-logs/request/${requestId}`),
};

// Admin
export const adminAPI = {
  stats: () => apiFetch('/api/management/system-metrics'),
  sosAlarms: () => apiFetch('/api/management/emergency-reports'),
  resolveSos: (id) => apiFetch(`/api/management/resolve-emergency/${id}`, { method: 'POST' }),
};

// Agentic orchestrator (planner + tools). `stream` pushes each agent step to onStep as it happens (SSE over fetch,
// because EventSource cannot send the Authorization header).
export const orchestratorAPI = {
  run: (body) => apiFetch('/api/orchestrator/run', { method: 'POST', body: JSON.stringify(body) }),
  replay: (requestId) => apiFetch(`/api/orchestrator/runs/${requestId}`),
  async stream(body, { onStep, signal } = {}) {
    const res = await fetch(`${API_BASE}/api/orchestrator/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(typeof err.detail === 'string' ? err.detail : 'Request failed');
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result = null;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop();
      for (const frame of frames) {
        const name = (frame.match(/^event: (.+)$/m) || [])[1];
        const data = (frame.match(/^data: (.+)$/m) || [])[1];
        if (!name || !data) continue;
        const payload = JSON.parse(data);
        if (name === 'step') onStep && onStep(payload);
        else if (name === 'result') result = payload;
        else if (name === 'error') throw new Error(payload.detail || 'Agent run failed');
      }
    }
    if (!result) throw new Error('The agent stream ended without a result');
    return result;
  },
};

// WhatsApp channel simulator (text and/or a recorded voice note)
export const whatsappAPI = {
  async simulate({ phone, text, audioBlob }) {
    const form = new FormData();
    form.append('phone', phone);
    if (text) form.append('text', text);
    if (audioBlob) form.append('audio', audioBlob, 'voice-note.webm');
    const res = await fetch(`${API_BASE}/api/whatsapp/simulate`, { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(typeof err.detail === 'string' ? err.detail : 'Request failed');
    }
    return res.json();
  },
};

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
};

// Bookings
export const bookingAPI = {
  create: (data) => apiFetch('/api/bookings/create', { method: 'POST', body: JSON.stringify(data) }),
  history: () => apiFetch('/api/bookings/history'),
  get: (id) => apiFetch(`/api/bookings/${id}`),
  updateStatus: (id, status) => apiFetch(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  rate: (id, rating, review) => apiFetch(`/api/bookings/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating, review }) }),
};

// Follow-up
export const followupAPI = {
  notifications: () => apiFetch('/api/followup/notifications'),
  byBooking: (bookingId) => apiFetch(`/api/followup/booking/${bookingId}`),
};

// Traces
export const traceAPI = {
  all: () => apiFetch('/api/traces/'),
  byRequest: (requestId) => apiFetch(`/api/traces/request/${requestId}`),
};

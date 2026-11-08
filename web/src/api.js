export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const TOKEN_KEY = 'kelir_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, message, { code, fields } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields || [];
  }
  fieldError(name) {
    return this.fields.find((f) => f.field === name)?.message;
  }
}

/** Small fetch wrapper: adds the token, parses JSON, and turns error responses into ApiError. */
export async function request(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, signal, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'Server tidak bisa dihubungi. Periksa koneksi lalu coba lagi.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && data?.error?.code === 'SESSION_EXPIRED') {
      tokenStore.clear();
      window.dispatchEvent(new Event('kelir:session-expired'));
    }
    throw new ApiError(res.status, data?.error?.message || `Permintaan gagal (${res.status})`, data?.error || {});
  }
  return data;
}

export const qs = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== false) search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : '';
};

const enc = encodeURIComponent;

export const api = {
  // Auth and profile
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/api/auth/me'),
  updateMe: (payload) => request('/api/me', { method: 'PATCH', body: payload }),
  changePassword: (payload) => request('/api/me/password', { method: 'POST', body: payload }),
  myReviews: () => request('/api/me/reviews'),

  // Catalog
  home: () => request('/api/home'),
  contents: (params, opts) => request(`/api/contents${qs(params)}`, opts),
  filters: () => request('/api/contents/filters'),
  regions: () => request('/api/contents/regions'),
  content: (slug) => request(`/api/contents/${enc(slug)}`),
  related: (slug) => request(`/api/contents/${enc(slug)}/related`),
  reviews: (slug, page = 1) => request(`/api/contents/${enc(slug)}/reviews${qs({ page })}`),
  saveReview: (slug, payload) => request(`/api/contents/${enc(slug)}/reviews`, { method: 'POST', body: payload }),
  deleteReview: (slug) => request(`/api/contents/${enc(slug)}/reviews/me`, { method: 'DELETE' }),
  play: (slug, episode) => request(`/api/contents/${enc(slug)}/play${qs({ episode })}`),

  // Library, progress, collections
  library: () => request('/api/me/library'),
  setInList: (list, id, on) => request(`/api/me/library/${list}/${enc(id)}`, { method: on ? 'PUT' : 'DELETE' }),
  progress: () => request('/api/me/progress'),
  saveProgress: (id, payload) => request(`/api/me/progress/${enc(id)}`, { method: 'PUT', body: payload }),
  clearProgress: (id) => request(`/api/me/progress/${enc(id)}`, { method: 'DELETE' }),
  collections: () => request('/api/collections'),
  collection: (id) => request(`/api/collections/${enc(id)}`),
  createCollection: (payload) => request('/api/collections', { method: 'POST', body: payload }),
  updateCollection: (id, payload) => request(`/api/collections/${enc(id)}`, { method: 'PATCH', body: payload }),
  deleteCollection: (id) => request(`/api/collections/${enc(id)}`, { method: 'DELETE' }),
  setInCollection: (id, contentId, on) => request(`/api/collections/${enc(id)}/items/${enc(contentId)}`, { method: on ? 'PUT' : 'DELETE' }),

  // Subscription
  plans: () => request('/api/subscription/plans', { auth: false }),
  subscription: () => request('/api/subscription'),
  checkout: (plan) => request('/api/subscription/checkout', { method: 'POST', body: { plan, confirmSimulation: true } }),
  cancelSubscription: () => request('/api/subscription/cancel', { method: 'POST' }),

  // Admin
  admin: {
    stats: () => request('/api/admin/stats'),
    contents: (params) => request(`/api/admin/contents${qs(params)}`),
    content: (id) => request(`/api/admin/contents/${enc(id)}`),
    createContent: (payload) => request('/api/admin/contents', { method: 'POST', body: payload }),
    updateContent: (id, payload) => request(`/api/admin/contents/${enc(id)}`, { method: 'PATCH', body: payload }),
    deleteContent: (id) => request(`/api/admin/contents/${enc(id)}`, { method: 'DELETE' }),
    users: (params) => request(`/api/admin/users${qs(params)}`),
    updateUser: (id, payload) => request(`/api/admin/users/${enc(id)}`, { method: 'PATCH', body: payload }),
    updateSubscription: (id, payload) => request(`/api/admin/users/${enc(id)}/subscription`, { method: 'PATCH', body: payload }),
    payments: (params) => request(`/api/admin/payments${qs(params)}`),
    reviews: (params) => request(`/api/admin/reviews${qs(params)}`),
    moderate: (id, payload) => request(`/api/admin/reviews/${enc(id)}`, { method: 'PATCH', body: payload }),
    deleteReview: (id) => request(`/api/admin/reviews/${enc(id)}`, { method: 'DELETE' }),
  },
};

export const DEMO_ACCOUNTS = {
  premium: { email: 'demo@kelir.app', password: 'demo12345', label: 'Akun demo Premium' },
  free: { email: 'gratis@kelir.app', password: 'gratis12345', label: 'Akun demo Gratis' },
  admin: { email: 'admin@kelir.app', password: 'admin12345', label: 'Admin' },
};

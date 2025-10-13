// src/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

export const tokenStore = {
  get: () => localStorage.getItem('token'),
  set: (t) => localStorage.setItem('token', t),
  clear: () => localStorage.removeItem('token'),
};

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = tokenStore.get();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text || 'Respuesta inválida' }; }

  if (!res.ok) {
    const msg = data?.error || data?.message || `Error HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/api/auth/me'),
  forgotPassword: (email) =>
    request('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password, confirmPassword) =>
    request(`/api/auth/reset-password/${encodeURIComponent(token)}`, {
      method: 'POST',
      body: { password, confirmPassword },
    }),
};

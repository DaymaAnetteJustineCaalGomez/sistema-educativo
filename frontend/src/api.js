// Toma la URL base del backend desde .env
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')
const PREFIX = '/api/auth'

// Nombres alineados a tu backend (según auth.routes.js):
// - request-register-code
// - register
// - login
// - me
export const API = {
  sendCode: `${BASE}${PREFIX}/request-register-code`,
  register: `${BASE}${PREFIX}/register`,
  login:    `${BASE}${PREFIX}/login`,
  me:       `${BASE}${PREFIX}/me`,
  // Si luego agregas logout en el backend:
  // logout:   `${BASE}${PREFIX}/logout`
}

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts
  })
  let data = null
  try { data = await res.json() } catch {}
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Error ${res.status}`
    throw new Error(msg)
  }
  return data
}

export const api = {
  sendCode: (email, role) => fetchJSON(API.sendCode, { method: 'POST', body: JSON.stringify({ email, role }) }),
  register: (payload)     => fetchJSON(API.register, { method: 'POST', body: JSON.stringify(payload) }),
  login:    (email, password) => fetchJSON(API.login, { method: 'POST', body: JSON.stringify({ email, password }) }),
  me:       () => fetchJSON(API.me),
  // logout:   () => fetchJSON(API.logout, { method:'POST' }),
}

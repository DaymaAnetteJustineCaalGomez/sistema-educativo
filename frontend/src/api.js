// Toma la URL base del backend desde .env, y si no existe usa localhost:5002
let fallback = 'http://localhost:5002'
if (typeof window !== 'undefined' && window.location) {
  const { protocol, hostname, port } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const apiPort = port === '' || port === '5173' ? '5002' : port
    fallback = `${protocol}//${hostname}:${apiPort}`
  } else {
    fallback = `${protocol}//${hostname}${port ? `:${port}` : ''}`
  }
}

const envBase = (import.meta.env.VITE_API_BASE || '').trim()
const BASE = (envBase.length ? envBase : fallback).replace(/\/+$/, '')
const PREFIX = '/api/auth'

const TOKEN_KEY = 'sistema-educativo.token'

const tokenStore = {
  get() {
    if (typeof window === 'undefined') return null
    try { return window.localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set(token) {
    if (typeof window === 'undefined') return
    try {
      if (token) window.localStorage.setItem(TOKEN_KEY, token)
      else window.localStorage.removeItem(TOKEN_KEY)
    } catch {}
  },
  clear() { this.set(null) }
}

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
  const token = tokenStore.get()
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {})
    },
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
  forgotPassword: (email) => fetchJSON(`${BASE}${PREFIX}/forgot-password`, { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => fetchJSON(`${BASE}${PREFIX}/reset-password`, { method: 'POST', body: JSON.stringify({ token, password }) }),
  storeToken: tokenStore,
  // logout:   () => fetchJSON(API.logout, { method:'POST' }),
}

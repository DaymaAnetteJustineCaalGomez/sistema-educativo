// Toma la URL base del backend desde .env
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')
const PREFIX = '/api/auth'
const CNB_PREFIX = '/api/cnb'

const TOKEN_KEY = 'sistema-educativo-token'

const safeStorage = typeof window !== 'undefined' ? window.localStorage : null

export const getToken = () => {
  try { return safeStorage?.getItem(TOKEN_KEY) || null } catch { return null }
}

export const setToken = (token) => {
  try {
    if (!token) safeStorage?.removeItem(TOKEN_KEY)
    else safeStorage?.setItem(TOKEN_KEY, token)
  } catch {}
}

export const clearToken = () => setToken(null)

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
  const { body, headers, ...rest } = opts
  const finalHeaders = { ...(headers || {}) }

  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json'
  }

  const token = getToken()
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`

  const finalBody =
    body && !(body instanceof FormData) && typeof body !== 'string'
      ? JSON.stringify(body)
      : body

  const res = await fetch(url, {
    credentials: 'include',
    headers: finalHeaders,
    body: finalBody,
    ...rest
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
  sendCode: (email, role) => fetchJSON(API.sendCode, { method: 'POST', body: { email, role } }),
  register: (payload)     => fetchJSON(API.register, { method: 'POST', body: payload }),
  login:    (email, password) => fetchJSON(API.login, { method: 'POST', body: { email, password } }),
  me:       () => fetchJSON(API.me),
  cursosBasico: (grado = 1) => fetchJSON(`${BASE}${CNB_PREFIX}/basico/${grado}/cursos`),
  // logout:   () => fetchJSON(API.logout, { method:'POST' }),
}

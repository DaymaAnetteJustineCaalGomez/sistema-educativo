import React, { useEffect, useRef, useState } from 'react'
import { api, getToken, setToken, clearToken } from './api'
import { DashboardShell } from './dashboard'
import { normalizeUser } from './utils/user'

// Iconos del ojito (ojo / ojo con slash)
const ICONS = {
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18"/><path d="M10.58 10.58a3 3 0 104.24 4.24"/><path d="M9.88 4.37A9.76 9.76 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-4.9 5.94"/><path d="M6.1 6.1A18.5 18.5 0 001 12s4 8 11 8a10.6 10.6 0 003.54-.61"/>
    </svg>
  )
}

function Eye({ targetId }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const input = document.getElementById(targetId)
    if (!input) return
    input.type = on ? 'text' : 'password'
  }, [on, targetId])
  return (
    <button type="button" className="eye-btn" aria-label="Mostrar/Ocultar" onClick={() => setOn(v=>!v)}>
      {on ? ICONS.eye : ICONS.eyeOff}
    </button>
  )
}

const Toast = ({ show, msg }) => (
  <div className={`toast ${show ? 'show' : ''}`}>
    <div className="box"><span>{msg}</span></div>
  </div>
)

export default function AuthPage(){
  // Arranca en INICIAR SESIÓN
  const [tab, setTab] = useState('login')

  const [login, setLogin]   = useState({ email:'', password:'' })
  const [signup, setSignup] = useState({ name:'', role:'', email:'', p1:'', p2:'', code:'' })
  const [user, setUser] = useState(null)
  const [cooldown, setCooldown] = useState(0)
  const [loadingL, setLoadingL] = useState(false)
  const [loadingS, setLoadingS] = useState(false)
  const [toast, setToast] = useState({ show:false, msg:'' })
  const timerRef = useRef(null)

  // helpers para limpiar formularios
  const resetLogin  = () => setLogin({ email:'', password:'' })
  const resetSignup = () => setSignup({ name:'', role:'', email:'', p1:'', p2:'', code:'' })
  const goTab = (next) => { setTab(next); if (next==='login') resetLogin(); if (next==='signup') resetSignup() }

  const showToast = (msg, ms=3600) => {
    setToast({ show:true, msg })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(()=> setToast({ show:false, msg:'' }), ms)
  }

  const applyUserFromAuth = async (res, fallbackUser) => {
    if (res?.token) setToken(res.token)

    const direct = normalizeUser(res?.user || res)
    if (direct) {
      setUser(direct)
      return direct
    }

    try {
      const me = await api.me()
      const normalized = normalizeUser(me?.user || me)
      if (normalized) {
        setUser(normalized)
        return normalized
      }
    } catch {
      clearToken()
    }

    if (fallbackUser) {
      const normalizedFallback = normalizeUser(fallbackUser)
      if (normalizedFallback) {
        setUser(normalizedFallback)
        return normalizedFallback
      }
    }

    return null
  }

  // cooldown reenvío
  useEffect(()=>{
    if (cooldown<=0) return
    const t = setInterval(()=> setCooldown(c => c>1 ? c-1 : (clearInterval(t), 0)), 1000)
    return ()=> clearInterval(t)
  },[cooldown])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setUser(null)
      return
    }

    (async () => {
      try {
        const me = await api.me()
        const normalized = normalizeUser(me?.user || me)
        if (normalized) setUser(normalized)
        else {
          clearToken()
          setUser(null)
        }
      } catch {
        clearToken()
        setUser(null)
      }
    })()
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dashboard-mode', !!user)
    return () => document.body.classList.remove('dashboard-mode')
  }, [user])

  const sendCode = async () => {
    const { email, role } = signup
    if (!email || !role) return showToast('Primero escribe el correo y el rol.')
    if (role==='ESTUDIANTE') return showToast('El código es solo para Docente/Administrador.')
    try {
      await api.sendCode(email, role)   // → /api/auth/request-register-code
      showToast('Código enviado a tu correo.')
      setCooldown(30)
    } catch (e) { showToast(e.message || 'No se pudo enviar el código') }
  }

  const onSignup = async (e) => {
    e.preventDefault()
    if (signup.p1 !== signup.p2) return showToast('Las contraseñas no coinciden')

    const payload = { name: signup.name.trim(), email: signup.email.trim(), role: signup.role, password: signup.p1 }
    if (signup.role==='DOCENTE' || signup.role==='ADMIN') {
      if (!signup.code.trim()) return showToast('Ingresa el código de verificación')
      payload.code = signup.code.trim()
    }

    try {
      setLoadingS(true)
      const res = await api.register(payload)
      const fallbackUser = { name: payload.name, email: payload.email, role: payload.role }
      await applyUserFromAuth(res, fallbackUser)
      resetSignup()
    } catch (e) {
      showToast(e.message || 'No se pudo registrar')
    } finally {
      setLoadingS(false)
    }
  }

  const onLogin = async (e) => {
    e.preventDefault()
    if (!login.email.trim()) return showToast('Escribe tu correo electronico.')
    try {
      setLoadingL(true)
      const email = login.email.trim()
      const res = await api.login(email, login.password)
      const fallbackUser = { email, role: 'ESTUDIANTE' }
      await applyUserFromAuth(res, fallbackUser)
      resetLogin()
    } catch (e) {
      showToast(e.message || 'No se pudo iniciar sesión')
    } finally {
      setLoadingL(false)
    }
  }

  const onLogout = async () => {
    clearToken()
    setUser(null)
    goTab('login')
    resetLogin()
    resetSignup()
  }

  return (
    <div className="container">
      {!user ? (
        <div className="grid">
          {/* Formulario */}
          <section className="formcol">
            <div className="formwrap">
              <div className="switcher">
                <button className={`sw ${tab==='login'?'active':''}`}  onClick={()=>goTab('login')}>Iniciar sesión</button>
                <button className={`sw ${tab==='signup'?'active':''}`} onClick={()=>goTab('signup')}>Crear cuenta</button>
              </div>
              <div className="heads">
                {tab==='login' ? <h2>Iniciar sesión</h2> : <h2>Crear cuenta</h2>}
                <div className="sub">Te damos la bienvenida</div>
              </div>

              {tab==='login' ? (
                <form onSubmit={onLogin} autoComplete="on">
                  <div>
                    <label className="field" htmlFor="lemail">Correo electrónico</label>
                    <input className="input" id="lemail" type="email" placeholder="tucorreo@gmail.com" required
                      value={login.email} onChange={e=>setLogin(v=>({...v, email:e.target.value}))}/>
                  </div>
                  <div>
                    <label className="field" htmlFor="lpass">Contraseña</label>
                    <div className="input-wrap">
                      <input className="input" id="lpass" type="password" placeholder="••••••••" required
                        value={login.password} onChange={e=>setLogin(v=>({...v, password:e.target.value}))}/>
                      <div className="eye-btn"><Eye targetId="lpass" /></div>
                    </div>
                  </div>
                  <div className="actions">
                    <a className="link" href="#">¿Olvidaste tu contraseña?</a>
                    <button className="btn" type="submit" disabled={loadingL}>{loadingL?'Entrando...':'Entrar'}</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={onSignup} autoComplete="on">
                  <div className="row">
                    <div>
                      <label className="field" htmlFor="name">Nombre completo</label>
                      <input className="input" id="name" type="text" placeholder="Nombre y apellidos" required
                        value={signup.name} onChange={e=>setSignup(v=>({...v, name:e.target.value}))}/>
                    </div>
                    <div>
                      <label className="field" htmlFor="role">Rol</label>
                      <select className="input" id="role" required
                        value={signup.role} onChange={e=>setSignup(v=>({...v, role:e.target.value}))}>
                        <option value="" disabled>Selecciona tu rol</option>
                        <option value="ESTUDIANTE">Estudiante</option>
                        <option value="DOCENTE">Docente</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="field" htmlFor="email2">Correo electrónico</label>
                    <input className="input" id="email2" type="email" placeholder="tucorreo@gmail.com" required
                      value={signup.email} onChange={e=>setSignup(v=>({...v, email:e.target.value}))}/>
                  </div>

                  <div className="row">
                    <div>
                      <label className="field" htmlFor="p1">Contraseña</label>
                      <div className="input-wrap">
                        <input className="input" id="p1" type="password" placeholder="Mínimo 8 caracteres" required
                          value={signup.p1} onChange={e=>setSignup(v=>({...v, p1:e.target.value}))}/>
                        <div className="eye-btn"><Eye targetId="p1" /></div>
                      </div>
                    </div>
                    <div>
                      <label className="field" htmlFor="p2">Confirmar</label>
                      <div className="input-wrap">
                        <input className="input" id="p2" type="password" placeholder="Repite tu contraseña" required
                          value={signup.p2} onChange={e=>setSignup(v=>({...v, p2:e.target.value}))}/>
                        <div className="eye-btn"><Eye targetId="p2" /></div>
                      </div>
                    </div>
                  </div>

                  {(signup.role==='DOCENTE' || signup.role==='ADMIN') && (
                    <div id="code-block">
                      <label className="field" htmlFor="code">Código de verificación</label>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10 }}>
                        <input className="input" id="code" type="text" inputMode="numeric" placeholder="Ej. 482913"
                          value={signup.code} onChange={e=>setSignup(v=>({...v, code:e.target.value}))}/>
                        <button className="btn-secondary" type="button" onClick={sendCode} disabled={cooldown>0}>
                          {cooldown>0 ? `Reenviar (${cooldown}s)` : 'Enviar código'}
                        </button>
                      </div>
                      <div className="sub" style={{ marginTop:6 }}>
                        Para Docente/Administrador es obligatorio el código enviado a tu correo.
                      </div>
                    </div>
                  )}

                  <div className="actions">
                    {/* Volver AHORA con el MISMO color degradado */}
                    <button type="button" className="btn" onClick={()=>goTab('login')}>Volver</button>
                    <button className="btn" type="submit" disabled={loadingS}>{loadingS?'Registrando...':'Registrar'}</button>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Marca / Búho (desde /public/owl.png) */}
          <aside className="brandcol">
            <div className="brand">
              <img src="/owl.png" alt="Búho" />
              <h1>Bienvenido al Sistema Inteligente</h1>
              <p>de Recomendación de Contenidos Educativos</p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="app" id="app">
          <DashboardShell user={user} onLogout={onLogout} />
        </div>
      )}

      <Toast show={toast.show} msg={toast.msg} />
    </div>
  )
}



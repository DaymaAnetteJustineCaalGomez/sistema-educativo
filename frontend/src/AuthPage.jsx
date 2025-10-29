import React, { useEffect, useRef, useState } from 'react'
import { api } from './api'
import StudentDashboard from './dashboards/StudentDashboard'
import TeacherDashboard from './dashboards/TeacherDashboard'
import AdminDashboard from './dashboards/AdminDashboard'

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

const GRADE_LABELS = {
  1: '1ro. Básico',
  2: '2do. Básico',
  3: '3ro. Básico'
}

const parseGradeNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return [1, 2, 3].includes(value) ? value : null
  const match = String(value).match(/\d/)
  if (!match) return null
  const num = parseInt(match[0], 10)
  return [1, 2, 3].includes(num) ? num : null
}

const gradeLabelFromValue = (value) => {
  const num = parseGradeNumber(value)
  if (num) return GRADE_LABELS[num]
  if (typeof value === 'string' && value.trim()) return value
  return ''
}

const normalizeUser = (raw) => {
  if (!raw) return null
  const id = raw.id || raw._id || raw.uid || null
  const name = raw.nombre || raw.name || ''
  const email = raw.email || ''
  const role = String(raw.rol || raw.role || 'ESTUDIANTE').toUpperCase()
  const gradeNumber = parseGradeNumber(raw.grado ?? raw.grade ?? raw.gradeNumber)
  const grade = gradeLabelFromValue(raw.gradeLabel ?? raw.grade ?? raw.grado)
  return {
    id,
    name,
    nombre: name,
    email,
    role,
    rol: role,
    grade,
    gradeNumber,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export default function AuthPage(){
  // Arranca en INICIAR SESIÓN
  const [tab, setTab] = useState('login')

  const tokenStore = api.storeToken
  const [login, setLogin]   = useState({ email:'', password:'' })
  const [signup, setSignup] = useState({ name:'', role:'', grade:'', email:'', p1:'', p2:'', code:'' })
  const [user, setUser] = useState(null)

  const [cooldown, setCooldown] = useState(0)
  const [loadingL, setLoadingL] = useState(false)
  const [loadingS, setLoadingS] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [resetForm, setResetForm] = useState({ password:'', confirm:'' })
  const [resetLoading, setResetLoading] = useState(false)
  const [toast, setToast] = useState({ show:false, msg:'' })
  const timerRef = useRef(null)

  // helpers para limpiar formularios
  const resetLogin  = () => setLogin({ email:'', password:'' })
  const resetSignup = () => setSignup({ name:'', role:'', grade:'', email:'', p1:'', p2:'', code:'' })
  const clearForgot = () => { setForgotMode(false); setForgotEmail(''); setForgotLoading(false) }
  const clearResetToken = (removeQuery = false) => {
    setResetToken('')
    setResetForm({ password:'', confirm:'' })
    setResetLoading(false)
    if (removeQuery && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState({}, document.title, url.toString())
    }
  }
  const goTab = (next) => {
    setTab(next)
    if (next==='login') {
      resetLogin()
      clearForgot()
    }
    if (next==='signup') {
      resetSignup()
      clearForgot()
      clearResetToken(true)
    }
  }

  const showToast = (msg, ms=3600) => {
    setToast({ show:true, msg })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(()=> setToast({ show:false, msg:'' }), ms)
  }

  // cooldown reenvío
  useEffect(()=>{
    if (cooldown<=0) return
    const t = setInterval(()=> setCooldown(c => c>1 ? c-1 : (clearInterval(t), 0)), 1000)
    return ()=> clearInterval(t)
  },[cooldown])

  // AUTO /me — solo marcamos sesión si /me trae user o datos claros
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      if (token) {
        setTab('login')
        clearForgot()
        setResetToken(token)
      }
    }

    if (!tokenStore.get()) return
    ;(async () => {
      try {
        const me = await api.me()
        if (me?.user) setUser(normalizeUser(me.user))
      } catch {
        tokenStore.clear()
        setUser(null)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

    if (signup.role==='ESTUDIANTE' && !signup.grade) return showToast('Selecciona tu grado')

    const payload = { name: signup.name.trim(), email: signup.email.trim(), role: signup.role, password: signup.p1 }
    if (signup.role==='ESTUDIANTE') {
      const gradeNumber = parseGradeNumber(signup.grade)
      if (gradeNumber) payload.grado = gradeNumber
      payload.grade = signup.grade
    }
    if (signup.role==='DOCENTE' || signup.role==='ADMIN') {
      if (!signup.code.trim()) return showToast('Ingresa el código de verificación')
      payload.code = signup.code.trim()
    }

    try {
      setLoadingS(true)
      const res = await api.register(payload)
      if (res?.token) tokenStore.set(res.token)
      if (res?.user) {
        setUser(normalizeUser(res.user))
      } else {
        const me = await api.me().catch(()=>null)
        if (me?.user) setUser(normalizeUser(me.user))
        else setUser(normalizeUser({ ...payload, grade: payload.grade }))
      }
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
      const res = await api.login(login.email.trim(), login.password)
      if (res?.token) tokenStore.set(res.token)
      if (res?.user) setUser(normalizeUser(res.user))
      else {
        const me = await api.me().catch(()=>null)
        if (me?.user) setUser(normalizeUser(me.user))
        else setUser(normalizeUser({ email: login.email.trim(), role:'ESTUDIANTE', grade:'1ro. Básico' }))
      }
      resetLogin()
    } catch (e) {
      showToast(e.message || 'No se pudo iniciar sesión')
    } finally {
      setLoadingL(false)
    }
  }

  const onLogout = async () => {
    tokenStore.clear()
    setUser(null)
    goTab('login')
    resetLogin()
    resetSignup()
    clearResetToken(true)
  }

  const onForgot = async (e) => {
    e.preventDefault()
    const email = forgotEmail.trim()
    if (!email) return showToast('Ingresa tu correo electrónico')
    try {
      setForgotLoading(true)
      await api.forgotPassword(email)
      showToast('Te enviamos un enlace para restablecer tu contraseña.')
      setForgotMode(false)
      setForgotEmail('')
    } catch (err) {
      showToast(err.message || 'No pudimos enviar el correo de recuperación')
    } finally {
      setForgotLoading(false)
    }
  }

  const onReset = async (e) => {
    e.preventDefault()
    if (!resetToken) return showToast('El enlace de restablecimiento no es válido')
    if (!resetForm.password || resetForm.password.length < 8) return showToast('La nueva contraseña debe tener al menos 8 caracteres')
    if (resetForm.password !== resetForm.confirm) return showToast('Las contraseñas no coinciden')
    try {
      setResetLoading(true)
      await api.resetPassword(resetToken, resetForm.password)
      showToast('Contraseña actualizada. Inicia sesión con tu nueva contraseña.')
      clearResetToken(true)
      clearForgot()
    } catch (err) {
      showToast(err.message || 'No se pudo restablecer la contraseña')
    } finally {
      setResetLoading(false)
    }
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
                resetToken ? (
                  <form onSubmit={onReset} autoComplete="off">
                    <div>
                      <label className="field" htmlFor="newpass">Nueva contraseña</label>
                      <div className="input-wrap">
                        <input className="input" id="newpass" type="password" placeholder="Mínimo 8 caracteres" required
                          value={resetForm.password}
                          onChange={e=>setResetForm(v=>({...v, password:e.target.value}))}/>
                        <div className="eye-btn"><Eye targetId="newpass" /></div>
                      </div>
                    </div>
                    <div>
                      <label className="field" htmlFor="newpass2">Confirmar contraseña</label>
                      <div className="input-wrap">
                        <input className="input" id="newpass2" type="password" placeholder="Repite tu nueva contraseña" required
                          value={resetForm.confirm}
                          onChange={e=>setResetForm(v=>({...v, confirm:e.target.value}))}/>
                        <div className="eye-btn"><Eye targetId="newpass2" /></div>
                      </div>
                    </div>
                    <p className="muted" style={{ marginTop:10 }}>Introduce una nueva contraseña para reactivar tu cuenta.</p>
                    <div className="actions">
                      <button type="button" className="btn-secondary" onClick={()=>{ clearResetToken(true); clearForgot(); }}>Cancelar</button>
                      <button className="btn" type="submit" disabled={resetLoading}>{resetLoading?'Actualizando...':'Actualizar contraseña'}</button>
                    </div>
                  </form>
                ) : forgotMode ? (
                  <form onSubmit={onForgot} autoComplete="off">
                    <div>
                      <label className="field" htmlFor="forgotEmail">Correo electrónico</label>
                      <input className="input" id="forgotEmail" type="email" placeholder="tucorreo@gmail.com" required
                        value={forgotEmail}
                        onChange={e=>setForgotEmail(e.target.value)} />
                    </div>
                    <p className="muted" style={{ marginTop:10 }}>Te enviaremos un enlace para restablecer tu contraseña.</p>
                    <div className="actions">
                      <button type="button" className="btn-secondary" onClick={()=>{ setForgotMode(false); setForgotEmail(''); }}>Volver</button>
                      <button className="btn" type="submit" disabled={forgotLoading}>{forgotLoading?'Enviando...':'Enviar correo'}</button>
                    </div>
                  </form>
                ) : (
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
                      <button type="button" className="link" onClick={()=>{ setForgotMode(true); setForgotEmail(login.email.trim()); clearResetToken(true); }}>¿Olvidaste tu contraseña?</button>
                      <button className="btn" type="submit" disabled={loadingL}>{loadingL?'Entrando...':'Entrar'}</button>
                    </div>
                  </form>
                )
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
                        value={signup.role} onChange={e=>setSignup(v=>({...v, role:e.target.value, grade:'' }))}>
                      <option value="" disabled>Selecciona tu rol</option>
                      <option value="ESTUDIANTE">Estudiante</option>
                      <option value="DOCENTE">Docente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                </div>

                {signup.role==='ESTUDIANTE' && (
                  <div>
                    <label className="field" htmlFor="grade">Grado</label>
                    <select className="input" id="grade" required value={signup.grade} onChange={e=>setSignup(v=>({...v, grade:e.target.value}))}>
                      <option value="" disabled>Selecciona tu grado</option>
                      <option value="1ro. Básico">1ro. Básico</option>
                      <option value="2do. Básico">2do. Básico</option>
                      <option value="3ro. Básico">3ro. Básico</option>
                    </select>
                  </div>
                )}

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
        <div className="app" id="app" style={{ display:'block' }}>
          <div className="top">
            <div>
              <strong id="app-name">{user.name || user.email}</strong>
              <span className="badge" id="app-role">{user.role}</span>
            </div>
            <button className="btn-secondary" onClick={onLogout} type="button">Cerrar sesión</button>
          </div>
          {renderDashboard(user)}
        </div>
      )}

      <Toast show={toast.show} msg={toast.msg} />
    </div>
  )
}

function renderDashboard(user){
  const role = (user?.role || '').toUpperCase()
  if (role==='ESTUDIANTE') return <StudentDashboard user={user} />
  if (role==='DOCENTE')    return <TeacherDashboard user={user} />
  if (role==='ADMIN')      return <AdminDashboard user={user} />
  return <EmptyDashboard role={user?.role} />
}

function EmptyDashboard({ role }) {
  return (
    <div className="dashboard-shell empty">
      <h3>Panel no disponible</h3>
      <p>No hay un tablero configurado para el rol "{role || 'Sin rol'}".</p>
    </div>
  )
}

import React, { useEffect, useRef, useState } from 'react'
import { api } from './api'

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

const GRADE_OPTIONS = Object.values(GRADE_LABELS)

const STUDENT_DASHBOARD_DATA = {
  '1ro. Básico': {
    summary: [
      { title:'Promedio general', value:'83%', detail:'Subiste 5 puntos esta semana', accent:'violet', trend:'+5' },
      { title:'Progreso total', value:'76%', detail:'Contenido completado 19 de 25 unidades', accent:'indigo' },
      { title:'Tareas completadas', value:'12', detail:'3 actividades en seguimiento', accent:'pink' },
      { title:'Tiempo de uso', value:'5 h 42 m', detail:'Racha de 4 días seguidos', accent:'amber' }
    ],
    progress: [
      { title:'Matemáticas', value:78, completed:21, total:27 },
      { title:'Comunicación y Lenguaje', value:72, completed:18, total:25 },
      { title:'Ciencias Naturales', value:65, completed:15, total:23 }
    ],
    usage: {
      total:'5 h 42 m',
      streak:'4 días seguidos',
      sessions:[
        { label:'Lun', minutes:70 },
        { label:'Mar', minutes:55 },
        { label:'Mié', minutes:48 },
        { label:'Jue', minutes:62 },
        { label:'Vie', minutes:34 }
      ]
    },
    courses: [
      { title:'Matemáticas · Números decimales', status:'En curso', progress:78, tasksDone:6, tasksTotal:8, next:'Repaso de comparación de decimales' },
      { title:'Comunicación · Comprensión lectora', status:'En curso', progress:64, tasksDone:5, tasksTotal:9, next:'Historieta interactiva' },
      { title:'Ciencias · Energía y cambios', status:'Pendiente', progress:34, tasksDone:2, tasksTotal:6, next:'Video "La energía en casa"' }
    ],
    recommendations: [
      { title:'Refuerza las fracciones', detail:'Completa el módulo interactivo de fracciones equivalentes antes del viernes.' },
      { title:'Explora lectura guiada', detail:'Lee el cuento "El viaje de Kaqchikel" y responde las preguntas de reflexión.' }
    ],
    history: [
      { date:'12 mar', title:'Recomendación completada', detail:'"Experimento: circuitos básicos"', status:'Completada' },
      { date:'10 mar', title:'Nueva sugerencia', detail:'Práctica de comprensión lectora nivel 2', status:'Asignada' },
      { date:'08 mar', title:'Tarea enviada', detail:'Resolución de problemas con decimales', status:'Calificada 85%' }
    ],
    attempts: { used:1, limit:3 },
    notifications:true
  },
  '2do. Básico': {
    summary: [
      { title:'Promedio general', value:'79%', detail:'Sin cambios vs la semana anterior', accent:'violet' },
      { title:'Progreso total', value:'68%', detail:'17 de 25 unidades cubiertas', accent:'indigo' },
      { title:'Tareas completadas', value:'10', detail:'2 entregas pendientes', accent:'pink' },
      { title:'Tiempo de uso', value:'4 h 18 m', detail:'Racha de 3 días', accent:'amber' }
    ],
    progress: [
      { title:'Álgebra', value:71, completed:16, total:22 },
      { title:'Comunicación', value:63, completed:14, total:22 },
      { title:'Física', value:58, completed:12, total:21 }
    ],
    usage: {
      total:'4 h 18 m',
      streak:'3 días',
      sessions:[
        { label:'Lun', minutes:60 },
        { label:'Mar', minutes:42 },
        { label:'Mié', minutes:46 },
        { label:'Jue', minutes:38 },
        { label:'Vie', minutes:28 }
      ]
    },
    courses: [
      { title:'Álgebra · Sistemas de ecuaciones', status:'En curso', progress:71, tasksDone:7, tasksTotal:10, next:'Resolver problemas de mezcla' },
      { title:'Biología · Célula y genética', status:'En curso', progress:59, tasksDone:5, tasksTotal:9, next:'Mapa conceptual de ADN' },
      { title:'Historia · Revolución Industrial', status:'Completado', progress:100, tasksDone:8, tasksTotal:8, next:'Revisión general' }
    ],
    recommendations: [
      { title:'Practica sistemas de ecuaciones', detail:'Realiza el set de 6 ejercicios con guía paso a paso.' },
      { title:'Laboratorio virtual de ADN', detail:'Explora el laboratorio y registra tus hallazgos en el portafolio.' }
    ],
    history: [
      { date:'11 mar', title:'Seguimiento', detail:'Retroalimentación enviada para "Mapa conceptual de ADN"', status:'Retroalimentado' },
      { date:'09 mar', title:'Recomendación completada', detail:'"Ensayo corto sobre causas de la Revolución"', status:'Completada' }
    ],
    attempts: { used:2, limit:3 },
    notifications:true
  },
  '3ro. Básico': {
    summary: [
      { title:'Promedio general', value:'88%', detail:'Excelente desempeño global', accent:'violet', trend:'+2' },
      { title:'Progreso total', value:'82%', detail:'21 de 26 unidades completadas', accent:'indigo' },
      { title:'Tareas completadas', value:'15', detail:'0 tareas vencidas', accent:'pink' },
      { title:'Tiempo de uso', value:'6 h 05 m', detail:'Racha de 5 días', accent:'amber' }
    ],
    progress: [
      { title:'Matemática financiera', value:84, completed:20, total:24 },
      { title:'Comunicación avanzada', value:86, completed:22, total:25 },
      { title:'Física aplicada', value:79, completed:18, total:23 }
    ],
    usage: {
      total:'6 h 05 m',
      streak:'5 días',
      sessions:[
        { label:'Lun', minutes:75 },
        { label:'Mar', minutes:68 },
        { label:'Mié', minutes:66 },
        { label:'Jue', minutes:74 },
        { label:'Vie', minutes:53 }
      ]
    },
    courses: [
      { title:'Matemática · Probabilidad', status:'En curso', progress:84, tasksDone:9, tasksTotal:11, next:'Proyecto "Encuesta en mi comunidad"' },
      { title:'Lenguaje · Ensayos argumentativos', status:'En curso', progress:86, tasksDone:8, tasksTotal:10, next:'Revisión de borrador final' },
      { title:'Física · Cinemática', status:'Completado', progress:100, tasksDone:7, tasksTotal:7, next:'Evaluación general' }
    ],
    recommendations: [
      { title:'Ensayo argumentativo', detail:'Perfecciona la introducción usando la rúbrica de clase.' },
      { title:'Proyecto de probabilidad', detail:'Analiza los datos recolectados y carga tus conclusiones.' }
    ],
    history: [
      { date:'13 mar', title:'Nueva recomendación', detail:'"Video: Derivadas en la vida diaria"', status:'Asignada' },
      { date:'10 mar', title:'Intento registrado', detail:'Quiz de probabilidad · intento 2 de 3', status:'En progreso' }
    ],
    attempts: { used:1, limit:3 },
    notifications:true
  }
}

function StudentDashboard({ user }) {
  const defaultGrade = GRADE_OPTIONS.includes(user?.grade) ? user.grade : GRADE_OPTIONS[0]
  const [selectedGrade, setSelectedGrade] = useState(defaultGrade)
  const info = STUDENT_DASHBOARD_DATA[selectedGrade] || STUDENT_DASHBOARD_DATA[GRADE_OPTIONS[0]]
  const [notifications, setNotifications] = useState(info.notifications)

  useEffect(() => {
    setNotifications(info.notifications)
  }, [info])

  useEffect(() => {
    if (user?.grade && GRADE_OPTIONS.includes(user.grade)) {
      setSelectedGrade(user.grade)
    }
  }, [user?.grade])

  const maxMinutes = Math.max(...info.usage.sessions.map(s => s.minutes), 1)
  const attemptsLeft = info.attempts.limit - info.attempts.used

  return (
    <div className="dashboard">
      <aside className="dash-sidebar">
        <div className="dash-avatar">{(user?.name || user?.email || 'E')[0]?.toUpperCase()}</div>
        <div className="dash-side-section">
          <span className="side-label">Rol</span>
          <strong>Estudiante</strong>
          <span className="side-chip">{selectedGrade}</span>
        </div>
        <div className="dash-side-section">
          <span className="side-label">Intentos disponibles</span>
          <div className="attempts-meter" aria-label={`Intentos usados ${info.attempts.used} de ${info.attempts.limit}`}>
            <div className="attempts-fill" style={{ width: `${(info.attempts.used/info.attempts.limit)*100}%` }} />
          </div>
          <small>{attemptsLeft} de {info.attempts.limit} intentos restantes</small>
        </div>
        <div className="dash-side-section">
          <span className="side-label">Notificaciones</span>
          <label className="switch">
            <input type="checkbox" checked={notifications} onChange={()=>setNotifications(v=>!v)} />
            <span className="slider" />
          </label>
          <small>Recibir notificaciones por correo electrónico</small>
        </div>
      </aside>

      <main className="dash-content">
        <header className="dash-header">
          <div>
            <h2>Tu progreso general</h2>
            <p>Visualiza tu desempeño y sigue las recomendaciones del sistema.</p>
          </div>
          <div className="dash-header-actions">
            <label htmlFor="grade-select">Grado</label>
            <select id="grade-select" value={selectedGrade} onChange={e=>setSelectedGrade(e.target.value)}>
              {GRADE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        </header>

        <div className="dashboard-cards">
          {info.summary.map(card => (
            <SummaryCard key={card.title} {...card} />
          ))}
        </div>

        <section className="dashboard-section two-columns">
          <div className="section-card">
            <div className="section-header">
              <h3>Mapa de progreso CNB</h3>
              <span className="section-sub">Contenido completado por área</span>
            </div>
            <div className="progress-list">
              {info.progress.map(area => (
                <div key={area.title} className="progress-row">
                  <div>
                    <strong>{area.title}</strong>
                    <span className="muted">{area.completed} de {area.total} indicadores</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${area.value}%` }} />
                  </div>
                  <span className="progress-value">{area.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <div className="section-header">
              <h3>Tiempo de uso</h3>
              <span className="section-sub">Seguimiento de sesiones activas</span>
            </div>
            <div className="usage-summary">
              <div>
                <strong className="usage-total">{info.usage.total}</strong>
                <span className="muted">Total de esta semana</span>
              </div>
              <span className="pill">Racha: {info.usage.streak}</span>
            </div>
            <div className="usage-chart">
              {info.usage.sessions.map(session => (
                <div key={session.label} className="usage-bar">
                  <span>{session.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(session.minutes/maxMinutes)*100}%` }} />
                  </div>
                  <span className="muted">{session.minutes} min</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-section two-columns">
          <div className="section-card">
            <div className="section-header">
              <h3>Tablero de cursos</h3>
              <span className="section-sub">Sigue cada módulo y sus tareas</span>
            </div>
            <div className="course-grid">
              {info.courses.map(course => (
                <CourseCard key={course.title} {...course} />
              ))}
            </div>
          </div>

          <div className="section-card">
            <div className="section-header">
              <h3>Recomendaciones para ti</h3>
              <span className="section-sub">Acciones sugeridas por el sistema</span>
            </div>
            <ul className="recommendation-list">
              {info.recommendations.map(item => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-card">
            <div className="section-header">
              <h3>Historial de recomendaciones</h3>
              <span className="section-sub">Consulta lo que has recibido y completado</span>
            </div>
            <Timeline items={info.history} />
          </div>
        </section>
      </main>
    </div>
  )
}

const TEACHER_DASHBOARD_DATA = {
  summary: [
    { title:'Promedio general', value:'81%', detail:'+3 pts vs semana pasada', accent:'violet', trend:'+3' },
    { title:'Cobertura CNB', value:'92%', detail:'22 de 24 indicadores cubiertos', accent:'cyan' },
    { title:'Progreso promedio', value:'78%', detail:'Seguimiento en 6 cursos activos', accent:'indigo' },
    { title:'Abandono', value:'8%', detail:'Bajó 2 pts respecto al mes pasado', accent:'amber' }
  ],
  sideSummary: [
    { label:'Estudiantes activos', value:'126' },
    { label:'Reportes pendientes', value:'3' },
    { label:'Mensajes sin leer', value:'5' }
  ],
  weakTopics: ['Fracciones equivalentes', 'Comprensión lectora inferencial', 'Cambios de energía'],
  students: [
    { name:'Ana López', grade:'1ro. Básico', promedio:'85%', progreso:'82%', completados:18, abandono:'0%', frecuencia:'4 sesiones/sem' },
    { name:'Luis Pérez', grade:'2do. Básico', promedio:'77%', progreso:'71%', completados:14, abandono:'5%', frecuencia:'3 sesiones/sem' },
    { name:'María Hernández', grade:'3ro. Básico', promedio:'88%', progreso:'85%', completados:21, abandono:'0%', frecuencia:'5 sesiones/sem' },
    { name:'Diego García', grade:'2do. Básico', promedio:'70%', progreso:'64%', completados:11, abandono:'12%', frecuencia:'2 sesiones/sem' }
  ],
  studentHistory: [
    { date:'13 mar', title:'Intento agotado', detail:'Diego G. completó el intento 3/3 en Álgebra', status:'Alerta' },
    { date:'12 mar', title:'Recomendación aplicada', detail:'Ana L. reforzó Comprensión lectora nivel 2', status:'Completada' },
    { date:'10 mar', title:'Seguimiento de abandono', detail:'Se contactó a Luis P. por baja frecuencia', status:'Seguimiento' }
  ],
  recommendationHistory: [
    { date:'11 mar', title:'Nueva recomendación', detail:'"Proyecto colaborativo de energía" asignado a 1ro. Básico', status:'Enviado' },
    { date:'09 mar', title:'Recordatorio automático', detail:'Lectura guiada para 3ro. Básico', status:'Programado' }
  ],
  usage: {
    total:'18 h 20 m',
    frequency:'4.2 sesiones promedio',
    insight:'La mayor actividad ocurre martes y jueves.',
    sessions:[
      { label:'Lun', minutes:145 },
      { label:'Mar', minutes:205 },
      { label:'Mié', minutes:168 },
      { label:'Jue', minutes:214 },
      { label:'Vie', minutes:136 }
    ]
  }
}

function TeacherDashboard({ user }) {
  const maxMinutes = Math.max(...TEACHER_DASHBOARD_DATA.usage.sessions.map(s => s.minutes), 1)
  return (
    <div className="dashboard">
      <aside className="dash-sidebar">
        <div className="dash-avatar teacher">{(user?.name || user?.email || 'D')[0]?.toUpperCase()}</div>
        <div className="dash-side-section">
          <span className="side-label">Resumen rápido</span>
          <ul className="side-list">
            {TEACHER_DASHBOARD_DATA.sideSummary.map(item => (
              <li key={item.label}><strong>{item.value}</strong><span>{item.label}</span></li>
            ))}
          </ul>
        </div>
        <div className="dash-side-section">
          <span className="side-label">Focos débiles</span>
          <div className="pill-stack">
            {TEACHER_DASHBOARD_DATA.weakTopics.map(topic => <span key={topic} className="pill">{topic}</span>)}
          </div>
        </div>
      </aside>

      <main className="dash-content">
        <header className="dash-header">
          <div>
            <h2>Panel docente</h2>
            <p>Consulta el desempeño general y acompaña a tus estudiantes.</p>
          </div>
        </header>

        <div className="dashboard-cards">
          {TEACHER_DASHBOARD_DATA.summary.map(card => <SummaryCard key={card.title} {...card} />)}
        </div>

        <section className="dashboard-section two-columns">
          <div className="section-card">
            <div className="section-header">
              <h3>Informe estudiantil</h3>
              <span className="section-sub">Promedios, progreso y cobertura</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Grado</th>
                    <th>Promedio</th>
                    <th>Progreso</th>
                    <th>Completados</th>
                    <th>Abandono</th>
                    <th>Frecuencia</th>
                  </tr>
                </thead>
                <tbody>
                  {TEACHER_DASHBOARD_DATA.students.map(student => (
                    <tr key={student.name}>
                      <td>{student.name}</td>
                      <td>{student.grade}</td>
                      <td>{student.promedio}</td>
                      <td>{student.progreso}</td>
                      <td>{student.completados}</td>
                      <td>{student.abandono}</td>
                      <td>{student.frecuencia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="section-card">
            <div className="section-header">
              <h3>Frecuencia de uso</h3>
              <span className="section-sub">Tiempo promedio por día</span>
            </div>
            <div className="usage-summary">
              <div>
                <strong className="usage-total">{TEACHER_DASHBOARD_DATA.usage.total}</strong>
                <span className="muted">Tiempo acompañando a tus grupos</span>
              </div>
              <span className="pill">{TEACHER_DASHBOARD_DATA.usage.frequency}</span>
            </div>
            <p className="muted">{TEACHER_DASHBOARD_DATA.usage.insight}</p>
            <div className="usage-chart">
              {TEACHER_DASHBOARD_DATA.usage.sessions.map(session => (
                <div key={session.label} className="usage-bar">
                  <span>{session.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(session.minutes/maxMinutes)*100}%` }} />
                  </div>
                  <span className="muted">{session.minutes} min</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-section two-columns">
          <div className="section-card">
            <div className="section-header">
              <h3>Historial de estudiantes</h3>
              <span className="section-sub">Eventos recientes por alumno</span>
            </div>
            <Timeline items={TEACHER_DASHBOARD_DATA.studentHistory} />
          </div>

          <div className="section-card">
            <div className="section-header">
              <h3>Historial de recomendaciones</h3>
              <span className="section-sub">Acciones enviadas por el docente</span>
            </div>
            <Timeline items={TEACHER_DASHBOARD_DATA.recommendationHistory} />
          </div>
        </section>
      </main>
    </div>
  )
}

const ADMIN_DASHBOARD_DATA = {
  summary: [
    { title:'Usuarios totales', value:'284', detail:'+12 este mes', accent:'violet', trend:'+12' },
    { title:'Progreso promedio', value:'74%', detail:'Promedio entre todos los grados', accent:'indigo' },
    { title:'Intentos registrados', value:'58 / 90', detail:'Intentos usados esta semana', accent:'pink' },
    { title:'Tiempo total', value:'412 h', detail:'Uso acumulado mensual', accent:'cyan' }
  ],
  management: [
    { label:'Gestionar usuarios', detail:'Crear, editar o suspender cuentas' },
    { label:'Catálogo de recursos', detail:'Actualizar contenidos y materiales' },
    { label:'Roles y permisos', detail:'Asignar accesos a cada equipo' }
  ],
  roles: [
    { label:'Administradores', value:4 },
    { label:'Docentes', value:32 },
    { label:'Estudiantes', value:248 }
  ],
  globalMetrics: [
    { label:'Tareas completadas', value:'1 248' },
    { label:'Recomendaciones activas', value:'86' },
    { label:'Tiempo promedio de sesión', value:'36 min' },
    { label:'Intentos promedio por estudiante', value:'1.7' }
  ],
  histories: {
    recommendations: [
      { date:'13 mar', title:'Campaña de repaso', detail:'Se enviaron 24 recomendaciones automáticas para Matemáticas 1ro. Básico', status:'Masivo' },
      { date:'11 mar', title:'Sugerencia destacada', detail:'Nuevo video de Ciencias agregado a destacados', status:'Destacado' }
    ],
    changes: [
      { date:'12 mar', title:'Rol actualizado', detail:'Se promovió a Laura X. a Docente responsable', status:'Roles' },
      { date:'09 mar', title:'Catálogo editado', detail:'Se agregaron 8 recursos al módulo de comunicación', status:'Catálogo' }
    ]
  },
  usage: {
    total:'412 h',
    frequency:'5.6 sesiones promedio',
    sessions:[
      { label:'Lun', minutes:480 },
      { label:'Mar', minutes:520 },
      { label:'Mié', minutes:498 },
      { label:'Jue', minutes:544 },
      { label:'Vie', minutes:460 }
    ]
  }
}

function AdminDashboard({ user }) {
  const maxMinutes = Math.max(...ADMIN_DASHBOARD_DATA.usage.sessions.map(s => s.minutes), 1)
  return (
    <div className="dashboard">
      <aside className="dash-sidebar">
        <div className="dash-avatar admin">{(user?.name || user?.email || 'A')[0]?.toUpperCase()}</div>
        <div className="dash-side-section">
          <span className="side-label">Gestiones rápidas</span>
          <div className="side-actions">
            {ADMIN_DASHBOARD_DATA.management.map(item => (
              <button key={item.label} className="ghost-btn" type="button">
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="dash-side-section">
          <span className="side-label">Roles activos</span>
          <ul className="side-list">
            {ADMIN_DASHBOARD_DATA.roles.map(role => (
              <li key={role.label}><strong>{role.value}</strong><span>{role.label}</span></li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="dash-content">
        <header className="dash-header">
          <div>
            <h2>Panel administrativo global</h2>
            <p>Controla usuarios, contenidos y visualiza los indicadores generales.</p>
          </div>
        </header>

        <div className="dashboard-cards">
          {ADMIN_DASHBOARD_DATA.summary.map(card => <SummaryCard key={card.title} {...card} />)}
        </div>

        <section className="dashboard-section two-columns">
          <div className="section-card">
            <div className="section-header">
              <h3>Visión general</h3>
              <span className="section-sub">Indicadores principales del sistema</span>
            </div>
            <div className="stats-grid">
              {ADMIN_DASHBOARD_DATA.globalMetrics.map(metric => (
                <div key={metric.label} className="stat-item">
                  <strong>{metric.value}</strong>
                  <span className="muted">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <div className="section-header">
              <h3>Uso de la plataforma</h3>
              <span className="section-sub">Tiempo acumulado por día</span>
            </div>
            <div className="usage-summary">
              <div>
                <strong className="usage-total">{ADMIN_DASHBOARD_DATA.usage.total}</strong>
                <span className="muted">Tiempo total en el último mes</span>
              </div>
              <span className="pill">{ADMIN_DASHBOARD_DATA.usage.frequency} por usuario</span>
            </div>
            <div className="usage-chart">
              {ADMIN_DASHBOARD_DATA.usage.sessions.map(session => (
                <div key={session.label} className="usage-bar">
                  <span>{session.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(session.minutes/maxMinutes)*100}%` }} />
                  </div>
                  <span className="muted">{Math.round(session.minutes/60)} h</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-section two-columns">
          <div className="section-card">
            <div className="section-header">
              <h3>Historial de recomendaciones</h3>
              <span className="section-sub">Resumen global de envíos</span>
            </div>
            <Timeline items={ADMIN_DASHBOARD_DATA.histories.recommendations} />
          </div>

          <div className="section-card">
            <div className="section-header">
              <h3>Historial de cambios</h3>
              <span className="section-sub">Movimientos en roles y catálogo</span>
            </div>
            <Timeline items={ADMIN_DASHBOARD_DATA.histories.changes} />
          </div>
        </section>
      </main>
    </div>
  )
}

function SummaryCard({ title, value, detail, accent, trend }) {
  return (
    <div className={`summary-card ${accent || ''}`}>
      <span className="summary-label">{title}</span>
      <div className="summary-value">{value}</div>
      {trend && <span className="trend">{trend}</span>}
      {detail && <p className="muted">{detail}</p>}
    </div>
  )
}

function CourseCard({ title, status, progress, tasksDone, tasksTotal, next }) {
  return (
    <div className="course-card">
      <div className="course-head">
        <strong>{title}</strong>
        <span className="pill small">{status}</span>
      </div>
      <div className="progress-track compact">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="course-meta">
        <span>{progress}% completado</span>
        <span>{tasksDone}/{tasksTotal} tareas</span>
      </div>
      <p className="muted">Siguiente paso: {next}</p>
    </div>
  )
}

function Timeline({ items }) {
  if (!items || !items.length) {
    return <p className="muted">Sin registros recientes.</p>
  }
  return (
    <ul className="timeline">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`}>
          <span className="timeline-date">{item.date}</span>
          <div className="timeline-content">
            <strong>{item.title}</strong>
            {item.detail && <p>{item.detail}</p>}
            {item.status && <span className="pill small">{item.status}</span>}
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyDashboard({ role }) {
  return (
    <div className="empty-dashboard">
      <h3>Panel en construcción</h3>
      <p>Aún no tenemos un tablero configurado para el rol "{role || 'Sin rol'}".</p>
      <p className="muted">Inicia sesión con un rol de Estudiante, Docente o Administrador para ver un ejemplo completo.</p>
    </div>
  )
}



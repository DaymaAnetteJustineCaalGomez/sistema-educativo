import React, { useCallback, useEffect, useRef, useState } from 'react'
import { api, getToken, setToken, clearToken } from './api'

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

const GRADE_LABELS = {
  1: '1° Básico',
  2: '2° Básico',
  3: '3° Básico'
}

const parseGrado = (value) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  if ([1, 2, 3].includes(num)) return num
  const match = String(value).match(/([123])/)
  return match ? Number(match[1]) : null
}

const normalizeUser = (raw) => {
  if (!raw) return null
  const grado = parseGrado(raw.grado ?? raw.grade)
  const name = (raw.nombre || raw.name || '').trim()
  const role = String(raw.rol || raw.role || 'ESTUDIANTE').toUpperCase()
  return {
    id: raw.id || raw._id || raw.uid || null,
    name,
    nombre: name,
    email: raw.email || '',
    role,
    rol: role,
    grado
  }
}

const getGradeLabel = (grado) => GRADE_LABELS[grado] || 'CNB Básico'

const getFirstName = (user) => {
  const base = (user?.name || user?.nombre || user?.email || '').trim()
  if (!base) return 'Estudiante'
  const parts = base.split(/\s+/)
  return parts[0] || base
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

function Dashboard({ user, courses, loading, error, onRefresh, onLogout }) {
  const grado = parseGrado(user?.grado) || 1
  const gradeLabel = getGradeLabel(grado)
  const firstName = getFirstName(user)
  const courseList = Array.isArray(courses) ? courses : []
  const hasCourses = courseList.length > 0

  return (
    <div className="dashboard">
      <div className="dashboard__top">
        <div>
          <span className="dashboard__brand">Sistema Educativo</span>
          <span className="dashboard__grade">{gradeLabel}</span>
        </div>
        <div className="dashboard__user">
          <div className="dashboard__user-info">
            <strong>{user?.name || user?.email}</strong>
            <span className="badge">{user?.role}</span>
          </div>
          <button className="btn-secondary" onClick={onLogout} type="button">Cerrar sesión</button>
        </div>
      </div>

      <section className="dashboard__hero">
        <div>
          <p className="dashboard__eyebrow">Mis cursos CNB · {gradeLabel}</p>
          <h1>¡Hola, {firstName}!</h1>
          <p>Explora las áreas del Currículo Nacional Base y sigue tu progreso.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={() => onRefresh(grado)} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </section>

      <section className="dashboard__recommendation">
        <div className="dashboard__card">
          <span className="dashboard__pill">Recomendado para ti</span>
          <h2>{gradeLabel}</h2>
          <p>Aún no hay recomendaciones. Completa algunos subtemas para generarlas.</p>
        </div>
      </section>

      <section className="dashboard__courses">
        <div className="dashboard__section-header">
          <div>
            <h2>Cursos del CNB</h2>
            <p className="dashboard__section-subtitle">{hasCourses ? `${courseList.length} áreas disponibles` : 'Sin cursos disponibles'}</p>
          </div>
          <button className="dashboard__see-all" type="button" onClick={() => onRefresh(grado)} disabled={loading}>
            Ver todo
          </button>
        </div>

        {loading ? (
          <div className="dashboard__status">Cargando cursos...</div>
        ) : error ? (
          <div className="dashboard__status dashboard__status--error">{error}</div>
        ) : hasCourses ? (
          <div className="course-grid">
            {courseList.map((course) => {
              const competencias = course?.competenciasCount ?? 0
              const recursos = course?.recursosCount ?? 0
              const progreso = Math.round(course?.progreso ?? 0)
              const title = course?.titulo || course?.area || 'Área sin nombre'

              return (
                <article className="course-card" key={course?._id || title}>
                  <div className="course-card__meta">
                    <span>{competencias} competencias</span>
                    <span className="course-card__dot">•</span>
                    <span>{recursos} recursos</span>
                  </div>
                  <h3>{title}</h3>
                  <p className="course-card__progress">Progreso general: {progreso}%</p>
                  <button className="course-card__link" type="button">Ver contenidos</button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="dashboard__status">No encontramos cursos para este grado.</div>
        )}
      </section>
    </div>
  )
}

export default function AuthPage(){
  // Arranca en INICIAR SESIÓN
  const [tab, setTab] = useState('login')

  const [login, setLogin]   = useState({ email:'', password:'' })
  const [signup, setSignup] = useState({ name:'', role:'', email:'', p1:'', p2:'', code:'' })
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState('')

  const userGrade = parseGrado(user?.grado) || 1

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

  const loadCourses = useCallback(async (gradoValue) => {
    const target = parseGrado(gradoValue) || userGrade || 1
    setCoursesLoading(true)
    setCoursesError('')
    try {
      const data = await api.cursosBasico(target)
      setCourses(Array.isArray(data) ? data : [])
    } catch (err) {
      setCourses([])
      setCoursesError(err.message || 'No se pudieron cargar los cursos.')
    } finally {
      setCoursesLoading(false)
    }
  }, [userGrade])

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

  useEffect(() => {
    if (!user) {
      setCourses([])
      setCoursesError('')
      return
    }
    loadCourses(userGrade)
  }, [user, userGrade, loadCourses])

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
    setCourses([])
    setCoursesError('')
    setCoursesLoading(false)
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
          <Dashboard
            user={user}
            courses={courses}
            loading={coursesLoading}
            error={coursesError}
            onRefresh={loadCourses}
            onLogout={onLogout}
          />
        </div>
      )}

      <Toast show={toast.show} msg={toast.msg} />
    </div>
  )
}



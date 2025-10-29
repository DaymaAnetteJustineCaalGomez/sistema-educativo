import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout, { SectionCard, StatCard, EmptyState } from './DashboardLayout'
import { api } from '../api'
import {
  formatDuration,
  formatPercent,
  formatNumber,
  formatShortDate,
  weekdayLabel,
  formatAttempts,
} from './utils'

function UsageSpark({ usage }) {
  const sessions = Array.isArray(usage?.sessions) ? usage.sessions : []
  if (!sessions.length) {
    return (
      <div className="usage-empty">
        <span className="muted">Sin sesiones registradas.</span>
      </div>
    )
  }
  const maxSeconds = Math.max(...sessions.map((s) => Number(s.seconds) || 0), 1)
  return (
    <div className="usage-spark">
      {sessions.map((session) => (
        <div key={session.date} className="usage-spark-row">
          <span className="usage-day">{weekdayLabel(session.date)}</span>
          <div className="usage-meter">
            <div
              className="usage-meter-fill"
              style={{ width: `${Math.min(100, (session.seconds / maxSeconds) * 100)}%` }}
            />
          </div>
          <span className="usage-time">{formatDuration(session.seconds)}</span>
        </div>
      ))}
    </div>
  )
}

function RecommendationList({ items }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin recomendaciones activas"
        description="Cuando registres más intentos generaremos sugerencias de refuerzo y repaso."
      />
    )
  }
  return (
    <div className="recommendation-grid">
      {items.map((item) => (
        <article key={item.indicadorId || item._id} className="recommendation-card">
          <header>
            <div>
              <span className="pill neutral">{item.motivo === 'repaso' ? 'Repaso' : 'Refuerzo'}</span>
              <strong>{item.indicador?.codigo || 'Indicador recomendado'}</strong>
            </div>
            <span className="muted">{item.indicador?.areaId ? 'Área CNB' : 'Sistema'}</span>
          </header>
          {item.indicador?.descripcion ? <p>{item.indicador.descripcion}</p> : null}
          {item.recursos?.length ? (
            <ul className="resource-list">
              {item.recursos.map((resource) => (
                <li key={resource._id}>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <strong>{resource.titulo}</strong>
                    <span>{resource.tipo}{resource.proveedor ? ` · ${resource.proveedor}` : ''}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <span className="muted">Sin recursos asociados.</span>
          )}
        </article>
      ))}
    </div>
  )
}

function NotificationFeed({ items }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin notificaciones recientes"
        description="Te avisaremos aquí cuando existan recordatorios o mensajes importantes."
      />
    )
  }
  return (
    <ul className="notification-feed">
      {items.map((item) => {
        const type = (item.tipo || 'Notificación').replace(/_/g, ' ')
        return (
          <li key={item._id} className={item.leida ? '' : 'is-unread'}>
            <div className="feed-meta">
              <span className={`pill ${item.tipo === 'repaso' ? 'info' : 'accent'}`}>{type}</span>
              <span className="muted">{formatShortDate(item.fecha || item.createdAt)}</span>
            </div>
            <p>{item.mensaje}</p>
          </li>
        )
      })}
    </ul>
  )
}

function HistoryTimeline({ items }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin actividad registrada"
        description="Cuando completes ejercicios o recursos, verás tu historial de intentos aquí."
      />
    )
  }
  return (
    <ul className="timeline">
      {items.map((item) => (
        <li key={item.id}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-header">
              <strong>{item.indicador?.codigo || 'Indicador'}</strong>
              <span className="muted">{formatShortDate(item.fecha)}</span>
            </div>
            <p>{item.indicador?.descripcion || 'Actividad registrada'}</p>
            <div className="timeline-tags">
              {item.estado ? (
                <span
                  className={`badge ${
                    item.estado === 'completado'
                      ? 'success'
                      : item.estado === 'en_progreso'
                      ? 'warning'
                      : 'muted'
                  }`}
                >
                  {item.estado.replace('_', ' ')}
                </span>
              ) : null}
              {typeof item.puntuacion === 'number' ? (
                <span className="badge info">{item.puntuacion} pts</span>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function CourseGrid({ courses, onSelect }) {
  if (!courses.length) {
    return (
      <EmptyState
        title="Sin áreas asignadas"
        description="Cuando tu grado tenga áreas del CNB configuradas aparecerán en esta sección."
      />
    )
  }
  return (
    <div className="course-grid">
      {courses.map((course) => (
        <button key={course.areaId || course.titulo} type="button" className="course-card" onClick={() => onSelect(course)}>
          <div className="course-card-header">
            <strong>{course.titulo}</strong>
            <span className="pill info">{formatPercent(course.progreso)}</span>
          </div>
          <div className="course-card-body">
            <span>{course.completados} de {course.totalIndicadores} indicadores</span>
            {typeof course.promedio === 'number' ? <span className="muted">Promedio {course.promedio} pts</span> : null}
          </div>
          {course.siguiente ? (
            <div className="course-card-footer">
              <span className="muted">Próximo indicador</span>
              <strong>{course.siguiente.codigo || course.siguiente.descripcion}</strong>
            </div>
          ) : (
            <div className="course-card-footer">
              <span className="muted">Estás al día en esta área</span>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

function CourseDetailModal({ course, detail, loading, error, onClose }) {
  if (!course) return null
  const resumen = detail?.resumen || {
    totalIndicadores: 0,
    completados: 0,
    progreso: 0,
    promedio: null,
  }
  const competencias = Array.isArray(detail?.competencias) ? detail.competencias : []
  return (
    <div className="course-modal" role="dialog" aria-modal="true">
      <div className="course-modal__overlay" onClick={onClose} />
      <div className="course-modal__panel">
        <header className="course-modal__header">
          <div>
            <h3>{course.titulo}</h3>
            {detail?.grade?.label ? <span className="muted">{detail.grade.label}</span> : null}
          </div>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <div className="course-modal__body">
          {loading ? (
            <p>Cargando contenidos...</p>
          ) : error ? (
            <EmptyState title="No se pudo cargar el área" description={error} />
          ) : competencias.length ? (
            <>
              <div className="course-summary">
                <div>
                  <span className="card-label">Indicadores</span>
                  <strong>{resumen.totalIndicadores}</strong>
                </div>
                <div>
                  <span className="card-label">Completados</span>
                  <strong>{resumen.completados}</strong>
                </div>
                <div>
                  <span className="card-label">Progreso</span>
                  <strong>{formatPercent(resumen.progreso)}</strong>
                </div>
                <div>
                  <span className="card-label">Promedio</span>
                  <strong>
                    {typeof resumen.promedio === 'number' ? `${resumen.promedio} pts` : 'Sin datos'}
                  </strong>
                </div>
              </div>
              <div className="competence-list">
                {competencias.map((comp) => {
                  const indicadores = Array.isArray(comp.indicadores) ? comp.indicadores : []
                  return (
                    <article key={comp.id || comp.codigo} className="competence-card">
                      <header>
                        <div>
                          <span className="pill neutral">{comp.codigo || 'Competencia'}</span>
                          <strong>{comp.enunciado}</strong>
                        </div>
                        <span className="badge info">{formatPercent(comp.progreso)}</span>
                      </header>
                      {indicadores.map((ind) => {
                        const contenidos = Array.isArray(ind.contenidos) ? ind.contenidos : []
                        const recursos = Array.isArray(ind.recursos) ? ind.recursos : []
                        return (
                          <div key={ind.id || ind.codigo} className="indicator-card">
                            <div className="indicator-header">
                              <strong>{ind.codigo}</strong>
                              <div className="indicator-tags">
                                <span
                                  className={`badge ${
                                    ind.estado === 'completado'
                                      ? 'success'
                                      : ind.estado === 'en_progreso'
                                      ? 'warning'
                                      : 'muted'
                                  }`}
                                >
                                  {(ind.estado || 'pendiente').replace('_', ' ')}
                                </span>
                                {typeof ind.puntuacion === 'number' ? (
                                  <span className="badge info">{ind.puntuacion} pts</span>
                                ) : null}
                              </div>
                            </div>
                            {ind.descripcion ? <p className="muted">{ind.descripcion}</p> : null}
                            {contenidos.length ? (
                              <div className="indicator-content">
                                <h4>Contenidos del CNB</h4>
                                <ul>
                                  {contenidos.map((contenido, idx) => (
                                    <li key={idx}>{contenido}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            <div className="indicator-resources">
                              <h4>Recursos recomendados</h4>
                              {recursos.length ? (
                                <ul>
                                  {recursos.map((recurso) => (
                                    <li key={recurso._id}>
                                      <a href={recurso.url} target="_blank" rel="noopener noreferrer">
                                        <strong>{recurso.titulo}</strong>
                                        <span>{recurso.tipo}{recurso.proveedor ? ` · ${recurso.proveedor}` : ''}</span>
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="muted">Aún no hay recursos cargados para este indicador.</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </article>
                  )
                })}
              </div>
            </>
          ) : (
            <EmptyState title="Área sin contenidos" description="No se encontraron indicadores configurados." />
          )}
        </div>
      </div>
    </div>
  )
}

function GradeSelection({ user, options, onSelect, saving, error }) {
  const displayName = user?.nombre || user?.name || user?.email || 'Estudiante'
  const gradeOptions = options && options.length ? options : [
    { number: 1, label: '1ro. Básico', description: 'Plan oficial CNB' },
    { number: 2, label: '2do. Básico', description: 'Plan oficial CNB' },
    { number: 3, label: '3ro. Básico', description: 'Plan oficial CNB' },
  ]

  return (
    <div className="grade-shell">
      <div className="grade-card">
        <div className="grade-card-inner">
          <section className="grade-card-copy">
            <header className="grade-card-header">
              <div>
                <h2>{displayName}</h2>
                <span className="badge">ESTUDIANTE</span>
              </div>
              <p className="grade-lead">Selecciona tu grado para personalizar tu experiencia.</p>
            </header>
            <p className="grade-body">
              Vinculamos tus avances con el Currículo Nacional Base de Guatemala (CNB).
              Elige el grado correspondiente para habilitar tu tablero, progreso y recursos
              recomendados según tu nivel.
            </p>
            <ul className="grade-benefits">
              <li>Contenido oficial organizado por competencias e indicadores.</li>
              <li>Seguimiento de progreso y recomendaciones inteligentes.</li>
              <li>Sincronización con tus intentos y reportes en tiempo real.</li>
            </ul>
          </section>
          <section className="grade-card-selector">
            <h3>Grados disponibles</h3>
            <p className="muted">Esta elección queda registrada y será utilizada en tus reportes.</p>
            <div className="grade-options">
              {gradeOptions.map((option) => (
                <button
                  key={option.number || option.code}
                  type="button"
                  className="grade-option"
                  onClick={() => onSelect(option.number)}
                  disabled={Boolean(saving)}
                >
                  <span className="grade-option-title">{option.label}</span>
                  {option.description ? (
                    <span className="grade-option-sub">{option.description}</span>
                  ) : null}
                  <span className="grade-option-cta">
                    {saving === option.number ? 'Asignando…' : 'Iniciar plan'}
                  </span>
                </button>
              ))}
            </div>
            {error ? <p className="grade-error">{error}</p> : null}
          </section>
        </div>
      </div>
    </div>
  )
}

export default function StudentDashboard({ user, onUserUpdate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseDetail, setCourseDetail] = useState(null)
  const [courseLoading, setCourseLoading] = useState(false)
  const [courseError, setCourseError] = useState(null)
  const [gradeSaving, setGradeSaving] = useState(null)
  const [gradeError, setGradeError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const response = await api.studentDashboard()
        if (mounted) {
          setData(response)
          setError(null)
        }
      } catch (err) {
        if (mounted) setError(err.message || 'No se pudo cargar el panel')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user?.id, reloadKey])

  const courses = useMemo(() => (Array.isArray(data?.cursos) ? data.cursos : []), [data])
  const recommendations = useMemo(() => (Array.isArray(data?.recomendaciones) ? data.recomendaciones : []), [data])
  const notifications = useMemo(() => (Array.isArray(data?.notificaciones) ? data.notificaciones : []), [data])
  const historyItems = useMemo(() => (Array.isArray(data?.historial) ? data.historial : []), [data])

  const summaryCards = useMemo(() => {
    if (!data || data.requiresGradeSelection) return []
    const summary = data.summary || {}
    return [
      {
        title: 'Promedio general',
        value:
          typeof summary.promedioGeneral === 'number'
            ? `${summary.promedioGeneral} pts`
            : 'Sin datos',
        subtitle: 'Últimos indicadores evaluados',
        tone: 'accent',
      },
      {
        title: 'Progreso total',
        value: formatPercent(summary.progresoTotal),
        subtitle: `${summary.tareasCompletadas || 0} de ${summary.tareasTotales || 0} indicadores`,
      },
      {
        title: 'Tareas completadas',
        value: formatNumber(summary.tareasCompletadas),
        subtitle: 'Indicadores finalizados',
      },
      {
        title: 'Tiempo de uso',
        value: formatDuration(summary.tiempoUsoSegundos),
        subtitle: `Racha actual: ${data.usage?.streak || 0} días`,
      },
    ]
  }, [data])

  const navItems = useMemo(() => {
    if (!data || data.requiresGradeSelection) return []
    return [
      { id: 'student-overview', label: 'Resumen' },
      { id: 'student-courses', label: 'Cursos CNB', badge: courses.length },
      { id: 'student-recommendations', label: 'Recomendaciones', badge: recommendations.length },
      { id: 'student-activity', label: 'Actividad', badge: historyItems.length },
    ]
  }, [data, courses, recommendations, historyItems])

  const openCourse = async (course) => {
    setSelectedCourse(course)
    setCourseDetail(null)
    setCourseError(null)
    const areaId = course?.areaId
    if (!areaId) {
      setCourseError('No se pudo identificar el área seleccionada.')
      return
    }
    try {
      setCourseLoading(true)
      const detail = await api.studentCourseDetail(areaId)
      setCourseDetail(detail)
    } catch (err) {
      setCourseError(err.message || 'No se pudo cargar el curso')
    } finally {
      setCourseLoading(false)
    }
  }

  const closeCourse = () => {
    setSelectedCourse(null)
    setCourseDetail(null)
    setCourseError(null)
  }

  const selectGrade = async (gradeNumber) => {
    if (!gradeNumber || gradeSaving === gradeNumber) return
    try {
      setGradeSaving(gradeNumber)
      setGradeError(null)
      await api.updateProfile({ grado: gradeNumber })
      if (typeof onUserUpdate === 'function') {
        try {
          await onUserUpdate()
        } catch (e) {
          // ignoramos errores silenciosamente
        }
      }
      setReloadKey((key) => key + 1)
    } catch (err) {
      setGradeError(err.message || 'No se pudo actualizar el grado')
    } finally {
      setGradeSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-shell loading">
        <p>Cargando panel...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-shell error">
        <p>{error}</p>
      </div>
    )
  }

  if (!data) return null

  if (data.requiresGradeSelection) {
    return (
      <GradeSelection
        user={data.user || user}
        options={data.availableGrades || []}
        onSelect={selectGrade}
        saving={gradeSaving}
        error={gradeError}
      />
    )
  }

  const attemptsLabel = formatAttempts({ used: data.intentos?.usados, limit: data.intentos?.limite || 3 })

  const hero = (
    <section id="student-overview" className="hero-section student-hero">
      <div className="hero-main">
        <div>
          <span className="hero-eyebrow">Panel estudiantil</span>
          <h2>Hola {data.user?.nombre || user?.name || user?.email}</h2>
          <p>Revisa tu avance del grado {data.user?.grade?.label || ''} y continúa con tus cursos del CNB.</p>
        </div>
        <div className="hero-side">
          <div className="hero-chip">
            <span>Intentos</span>
            <strong>{attemptsLabel}</strong>
            <small>Máximo permitido: {data.intentos?.limite || 3}</small>
          </div>
          <div className="hero-chip">
            <span>Notificaciones</span>
            <strong>{formatNumber(data.summary?.notificacionesNoLeidas)}</strong>
            <small>Pendientes de revisar</small>
          </div>
        </div>
      </div>
      <div className="hero-metrics">
        {summaryCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  )

  return (
    <>
      <DashboardLayout user={data.user} roleLabel="Estudiante" navItems={navItems} hero={hero}>
        <SectionCard
          id="student-courses"
          title="Cursos del CNB"
          description="Áreas oficiales del Currículo Nacional Base para tu grado."
        >
          <CourseGrid courses={courses} onSelect={openCourse} />
        </SectionCard>

        <SectionCard
          id="student-recommendations"
          title="Recomendaciones personalizadas"
          description="Recursos seleccionados según tu progreso y necesidades de refuerzo."
        >
          <RecommendationList items={recommendations} />
        </SectionCard>

        <SectionCard
          id="student-activity"
          title="Actividad reciente y seguimiento"
          description="Consulta tu historial, tiempo de uso y notificaciones en un solo lugar."
        >
          <div className="activity-grid">
            <div className="activity-main">
              <h4>Historial de actividades</h4>
              <HistoryTimeline items={historyItems} />
            </div>
            <aside className="activity-side">
              <div className="usage-widget">
                <header>
                  <strong>Tiempo de uso</strong>
                  <span className="muted">Racha de {data.usage?.streak || 0} días</span>
                </header>
                <div className="usage-summary">
                  <strong>{formatDuration(data.summary?.tiempoUsoSegundos)}</strong>
                  <span className="muted">{data.usage?.sessions?.length || 0} sesiones recientes</span>
                </div>
                <UsageSpark usage={data.usage} />
              </div>
              <div className="notifications-widget">
                <header>
                  <strong>Notificaciones</strong>
                  <span className="muted">Correos y alertas enviadas</span>
                </header>
                <NotificationFeed items={notifications} />
              </div>
            </aside>
          </div>
        </SectionCard>
      </DashboardLayout>

      <CourseDetailModal
        course={selectedCourse}
        detail={courseDetail}
        loading={courseLoading}
        error={courseError}
        onClose={closeCourse}
      />
    </>
  )
}

import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import {
  formatDuration,
  formatPercent,
  formatNumber,
  formatShortDate,
  weekdayLabel,
  formatAttempts,
} from './utils'

function SummaryCard({ title, value, detail }) {
  return (
    <div className="dash-card summary-card">
      <span className="card-label">{title}</span>
      <strong className="card-value">{value}</strong>
      {detail ? <span className="card-detail">{detail}</span> : null}
    </div>
  )
}

function ProgressRow({ course }) {
  const { titulo, progreso, completados, totalIndicadores } = course
  return (
    <div className="progress-row">
      <div className="progress-meta">
        <strong>{titulo}</strong>
        <span>{completados} de {totalIndicadores} indicadores</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.min(100, progreso)}%` }} />
      </div>
      <span className="progress-value">{formatPercent(progreso)}</span>
    </div>
  )
}

function UsageChart({ usage }) {
  const maxSeconds = Math.max(...usage.sessions.map((s) => s.seconds), 1)
  return (
    <div className="usage-chart">
      {usage.sessions.map((session) => (
        <div key={session.date} className="usage-bar">
          <span className="bar-label">{weekdayLabel(session.date)}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(session.seconds / maxSeconds) * 100}%` }}
            />
          </div>
          <span className="bar-value">{formatDuration(session.seconds)}</span>
        </div>
      ))}
    </div>
  )
}

function RecommendationBlock({ item }) {
  return (
    <div className="recommendation-item">
      <div className="recommendation-header">
        <strong>{item.indicador?.codigo || 'Indicador recomendado'}</strong>
        <span className={`pill ${item.motivo === 'repaso' ? 'info' : 'warning'}`}>
          {item.motivo === 'repaso' ? 'Repaso' : 'Refuerzo'}
        </span>
      </div>
      {item.indicador?.descripcion ? (
        <p className="muted">{item.indicador.descripcion}</p>
      ) : null}
      <ul className="resource-list">
        {item.recursos.map((resource) => (
          <li key={resource._id}>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <span className="resource-title">{resource.titulo}</span>
              <span className="resource-meta">{resource.tipo}{resource.proveedor ? ` · ${resource.proveedor}` : ''}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NotificationList({ items }) {
  if (!items.length) return <p className="muted">No tienes notificaciones recientes.</p>
  return (
    <ul className="notification-list">
      {items.map((item) => (
        <li key={item._id} className={item.leida ? '' : 'unread'}>
          <div>
            <strong>{item.tipo === 'repaso' ? 'Repaso sugerido' : 'Notificación'}</strong>
            <span className="muted">{formatShortDate(item.fecha || item.createdAt)}</span>
          </div>
          <p>{item.mensaje}</p>
        </li>
      ))}
    </ul>
  )
}

function HistoryList({ items }) {
  if (!items.length) return <p className="muted">Sin actividad reciente.</p>
  return (
    <ul className="history-list">
      {items.map((item) => (
        <li key={item.id}>
          <div className="history-meta">
            <strong>{item.indicador?.codigo || 'Indicador'}</strong>
            <span className="muted">{formatShortDate(item.fecha)}</span>
          </div>
          <p>{item.indicador?.descripcion || 'Actividad registrada'}</p>
          <span className={`badge ${item.estado === 'completado' ? 'success' : item.estado === 'en_progreso' ? 'warning' : 'muted'}`}>
            {item.estado?.replace('_', ' ')}
          </span>
          {typeof item.puntuacion === 'number' ? (
            <span className="badge info">{item.puntuacion} pts</span>
          ) : null}
        </li>
      ))}
    </ul>
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
    <div className="modal-backdrop">
      <div className="modal-card">
        <header className="modal-header">
          <div>
            <h3>{course.titulo}</h3>
            {detail?.grade?.label ? <span className="muted">{detail.grade.label}</span> : null}
          </div>
          <button type="button" className="ghost-btn" onClick={onClose}>Cerrar</button>
        </header>
        {loading ? (
          <div className="modal-body"><p>Cargando contenidos...</p></div>
        ) : error ? (
          <div className="modal-body error"><p>{error}</p></div>
        ) : detail ? (
          <div className="modal-body">
            <section className="modal-summary">
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
            </section>
            <div className="competence-list">
              {competencias.length ? (
                competencias.map((comp) => {
                  const indicadores = Array.isArray(comp.indicadores) ? comp.indicadores : []
                  return (
                    <article key={comp.id || comp.codigo} className="competence-card">
                      <header>
                        <strong>{comp.codigo || 'Competencia'}</strong>
                        <span className="muted">{comp.enunciado}</span>
                        <span className="badge info">{formatPercent(comp.progreso)}</span>
                      </header>
                      <ul className="indicator-list">
                        {indicadores.map((ind) => {
                          const contenidos = Array.isArray(ind.contenidos) ? ind.contenidos : []
                          const recursos = Array.isArray(ind.recursos) ? ind.recursos : []
                          return (
                            <li key={ind.id || ind.codigo}>
                              <div className="indicator-header">
                                <strong>{ind.codigo}</strong>
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
                              {ind.descripcion ? <p>{ind.descripcion}</p> : null}
                              {contenidos.length ? (
                                <ul className="content-list">
                                  {contenidos.map((contenido) => (
                                    <li key={contenido.codigo || contenido.titulo}>
                                      {contenido.codigo ? <span>{contenido.codigo}</span> : null}
                                      <p>{contenido.titulo}</p>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              {recursos.length ? (
                                <ul className="resource-list compact">
                                  {recursos.map((resource) => (
                                    <li key={resource._id || resource.url}>
                                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                        {resource.titulo || 'Recurso sugerido'}
                                      </a>
                                      <span className="muted">{resource.tipo || 'Recurso'}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    </article>
                  )
                })
              ) : (
                <p className="muted">No hay competencias registradas para este curso.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="modal-body"><p>No se encontraron contenidos.</p></div>
        )}
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

  const summaryCards = useMemo(() => {
    if (!data) return []
    const summary = data.summary || {}
    return [
      {
        title: 'Promedio general',
        value:
          typeof summary.promedioGeneral === 'number'
            ? `${summary.promedioGeneral} pts`
            : 'Sin datos',
        detail: 'Últimas evaluaciones',
      },
      {
        title: 'Progreso total',
        value: formatPercent(summary.progresoTotal),
        detail: `${summary.tareasCompletadas || 0} de ${summary.tareasTotales || 0} indicadores`,
      },
      {
        title: 'Tareas completadas',
        value: formatNumber(summary.tareasCompletadas),
        detail: 'Indicadores completados',
      },
      {
        title: 'Tiempo de uso',
        value: formatDuration(summary.tiempoUsoSegundos),
        detail: `Racha: ${data.usage?.streak || 0} días`,
      },
    ]
  }, [data])

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

  const courses = Array.isArray(data.cursos) ? data.cursos : []
  const notifications = Array.isArray(data.notificaciones) ? data.notificaciones : []
  const historyItems = Array.isArray(data.historial) ? data.historial : []
  const recommendations = Array.isArray(data.recomendaciones) ? data.recomendaciones : []
  const attemptsLabel = formatAttempts({ used: data.intentos?.usados, limit: data.intentos?.limite || 3 })

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h2>Panel estudiantil</h2>
          <p>Hola {data.user?.nombre || user?.name || user?.email}, revisa tu avance del grado {data.user?.grade?.label || ''}.</p>
        </div>
        <div className="header-stats">
          <div className="dash-card mini">
            <span className="card-label">Intentos</span>
            <strong className="card-value">{attemptsLabel}</strong>
            <span className="card-detail">Máximo permitido: {data.intentos?.limite || 3}</span>
          </div>
          <div className="dash-card mini">
            <span className="card-label">Notificaciones</span>
            <strong className="card-value">{formatNumber(data.summary?.notificacionesNoLeidas)}</strong>
            <span className="card-detail">Pendientes de revisar</span>
          </div>
        </div>
      </header>

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid two">
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Progreso por área</h3>
              <span className="muted">Indicadores completados vs plan CNB</span>
            </div>
          </header>
          <div className="progress-list">
            {courses.length ? (
              courses.map((course) => <ProgressRow key={course.areaId || course.titulo} course={course} />)
            ) : (
              <p className="muted">Aún no hay progreso registrado para tu grado.</p>
            )}
          </div>
        </article>
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Tiempo de uso</h3>
              <span className="muted">Últimos días de actividad</span>
            </div>
          </header>
          <div className="usage-summary">
            <strong>{formatDuration(data.usage?.totalSeconds)}</strong>
            <span className="muted">Suma de sesiones</span>
          </div>
          {data.usage?.sessions?.length ? <UsageChart usage={data.usage} /> : <p className="muted">Sin sesiones registradas.</p>}
        </article>
      </section>

      <section className="grid two">
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Tablero de cursos</h3>
              <span className="muted">Explora los contenidos por área</span>
            </div>
          </header>
          <div className="course-grid">
            {courses.length ? (
              courses.map((course) => (
                <button
                  key={course.areaId || course.titulo}
                  className="course-card"
                  type="button"
                  onClick={() => openCourse(course)}
                >
                  <div className="course-progress">
                    <span className="pill info">{formatPercent(course.progreso)}</span>
                    <span>{course.completados} / {course.totalIndicadores} completados</span>
                  </div>
                  <strong>{course.titulo}</strong>
                  {course.siguiente ? (
                    <span className="muted">Próximo: {course.siguiente.codigo || course.siguiente.descripcion}</span>
                  ) : (
                    <span className="muted">Todo al día</span>
                  )}
                </button>
              ))
            ) : (
              <p className="muted">No encontramos áreas del CNB configuradas para tu grado.</p>
            )}
          </div>
        </article>
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Recomendaciones personalizadas</h3>
              <span className="muted">Recursos sugeridos para reforzar</span>
            </div>
          </header>
          <div className="recommendation-grid">
            {recommendations.length ? (
              recommendations.map((item) => (
                <RecommendationBlock key={item.indicadorId || item._id} item={item} />
              ))
            ) : (
              <p className="muted">No hay recomendaciones activas.</p>
            )}
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Notificaciones</h3>
              <span className="muted">Correos y alertas enviadas</span>
            </div>
          </header>
          <NotificationList items={notifications} />
        </article>
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Historial de actividades</h3>
              <span className="muted">Intentos y acciones recientes</span>
            </div>
          </header>
          <HistoryList items={historyItems} />
        </article>
      </section>

      <CourseDetailModal
        course={selectedCourse}
        detail={courseDetail}
        loading={courseLoading}
        error={courseError}
        onClose={closeCourse}
      />
    </div>
  )
}

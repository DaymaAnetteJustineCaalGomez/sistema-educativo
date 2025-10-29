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
                <strong>{detail.resumen.totalIndicadores}</strong>
              </div>
              <div>
                <span className="card-label">Completados</span>
                <strong>{detail.resumen.completados}</strong>
              </div>
              <div>
                <span className="card-label">Progreso</span>
                <strong>{formatPercent(detail.resumen.progreso)}</strong>
              </div>
              <div>
                <span className="card-label">Promedio</span>
                <strong>
                  {typeof detail.resumen.promedio === 'number'
                    ? `${detail.resumen.promedio} pts`
                    : 'Sin datos'}
                </strong>
              </div>
            </section>
            <div className="competence-list">
              {detail.competencias.map((comp) => (
                <article key={comp.id} className="competence-card">
                  <header>
                    <strong>{comp.codigo || 'Competencia'}</strong>
                    <span className="muted">{comp.enunciado}</span>
                    <span className="badge info">{formatPercent(comp.progreso)}</span>
                  </header>
                  <ul className="indicator-list">
                    {comp.indicadores.map((ind) => (
                      <li key={ind.id}>
                        <div className="indicator-header">
                          <strong>{ind.codigo}</strong>
                          <span className={`badge ${ind.estado === 'completado' ? 'success' : ind.estado === 'en_progreso' ? 'warning' : 'muted'}`}>
                            {ind.estado.replace('_', ' ')}
                          </span>
                          {typeof ind.puntuacion === 'number' ? <span className="badge info">{ind.puntuacion} pts</span> : null}
                        </div>
                        {ind.descripcion ? <p>{ind.descripcion}</p> : null}
                        {Array.isArray(ind.contenidos) && ind.contenidos.length ? (
                          <ul className="content-list">
                            {ind.contenidos.map((contenido) => (
                              <li key={contenido.codigo || contenido.titulo}>
                                <span>{contenido.codigo}</span>
                                <p>{contenido.titulo}</p>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {ind.recursos && ind.recursos.length ? (
                          <ul className="resource-list compact">
                            {ind.recursos.map((resource) => (
                              <li key={resource._id}>
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                  {resource.titulo}
                                </a>
                                <span className="muted">{resource.tipo}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="modal-body"><p>No se encontraron contenidos.</p></div>
        )}
      </div>
    </div>
  )
}

export default function StudentDashboard({ user }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseDetail, setCourseDetail] = useState(null)
  const [courseLoading, setCourseLoading] = useState(false)
  const [courseError, setCourseError] = useState(null)

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
  }, [user?.id])

  const summaryCards = useMemo(() => {
    if (!data) return []
    const { summary } = data
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
    try {
      setCourseLoading(true)
      const detail = await api.studentCourseDetail(course.areaId)
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
            {data.cursos.map((course) => (
              <ProgressRow key={course.areaId} course={course} />
            ))}
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
            {data.cursos.map((course) => (
              <button key={course.areaId} className="course-card" type="button" onClick={() => openCourse(course)}>
                <div className="course-progress">
                  <span className="pill info">{formatPercent(course.progreso)}</span>
                  <span>{course.completados} / {course.totalIndicadores} completados</span>
                </div>
                <strong>{course.titulo}</strong>
                {course.siguiente ? (
                  <span className="muted">Próximo: {course.siguiente.codigo || course.siguiente.descripcion}</span>
                ) : <span className="muted">Todo al día</span>}
              </button>
            ))}
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
            {data.recomendaciones?.length ? (
              data.recomendaciones.map((item) => (
                <RecommendationBlock key={item.indicadorId} item={item} />
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
          <NotificationList items={data.notificaciones || []} />
        </article>
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Historial de actividades</h3>
              <span className="muted">Intentos y acciones recientes</span>
            </div>
          </header>
          <HistoryList items={data.historial || []} />
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

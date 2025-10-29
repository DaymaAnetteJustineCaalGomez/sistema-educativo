import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout, { SectionCard, StatCard, EmptyState } from './DashboardLayout'
import { api } from '../api'
import { formatPercent, formatNumber, formatShortDate, formatAttempts } from './utils'

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
      {courses.map((course) => {
        const resume = []
        if (typeof course.competencias === 'number') {
          resume.push(`${formatNumber(course.competencias)} competencias`)
        }
        if (typeof course.recursos === 'number') {
          resume.push(`${formatNumber(course.recursos)} recursos`)
        }
        return (
          <article key={course.areaId || course.titulo} className="course-card">
            <header className="course-card-header">
              <div>
                <span className="pill accent">Área CNB</span>
                <h4>{course.titulo}</h4>
              </div>
              <span className="course-progress">{formatPercent(course.progreso)}</span>
            </header>
            <p className="course-card-meta">{resume.length ? resume.join(' · ') : 'Plan oficial del grado'}</p>
            <div className="course-card-body">
              <p>
                {formatNumber(course.completados)} de {formatNumber(course.totalIndicadores)} indicadores completados.
              </p>
              <div className="course-card-tags">
                <span className="badge neutral">Pendientes {formatNumber(course.pendientes)}</span>
                {typeof course.promedio === 'number' ? (
                  <span className="badge info">{course.promedio} pts</span>
                ) : null}
              </div>
              {course.siguiente ? (
                <div className="course-card-next">
                  <span className="muted">Próximo indicador</span>
                  <strong>{course.siguiente.codigo || course.siguiente.descripcion}</strong>
                </div>
              ) : (
                <div className="course-card-next">
                  <span className="muted">Área completada</span>
                  <strong>Sin pendientes</strong>
                </div>
              )}
            </div>
            <footer className="course-card-footer">
              <button type="button" className="link-btn" onClick={() => onSelect(course)}>
                Ver contenidos
              </button>
            </footer>
          </article>
        )
      })}
    </div>
  )
}

const RESOURCE_GROUPS = [
  { key: 'videos', title: 'Videos', matcher: (type) => type.includes('video') },
  {
    key: 'ejercicios',
    title: 'Ejercicios y práctica',
    matcher: (type) => type.includes('ejercicio') || type.includes('quiz') || type.includes('evaluación') || type.includes('práctica') || type.includes('practica'),
  },
  { key: 'contenidos', title: 'Lecturas y recursos complementarios', matcher: () => true },
]

function normalizeContenido(item) {
  if (!item) return null
  if (typeof item === 'string') return item
  const { codigo, titulo } = item
  if (codigo && titulo) return `${codigo} · ${titulo}`
  return codigo || titulo || null
}

function groupResources(resources = []) {
  const buckets = RESOURCE_GROUPS.map((group) => ({ ...group, items: [] }))
  resources.forEach((resource) => {
    const type = (resource?.tipo || '').toLowerCase()
    const target = buckets.find((group) => group.matcher(type)) || buckets[buckets.length - 1]
    target.items.push(resource)
  })
  // Evita duplicar recursos en los grupos siguientes
  const seen = new Set()
  return buckets.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const key = String(item._id || `${item.titulo}-${item.url}`)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }),
  }))
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
  const gradeLabel = detail?.grade?.label

  return (
    <div className="course-modal" role="dialog" aria-modal="true">
      <div className="course-modal__overlay" onClick={onClose} />
      <div className="course-modal__panel">
        <header className="course-modal__header">
          <div>
            <h3>{course.titulo}</h3>
            {gradeLabel ? <span className="muted">{gradeLabel}</span> : null}
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
              <div className="course-overview">
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
              <div className="competence-stack">
                {competencias.map((comp) => {
                  const indicadores = Array.isArray(comp.indicadores) ? comp.indicadores : []
                  return (
                    <article key={comp.id || comp.codigo} className="competence-card">
                      <header className="competence-header">
                        <div>
                          <span className="pill neutral">{comp.codigo || 'Competencia'}</span>
                          <strong>{comp.enunciado}</strong>
                        </div>
                        <span className="badge info">{formatPercent(comp.progreso)}</span>
                      </header>
                      <div className="indicator-grid">
                        {indicadores.map((ind) => {
                          const contenidos = (Array.isArray(ind.contenidos) ? ind.contenidos : [])
                            .map((item) => normalizeContenido(item))
                            .filter(Boolean)
                          const recursos = Array.isArray(ind.recursos) ? ind.recursos : []
                          const grouped = groupResources(recursos)
                          return (
                            <div key={ind.id || ind.codigo} className="indicator-panel">
                              <div className="indicator-head">
                                <div>
                                  <strong>{ind.codigo}</strong>
                                  {ind.descripcion ? <p className="muted">{ind.descripcion}</p> : null}
                                </div>
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
                              {contenidos.length ? (
                                <div className="indicator-contents">
                                  <h4>Temas y subtemas del CNB</h4>
                                  <ul>
                                    {contenidos.map((contenido, idx) => (
                                      <li key={idx}>{contenido}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                              <div className="indicator-resources">
                                <h4>Recursos asociados</h4>
                                <div className="resource-groups">
                                  {grouped.map((group) => (
                                    <div key={group.key} className="resource-group">
                                      <h5>{group.title}</h5>
                                      {group.items.length ? (
                                        <ul className="resource-list">
                                          {group.items.map((resource) => (
                                            <li key={resource._id || resource.url}>
                                              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                                <strong>{resource.titulo}</strong>
                                                <span>
                                                  {resource.tipo}
                                                  {resource.proveedor ? ` · ${resource.proveedor}` : ''}
                                                </span>
                                              </a>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="muted">No hay recursos disponibles en esta categoría.</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
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
    const pendientes =
      typeof summary.indicadoresPendientes === 'number'
        ? summary.indicadoresPendientes
        : Math.max((summary.tareasTotales || 0) - (summary.tareasCompletadas || 0), 0)
    const attempts = data.intentos || {}
    const attemptsLabel = formatAttempts({
      used: attempts.usados,
      limit: attempts.limite || 3,
    })
    const attemptsRemaining = Math.max((attempts.limite || 3) - (attempts.usados || 0), 0)
    const recomendacionesActivas =
      typeof summary.recomendacionesActivas === 'number'
        ? summary.recomendacionesActivas
        : (Array.isArray(data?.recomendaciones) ? data.recomendaciones.length : 0)
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
        subtitle: `${formatNumber(summary.tareasCompletadas || 0)} de ${formatNumber(summary.tareasTotales || 0)} indicadores`,
      },
      {
        title: 'Indicadores pendientes',
        value: formatNumber(pendientes),
        subtitle: 'Temas por completar en el plan CNB',
      },
      {
        title: 'Intentos disponibles',
        value: attemptsLabel,
        subtitle: `${formatNumber(attemptsRemaining)} restantes de ${formatNumber(attempts.limite || 3)}`,
        tone: 'soft',
      },
      {
        title: 'Recomendaciones activas',
        value: formatNumber(recomendacionesActivas),
        subtitle: 'Sugerencias listas para reforzar',
      },
    ]
  }, [data])

  const featuredCourse = useMemo(() => {
    if (!courses.length) return null
    if (data?.cursoDestacadoId) {
      const match = courses.find((course) => course.areaId === data.cursoDestacadoId)
      if (match) return match
    }
    const sorted = [...courses].sort((a, b) => {
      const pendingDiff = (b.pendientes || 0) - (a.pendientes || 0)
      if (pendingDiff !== 0) return pendingDiff
      const progressDiff = (a.progreso || 0) - (b.progreso || 0)
      if (progressDiff !== 0) return progressDiff
      return (a.titulo || '').localeCompare(b.titulo || '', 'es')
    })
    return sorted[0] || null
  }, [courses, data?.cursoDestacadoId])

  const navItems = useMemo(() => {
    if (!data || data.requiresGradeSelection) return []
    const items = [{ id: 'student-overview', label: 'Inicio' }]
    if (featuredCourse) {
      items.push({ id: 'student-featured', label: 'Recomendado' })
    }
    items.push({ id: 'student-courses', label: 'Cursos CNB', badge: courses.length })
    items.push({ id: 'student-recommendations', label: 'Recomendaciones', badge: recommendations.length })
    items.push({ id: 'student-history', label: 'Historial', badge: historyItems.length })
    items.push({ id: 'student-notifications', label: 'Notificaciones', badge: notifications.length })
    return items
  }, [data, courses, recommendations, historyItems, notifications, featuredCourse])

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
  const attemptsRemaining = Math.max((data.intentos?.limite || 3) - (data.intentos?.usados || 0), 0)

  const hero = (
    <section id="student-overview" className="student-hero">
      <div className="student-hero__copy">
        <span className="hero-eyebrow">Panel estudiantil</span>
        <h1>Mis cursos CNB · {data.user?.grade?.label}</h1>
        <p>
          Explora las áreas oficiales del Currículo Nacional Base de Guatemala con videos, ejercicios y contenidos
          organizados por competencias para tu grado.
        </p>
        <div className="hero-summary">
          <div>
            <span className="muted">Intentos disponibles</span>
            <strong>{attemptsLabel}</strong>
            <small>{formatNumber(attemptsRemaining)} restantes</small>
          </div>
          <div>
            <span className="muted">Recomendaciones activas</span>
            <strong>{formatNumber(recommendations.length)}</strong>
            <small>Preparadas para ti</small>
          </div>
        </div>
      </div>
      <div className="student-hero__stats">
        {summaryCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  )

  return (
    <>
      <DashboardLayout user={data.user} roleLabel="Estudiante" navItems={navItems} hero={hero}>
        {featuredCourse ? (
          <SectionCard
            id="student-featured"
            title="Recomendado para ti"
            description={`Prioridad sugerida según tus indicadores pendientes. Te quedan ${formatNumber(
              attemptsRemaining,
            )} intentos disponibles.`}
          >
            <div className="featured-course">
              <div className="featured-course__copy">
                <span className="pill accent">Área sugerida</span>
                <h3>{featuredCourse.titulo}</h3>
                <p>
                  {featuredCourse.pendientes > 0
                    ? `Te faltan ${formatNumber(featuredCourse.pendientes)} indicadores para completar esta área.`
                    : 'Has completado todos los indicadores de esta área.'}
                </p>
                <div className="featured-course__tags">
                  <span className="badge neutral">{formatNumber(featuredCourse.competencias)} competencias</span>
                  <span className="badge neutral">{formatNumber(featuredCourse.recursos)} recursos</span>
                  {typeof featuredCourse.promedio === 'number' ? (
                    <span className="badge info">{featuredCourse.promedio} pts</span>
                  ) : null}
                </div>
              </div>
              <div className="featured-course__actions">
                <div className="featured-course__next">
                  <span className="muted">
                    {featuredCourse.siguiente ? 'Próximo indicador' : 'Área completada'}
                  </span>
                  <strong>
                    {featuredCourse.siguiente
                      ? featuredCourse.siguiente.codigo || featuredCourse.siguiente.descripcion
                      : 'Sin pendientes'}
                  </strong>
                </div>
                <button type="button" className="primary-btn" onClick={() => openCourse(featuredCourse)}>
                  Ver contenidos
                </button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        <SectionCard
          id="student-courses"
          title="Cursos del CNB"
          description="Selecciona un área para explorar competencias, temas, videos, ejercicios y contenidos relacionados."
        >
          <CourseGrid courses={courses} onSelect={openCourse} />
        </SectionCard>

        <SectionCard
          id="student-recommendations"
          title="Recomendaciones personalizadas"
          description="Recursos oficiales y actividades sugeridas con base en tu progreso y tus intentos recientes."
        >
          <RecommendationList items={recommendations} />
        </SectionCard>

        <SectionCard
          id="student-history"
          title="Últimos intentos"
          description="Revisa tus actividades más recientes y el estado de cada indicador evaluado."
        >
          <HistoryTimeline items={historyItems} />
        </SectionCard>

        <SectionCard
          id="student-notifications"
          title="Notificaciones y recordatorios"
          description="Mensajes importantes enviados a tu correo y dentro de la plataforma."
        >
          <NotificationFeed items={notifications} />
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

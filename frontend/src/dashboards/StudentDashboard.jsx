import React, { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout, { SectionCard, StatCard, EmptyState } from './DashboardLayout'
import { api } from '../api'
import { formatNumber, formatPercent, formatShortDate, formatAttempts } from './utils'

const RESOURCE_GROUPS = [
  { key: 'videos', title: 'Videos', matcher: (type) => type.includes('video') },
  {
    key: 'ejercicios',
    title: 'Ejercicios y práctica',
    matcher: (type) =>
      type.includes('ejercicio') ||
      type.includes('quiz') ||
      type.includes('evaluación') ||
      type.includes('práctica') ||
      type.includes('practica'),
  },
  { key: 'contenidos', title: 'Lecturas y contenidos', matcher: () => true },
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

function RecommendationList({ items }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin recomendaciones activas"
        description="Cuando registres más intentos aparecerán aquí los temas de refuerzo sugeridos."
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
        title="Sin notificaciones"
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
        title="Sin actividad reciente"
        description="Cuando completes ejercicios o recursos, verás tu historial aquí."
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

function GradeSelection({ user, options, onSelect, saving, error }) {
  const displayName = user?.nombre || user?.name || user?.email || 'Estudiante'
  const gradeOptions = options && options.length
    ? options
    : [
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
              Vinculamos tus avances con el Currículo Nacional Base de Guatemala (CNB). Elige el grado correspondiente
              para habilitar tu tablero, progreso y recursos recomendados según tu nivel.
            </p>
            <ul className="grade-benefits">
              <li>Contenido oficial organizado por competencias e indicadores.</li>
              <li>Seguimiento de progreso y recomendaciones inteligentes.</li>
              <li>Sincronización con tus intentos y reportes en tiempo real.</li>
            </ul>
          </section>
          <section className="grade-card-selector">
            <h3>Grados disponibles</h3>
            <p className="muted">Esta elección quedará registrada y se usará en tus reportes.</p>
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
                  {option.description ? <span className="grade-option-sub">{option.description}</span> : null}
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

function HeroBanner({ user, summary }) {
  const gradeLabel = user?.grade?.label || 'Sin grado asignado'
  const gradeCode = user?.grade?.code ? `Plan ${user.grade.code}` : 'Selecciona tu grado para activar los contenidos'
  const promedio = typeof summary?.promedioGeneral === 'number' ? `${summary.promedioGeneral.toFixed(1)} pts` : '0 pts'
  const progreso = formatPercent(summary?.progresoTotal)
  const completados = `${formatNumber(summary?.tareasCompletadas)} / ${formatNumber(summary?.tareasTotales)}`

  return (
    <div className="student-hero redesigned">
      <div className="hero-intro">
        <span className="hero-eyebrow">Currículo Nacional Base · Guatemala</span>
        <h1>Hola, {user?.nombre?.split(' ')[0] || user?.nombre || user?.email || 'estudiante'} 👋</h1>
        <p>
          Explora tus áreas del CNB, revisa los temas oficiales y continúa con tus ejercicios y recursos personalizados
          para tu grado.
        </p>
        <div className="hero-grade-chip">
          <span className="grade-chip-label">{gradeLabel}</span>
          <span className="grade-chip-sub">{gradeCode}</span>
        </div>
      </div>
      <div className="hero-metrics-grid">
        <StatCard
          title="Promedio general"
          value={promedio}
          subtitle="Resultado ponderado de tus indicadores"
          tone="accent"
        />
        <StatCard
          title="Progreso total"
          value={progreso}
          subtitle={`Indicadores completados ${completados}`}
          tone="soft"
        />
        <StatCard
          title="Indicadores pendientes"
          value={formatNumber(summary?.indicadoresPendientes)}
          subtitle="Prioriza estas actividades para avanzar"
          tone="soft"
        />
      </div>
    </div>
  )
}

function AreaShowcase({ courses, onSelect, activeId }) {
  if (!courses.length) {
    return (
      <EmptyState
        title="Sin áreas asignadas"
        description="Cuando tu grado tenga áreas del CNB configuradas aparecerán aquí."
      />
    )
  }

  return (
    <div className="area-grid">
      {courses.map((course) => {
        const courseId = course.areaId || course.titulo
        const competenciasLabel = typeof course.competencias === 'number'
          ? `${formatNumber(course.competencias)} competencias`
          : 'Competencias CNB'
        const recursosLabel = typeof course.recursos === 'number'
          ? `${formatNumber(course.recursos)} recursos`
          : 'Recursos oficiales'
        const isActive = activeId && activeId === course.areaId
        return (
          <article key={courseId} className={`area-card${isActive ? ' is-active' : ''}`}>
            <div className="area-card__header">
              <span className="pill accent">Área CNB</span>
              <h4>{course.titulo}</h4>
            </div>
            <p className="area-card__copy">
              {competenciasLabel} · {recursosLabel}
            </p>
            <ul className="area-card__stats">
              <li>
                <span className="stat-label">Progreso</span>
                <strong>{formatPercent(course.progreso)}</strong>
              </li>
              <li>
                <span className="stat-label">Indicadores</span>
                <strong>
                  {formatNumber(course.completados)} / {formatNumber(course.totalIndicadores)}
                </strong>
              </li>
              <li>
                <span className="stat-label">Pendientes</span>
                <strong>{formatNumber(course.pendientes)}</strong>
              </li>
              {typeof course.promedio === 'number' ? (
                <li>
                  <span className="stat-label">Promedio</span>
                  <strong>{course.promedio} pts</strong>
                </li>
              ) : null}
            </ul>
            <div className="area-card__next">
              <span className="muted">Siguiente tema</span>
              <strong>{course.siguiente?.codigo || course.siguiente?.descripcion || 'Área completada'}</strong>
            </div>
            <button type="button" className="primary-btn" onClick={() => onSelect(course)}>
              Ver contenidos del área
            </button>
          </article>
        )
      })}
    </div>
  )
}

function CourseDetailDrawer({ course, detail, loading, error, onClose }) {
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
    <div className="course-drawer" role="dialog" aria-modal="true">
      <div className="course-drawer__backdrop" onClick={onClose} role="presentation" />
      <aside className="course-drawer__panel">
        <header className="course-drawer__header">
          <div>
            <span className="pill neutral">Área CNB</span>
            <h3>{course?.titulo || 'Área seleccionada'}</h3>
            {gradeLabel ? <span className="muted">{gradeLabel}</span> : null}
          </div>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <div className="course-drawer__content">
          {loading ? (
            <p className="muted">Cargando contenidos del área...</p>
          ) : error ? (
            <EmptyState title="No se pudo cargar el área" description={error} />
          ) : competencias.length ? (
            <>
              <div className="drawer-summary">
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
              <div className="drawer-competencies">
                {competencias.map((comp) => {
                  const indicadores = Array.isArray(comp.indicadores) ? comp.indicadores : []
                  return (
                    <details key={comp.id || comp.codigo} className="drawer-competence" open>
                      <summary>
                        <div className="drawer-competence__meta">
                          <div>
                            <span className="pill neutral">{comp.codigo || 'Competencia'}</span>
                            <strong>{comp.enunciado}</strong>
                          </div>
                          <span className="badge info">{formatPercent(comp.progreso)}</span>
                        </div>
                      </summary>
                      <div className="drawer-indicators">
                        {indicadores.map((ind) => {
                          const contenidos = (Array.isArray(ind.contenidos) ? ind.contenidos : [])
                            .map((item) => normalizeContenido(item))
                            .filter(Boolean)
                          const recursos = Array.isArray(ind.recursos) ? ind.recursos : []
                          const grouped = groupResources(recursos)
                          return (
                            <article key={ind.id || ind.codigo} className="drawer-indicator">
                              <header className="drawer-indicator__head">
                                <div>
                                  <strong>{ind.codigo}</strong>
                                  {ind.descripcion ? <p>{ind.descripcion}</p> : null}
                                </div>
                                <div className="drawer-indicator__tags">
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
                              </header>
                              {contenidos.length ? (
                                <section className="drawer-section">
                                  <h4>Temas y subtemas</h4>
                                  <ul>
                                    {contenidos.map((contenido, idx) => (
                                      <li key={idx}>{contenido}</li>
                                    ))}
                                  </ul>
                                </section>
                              ) : null}
                              <section className="drawer-section">
                                <h4>Recursos del indicador</h4>
                                <div className="drawer-resources">
                                  {grouped.map((group) => (
                                    <div key={group.key} className="drawer-resource-group">
                                      <h5>{group.title}</h5>
                                      {group.items.length ? (
                                        <ul>
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
                                        <p className="muted">Sin recursos registrados en esta categoría.</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </section>
                            </article>
                          )
                        })}
                      </div>
                    </details>
                  )
                })}
              </div>
            </>
          ) : (
            <EmptyState title="Área sin contenidos" description="No se encontraron indicadores configurados." />
          )}
        </div>
      </aside>
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
  const [courseCache, setCourseCache] = useState({})
  const [gradeSaving, setGradeSaving] = useState(null)
  const [gradeError, setGradeError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const response = await api.studentDashboard()
        if (!active) return
        setData(response)
        setError(null)
      } catch (err) {
        if (!active) return
        setError(err.message || 'No se pudo cargar el panel del estudiante')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [reloadKey])

  const courses = useMemo(() => (Array.isArray(data?.cursos) ? data.cursos : []), [data])
  const navItems = useMemo(() => {
    if (!data || data.requiresGradeSelection) return []
    return [
      { id: 'overview', label: 'Inicio' },
      { id: 'areas', label: 'Áreas CNB', badge: courses.length ? formatNumber(courses.length) : null },
      {
        id: 'recomendaciones',
        label: 'Recomendaciones',
        badge: data.summary?.recomendacionesActivas ? formatNumber(data.summary.recomendacionesActivas) : null,
      },
      {
        id: 'notificaciones',
        label: 'Notificaciones',
        badge: data.summary?.notificacionesNoLeidas ? formatNumber(data.summary.notificacionesNoLeidas) : null,
      },
      { id: 'historial', label: 'Historial' },
    ]
  }, [data, courses])

  const selectGrade = useCallback(
    async (gradeNumber) => {
      if (!gradeNumber || gradeSaving) return
      try {
        setGradeSaving(gradeNumber)
        setGradeError(null)
        await api.updateProfile({ grado: gradeNumber })
        setReloadKey((key) => key + 1)
        if (onUserUpdate) {
          onUserUpdate()
        }
      } catch (err) {
        setGradeError(err.message || 'No se pudo asignar el grado')
      } finally {
        setGradeSaving(null)
      }
    },
    [gradeSaving, onUserUpdate],
  )

  const openCourse = useCallback(
    async (course) => {
      if (!course?.areaId) return
      setSelectedCourse(course)
      const cached = courseCache[course.areaId]
      if (cached) {
        setCourseDetail(cached)
        setCourseError(null)
        setCourseLoading(false)
        return
      }
      try {
        setCourseDetail(null)
        setCourseLoading(true)
        setCourseError(null)
        const response = await api.studentCourseDetail(course.areaId)
        setCourseCache((prev) => ({ ...prev, [course.areaId]: response }))
        setCourseDetail(response)
      } catch (err) {
        setCourseError(err.message || 'No se pudieron cargar los contenidos del área')
      } finally {
        setCourseLoading(false)
      }
    },
    [courseCache],
  )

  const closeCourse = useCallback(() => {
    setSelectedCourse(null)
    setCourseDetail(null)
    setCourseError(null)
    setCourseLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="dashboard-shell loading">
        <p>Cargando panel estudiantil...</p>
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

  return (
    <>
      <DashboardLayout
        user={data.user}
        roleLabel="ESTUDIANTE"
        navItems={navItems}
        hero={<HeroBanner user={data.user} summary={data.summary} />}
      >
        <SectionCard
          id="overview"
          title="Resumen del grado"
          description="Visualiza el avance de tus indicadores, intentos registrados y recordatorios pendientes."
        >
          <div className="stat-grid">
            <StatCard
              title="Indicadores completados"
              value={`${formatNumber(data.summary?.tareasCompletadas)} / ${formatNumber(data.summary?.tareasTotales)}`}
              subtitle="Total de indicadores trabajados"
            />
            <StatCard
              title="Intentos registrados"
              value={formatNumber(data.intentos?.totales)}
              subtitle={`Disponibles ${formatAttempts({ used: data.intentos?.usados, limit: data.intentos?.limite })}`}
            />
            <StatCard
              title="Recomendaciones activas"
              value={formatNumber(data.summary?.recomendacionesActivas)}
              subtitle="Refuerzos personalizados en tu bandeja"
            />
            <StatCard
              title="Notificaciones sin leer"
              value={formatNumber(data.summary?.notificacionesNoLeidas)}
              subtitle="Mensajes importantes del sistema"
            />
          </div>
        </SectionCard>

        <SectionCard
          id="areas"
          title="Áreas del CNB"
          description="Selecciona una materia para revisar competencias, temas, videos, ejercicios y contenido oficial."
        >
          <AreaShowcase courses={courses} onSelect={openCourse} activeId={selectedCourse?.areaId} />
        </SectionCard>

        <SectionCard
          id="recomendaciones"
          title="Recomendaciones personalizadas"
          description="Indicadores y recursos sugeridos con base en tu progreso y tus intentos recientes."
        >
          <RecommendationList items={Array.isArray(data.recomendaciones) ? data.recomendaciones : []} />
        </SectionCard>

        <SectionCard
          id="notificaciones"
          title="Notificaciones recientes"
          description="Mensajes, recordatorios y alertas enviados a tu cuenta."
        >
          <NotificationFeed items={Array.isArray(data.notificaciones) ? data.notificaciones : []} />
        </SectionCard>

        <SectionCard
          id="historial"
          title="Historial de actividad"
          description="Últimos intentos e indicadores trabajados en la plataforma."
        >
          <HistoryTimeline items={Array.isArray(data.historial) ? data.historial : []} />
        </SectionCard>
      </DashboardLayout>

      <CourseDetailDrawer
        course={selectedCourse}
        detail={courseDetail}
        loading={courseLoading}
        error={courseError}
        onClose={closeCourse}
      />
    </>
  )
}

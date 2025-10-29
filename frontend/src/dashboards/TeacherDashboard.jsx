import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout, { SectionCard, StatCard, EmptyState } from './DashboardLayout'
import { api } from '../api'
import {
  formatDuration,
  formatPercent,
  formatNumber,
  formatShortDate,
  weekdayLabel,
} from './utils'

function UsageSpark({ usage }) {
  const sessions = Array.isArray(usage?.sessions) ? usage.sessions : []
  if (!sessions.length) {
    return <span className="muted">Sin sesiones registradas.</span>
  }
  const maxSeconds = Math.max(...sessions.map((s) => Number(s.seconds) || 0), 1)
  return (
    <div className="usage-spark compact">
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

function WeakTopicList({ items }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin focos débiles"
        description="Cuando detectemos indicadores con bajo desempeño se mostrarán aquí."
      />
    )
  }
  return (
    <ul className="weak-topic-list">
      {items.map((topic) => (
        <li key={topic.indicadorId}>
          <div className="weak-topic-main">
            <strong>{topic.codigo || 'Indicador'}</strong>
            <p>{topic.descripcion}</p>
          </div>
          <div className="weak-topic-meta">
            <span className="badge warning">Promedio {topic.promedio} pts</span>
            <span className="badge muted">{topic.completados} completados</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

function StudentTable({ rows }) {
  if (!rows.length) {
    return (
      <EmptyState
        title="Sin estudiantes con actividad"
        description="Cuando tus estudiantes registren progreso aparecerán en este informe."
      />
    )
  }
  return (
    <div className="table-wrapper">
      <table className="data-table wide">
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
          {rows.map((student) => (
            <tr key={student.id}>
              <td>{student.nombre}</td>
              <td>{student.grado}</td>
              <td>{student.promedio ? `${student.promedio} pts` : '—'}</td>
              <td>{formatPercent(student.progreso)}</td>
              <td>{formatNumber(student.completados)}</td>
              <td>{formatPercent(student.abandono)}</td>
              <td>{student.frecuencia}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HistoryTimeline({ items }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin registros recientes"
        description="Cuando los estudiantes completen actividades aparecerán en esta lista."
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
              <strong>{item.estudiante?.nombre || 'Estudiante'}</strong>
              <span className="muted">{formatShortDate(item.fecha)}</span>
            </div>
            <p>{item.indicador?.descripcion || item.mensaje || 'Actividad registrada'}</p>
            <div className="timeline-tags">
              {item.indicador?.codigo ? <span className="badge info">{item.indicador.codigo}</span> : null}
              {item.estado ? <span className="badge muted">{item.estado.replace('_', ' ')}</span> : null}
              {typeof item.puntuacion === 'number' ? <span className="badge info">{item.puntuacion} pts</span> : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function RecommendationTimeline({ items }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin recomendaciones enviadas"
        description="Cuando el sistema envíe sugerencias a tus estudiantes se listarán aquí."
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
              <strong>{item.estudiante?.nombre || 'Sistema'}</strong>
              <span className="muted">{formatShortDate(item.fecha)}</span>
            </div>
            <p>{item.mensaje}</p>
            <div className="timeline-tags">
              {item.tipo ? <span className="badge info">{item.tipo}</span> : null}
              <span className={`badge ${item.leida ? 'muted' : 'warning'}`}>
                {item.leida ? 'Leída' : 'Enviada'}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function TeacherDashboard({ user }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const response = await api.teacherDashboard()
        if (mounted) {
          setData(response)
          setError(null)
        }
      } catch (err) {
        if (mounted) setError(err.message || 'No se pudo cargar el panel docente')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user?.id])

  const studentRows = useMemo(() => (Array.isArray(data?.students) ? data.students : []), [data])
  const weakTopics = useMemo(() => (Array.isArray(data?.weakTopics) ? data.weakTopics : []), [data])
  const studentHistory = useMemo(() => data?.histories?.students || [], [data])
  const recommendationHistory = useMemo(() => data?.histories?.recomendaciones || [], [data])

  const summaryMetrics = useMemo(() => {
    if (!data) return []
    const summary = data.summary || {}
    return [
      {
        title: 'Promedio general',
        value: summary.promedioGeneral ? `${summary.promedioGeneral} pts` : 'Sin datos',
        subtitle: 'Últimos indicadores evaluados',
        tone: 'accent',
      },
      {
        title: 'Cobertura CNB',
        value: formatPercent(summary.cobertura),
        subtitle: 'Avance total vs plan',
      },
      {
        title: 'Progreso promedio',
        value: formatPercent(summary.progresoPromedio),
        subtitle: 'Promedio entre estudiantes',
      },
      {
        title: 'Abandono',
        value: formatPercent(summary.abandono),
        subtitle: 'Intentos abandonados',
      },
    ]
  }, [data])

  const navItems = useMemo(() => {
    if (!data) return []
    return [
      { id: 'teacher-overview', label: 'Resumen' },
      { id: 'teacher-report', label: 'Informe estudiantil', badge: studentRows.length },
      { id: 'teacher-focus', label: 'Focos débiles', badge: weakTopics.length },
      { id: 'teacher-history', label: 'Historial', badge: studentHistory.length },
    ]
  }, [data, studentRows, weakTopics, studentHistory])

  if (loading) {
    return (
      <div className="dashboard-shell loading">
        <p>Cargando panel docente...</p>
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

  const hero = (
    <section id="teacher-overview" className="hero-section teacher-hero">
      <div className="hero-main">
        <div>
          <span className="hero-eyebrow">Panel docente</span>
          <h2>Bienvenido{user?.name ? `, ${user.name}` : ''}</h2>
          <p>Acompaña el desempeño de tus estudiantes y detecta focos de atención en tiempo real.</p>
        </div>
        <div className="hero-side">
          <div className="hero-chip">
            <span>Estudiantes activos</span>
            <strong>{formatNumber(data.side?.estudiantesActivos)}</strong>
          </div>
          <div className="hero-chip">
            <span>Reportes pendientes</span>
            <strong>{formatNumber(data.side?.reportesPendientes)}</strong>
          </div>
          <div className="hero-chip">
            <span>Mensajes sin leer</span>
            <strong>{formatNumber(data.side?.mensajesSinLeer)}</strong>
          </div>
        </div>
      </div>
      <div className="hero-metrics">
        {summaryMetrics.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  )

  return (
    <DashboardLayout user={user} roleLabel="Docente" navItems={navItems} hero={hero}>
      <SectionCard
        id="teacher-report"
        title="Informe estudiantil"
        description="Promedio, progreso y abandono por estudiante de tu grado."
      >
        <StudentTable rows={studentRows} />
      </SectionCard>

      <SectionCard
        id="teacher-focus"
        title="Focos débiles y uso"
        description="Indicadores con menor desempeño y tiempo acumulado en la plataforma."
      >
        <div className="teacher-focus-grid">
          <div className="focus-list">
            <WeakTopicList items={weakTopics} />
          </div>
          <aside className="focus-usage">
            <header>
              <strong>Tiempo de uso</strong>
              <span className="muted">Últimos 7 días</span>
            </header>
            <div className="usage-summary">
              <strong>{formatDuration(data.usage?.totalSeconds)}</strong>
              <span className="muted">{data.usage?.sessions?.length || 0} sesiones registradas</span>
            </div>
            <UsageSpark usage={data.usage || { sessions: [] }} />
          </aside>
        </div>
      </SectionCard>

      <SectionCard
        id="teacher-history"
        title="Historial de estudiantes"
        description="Consulta actividades recientes y recomendaciones enviadas."
      >
        <div className="teacher-history-grid">
          <div>
            <h4>Intentos y resultados</h4>
            <HistoryTimeline items={studentHistory} />
          </div>
          <div>
            <h4>Recomendaciones enviadas</h4>
            <RecommendationTimeline items={recommendationHistory} />
          </div>
        </div>
      </SectionCard>
    </DashboardLayout>
  )
}

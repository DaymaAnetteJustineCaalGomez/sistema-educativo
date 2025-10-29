import React, { useEffect, useState } from 'react'
import { api } from '../api'
import {
  formatDuration,
  formatPercent,
  formatNumber,
  formatShortDate,
  weekdayLabel,
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

function UsageChart({ usage }) {
  if (!usage.sessions?.length) return <p className="muted">Sin sesiones registradas.</p>
  const maxSeconds = Math.max(...usage.sessions.map((s) => s.seconds), 1)
  return (
    <div className="usage-chart">
      {usage.sessions.map((session) => (
        <div key={session.date} className="usage-bar">
          <span className="bar-label">{weekdayLabel(session.date)}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(session.seconds / maxSeconds) * 100}%` }} />
          </div>
          <span className="bar-value">{formatDuration(session.seconds)}</span>
        </div>
      ))}
    </div>
  )
}

function WeakTopics({ items }) {
  if (!items.length) return <p className="muted">No se detectaron focos débiles recientes.</p>
  return (
    <ul className="pill-list">
      {items.map((topic) => (
        <li key={topic.indicadorId}>
          <span className="pill warning">{topic.codigo || 'Indicador'}</span>
          <span>{topic.descripcion}</span>
          <span className="muted">Promedio {topic.promedio} pts</span>
        </li>
      ))}
    </ul>
  )
}

function HistoryTimeline({ items }) {
  if (!items.length) return <p className="muted">Sin registros recientes.</p>
  return (
    <ul className="history-list">
      {items.map((item) => (
        <li key={item.id}>
          <div className="history-meta">
            <strong>{item.estudiante?.nombre || 'Estudiante'}</strong>
            <span className="muted">{formatShortDate(item.fecha)}</span>
          </div>
          <p>{item.indicador?.descripcion || item.mensaje || 'Evento registrado'}</p>
          {item.indicador?.codigo ? <span className="badge info">{item.indicador.codigo}</span> : null}
          {item.estado ? <span className="badge muted">{item.estado.replace('_', ' ')}</span> : null}
        </li>
      ))}
    </ul>
  )
}

function RecommendationTimeline({ items }) {
  if (!items.length) return <p className="muted">Aún no hay recomendaciones enviadas.</p>
  return (
    <ul className="history-list">
      {items.map((item) => (
        <li key={item.id}>
          <div className="history-meta">
            <strong>{item.estudiante?.nombre || 'Sistema'}</strong>
            <span className="muted">{formatShortDate(item.fecha)}</span>
          </div>
          <p>{item.mensaje}</p>
          <span className={`badge ${item.leida ? 'muted' : 'warning'}`}>{item.leida ? 'Leída' : 'Enviada'}</span>
          {item.tipo ? <span className="badge info">{item.tipo}</span> : null}
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

  const summaryCards = [
    { title: 'Promedio general', value: data.summary?.promedioGeneral ? `${data.summary.promedioGeneral} pts` : 'Sin datos', detail: 'Últimos indicadores evaluados' },
    { title: 'Cobertura CNB', value: formatPercent(data.summary?.cobertura), detail: 'Avance total vs plan' },
    { title: 'Progreso promedio', value: formatPercent(data.summary?.progresoPromedio), detail: 'Promedio entre estudiantes' },
    { title: 'Abandono', value: formatPercent(data.summary?.abandono), detail: 'Intentos abandonados' },
  ]

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h2>Panel docente</h2>
          <p>Acompaña el desempeño de tus estudiantes y detecta focos de atención.</p>
        </div>
        <div className="header-stats">
          <div className="dash-card mini">
            <span className="card-label">Estudiantes activos</span>
            <strong className="card-value">{formatNumber(data.side?.estudiantesActivos)}</strong>
          </div>
          <div className="dash-card mini">
            <span className="card-label">Reportes pendientes</span>
            <strong className="card-value">{formatNumber(data.side?.reportesPendientes)}</strong>
          </div>
          <div className="dash-card mini">
            <span className="card-label">Mensajes sin leer</span>
            <strong className="card-value">{formatNumber(data.side?.mensajesSinLeer)}</strong>
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
              <h3>Informe estudiantil</h3>
              <span className="muted">Promedio, progreso y abandono por estudiante</span>
            </div>
          </header>
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
                {data.students?.map((student) => (
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
        </article>
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Focos débiles y uso</h3>
              <span className="muted">Temas que requieren seguimiento y uso semanal</span>
            </div>
          </header>
          <WeakTopics items={data.weakTopics || []} />
          <div className="usage-summary">
            <strong>{formatDuration(data.usage?.totalSeconds)}</strong>
            <span className="muted">Tiempo total registrado</span>
          </div>
          <UsageChart usage={data.usage || { sessions: [] }} />
        </article>
      </section>

      <section className="grid two">
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Historial de estudiantes</h3>
              <span className="muted">Intentos y resultados recientes</span>
            </div>
          </header>
          <HistoryTimeline items={data.histories?.students || []} />
        </article>
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Historial de recomendaciones</h3>
              <span className="muted">Acciones enviadas a los alumnos</span>
            </div>
          </header>
          <RecommendationTimeline items={data.histories?.recomendaciones || []} />
        </article>
      </section>
    </div>
  )
}

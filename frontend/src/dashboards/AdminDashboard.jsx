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
  if (!usage.sessions?.length) return <p className="muted">Sin registros recientes.</p>
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

function HistoryList({ items }) {
  if (!items.length) return <p className="muted">Sin eventos registrados.</p>
  return (
    <ul className="history-list">
      {items.map((item) => (
        <li key={item.id}>
          <div className="history-meta">
            <strong>{item.nombre || item.email || 'Sistema'}</strong>
            <span className="muted">{formatShortDate(item.fecha)}</span>
          </div>
          <p>{item.mensaje || `Rol: ${item.rol || '—'}`}</p>
          {item.tipo ? <span className="badge info">{item.tipo}</span> : null}
        </li>
      ))}
    </ul>
  )
}

export default function AdminDashboard({ user }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const response = await api.adminDashboard()
        if (mounted) {
          setData(response)
          setError(null)
        }
      } catch (err) {
        if (mounted) setError(err.message || 'No se pudo cargar el panel administrativo')
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
        <p>Cargando panel administrativo...</p>
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
    { title: 'Usuarios totales', value: formatNumber(data.summary?.usuariosTotales), detail: 'Personas registradas en la plataforma' },
    { title: 'Progreso promedio', value: formatPercent(data.summary?.progresoPromedio), detail: 'Promedio de los grados básicos' },
    { title: 'Intentos registrados', value: formatNumber(data.summary?.intentosRegistrados), detail: 'Intentos acumulados' },
    { title: 'Tiempo total', value: formatDuration(data.summary?.tiempoTotalSegundos), detail: 'Uso global de la aplicación' },
  ]

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h2>Panel administrativo</h2>
          <p>Controla usuarios, catálogos y analiza los indicadores globales.</p>
        </div>
        <div className="header-stats">
          <div className="dash-card mini">
            <span className="card-label">Promedio general</span>
            <strong className="card-value">{data.summary?.promedioGeneral ? `${data.summary.promedioGeneral} pts` : 'Sin datos'}</strong>
          </div>
          <div className="dash-card mini">
            <span className="card-label">Cobertura</span>
            <strong className="card-value">{formatPercent(data.summary?.cobertura)}</strong>
          </div>
          <div className="dash-card mini">
            <span className="card-label">Abandono</span>
            <strong className="card-value">{formatPercent(data.summary?.abandono)}</strong>
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
              <h3>Roles activos</h3>
              <span className="muted">Distribución de cuentas por rol</span>
            </div>
          </header>
          <div className="stats-grid">
            <div className="stat-item">
              <strong>{formatNumber(data.roles?.ADMIN)}</strong>
              <span className="muted">Administradores</span>
            </div>
            <div className="stat-item">
              <strong>{formatNumber(data.roles?.DOCENTE)}</strong>
              <span className="muted">Docentes</span>
            </div>
            <div className="stat-item">
              <strong>{formatNumber(data.roles?.ESTUDIANTE)}</strong>
              <span className="muted">Estudiantes</span>
            </div>
          </div>
        </article>
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Métricas globales</h3>
              <span className="muted">Estado general del sistema</span>
            </div>
          </header>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="muted">Tareas completadas</span>
              <strong>{formatNumber(data.globalMetrics?.tareasCompletadas)}</strong>
            </div>
            <div className="stat-item">
              <span className="muted">Recomendaciones activas</span>
              <strong>{formatNumber(data.globalMetrics?.recomendacionesActivas)}</strong>
            </div>
            <div className="stat-item">
              <span className="muted">Tiempo promedio por sesión</span>
              <strong>{formatDuration(data.globalMetrics?.tiempoPromedioSesionSegundos)}</strong>
            </div>
            <div className="stat-item">
              <span className="muted">Intentos promedio por estudiante</span>
              <strong>{formatNumber(data.globalMetrics?.intentosPromedioPorEstudiante)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Uso de la plataforma</h3>
              <span className="muted">Sesiones por día</span>
            </div>
          </header>
          <div className="usage-summary">
            <strong>{formatDuration(data.usage?.totalSeconds)}</strong>
            <span className="muted">Uso acumulado reciente</span>
          </div>
          <UsageChart usage={data.usage || { sessions: [] }} />
        </article>
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Historial de recomendaciones</h3>
              <span className="muted">Alertas y recordatorios enviados</span>
            </div>
          </header>
          <HistoryList items={(data.histories?.recomendaciones || []).map((item) => ({
            id: item.id,
            nombre: item.usuarioId,
            fecha: item.fecha,
            mensaje: item.mensaje,
            tipo: item.tipo,
          }))} />
        </article>
      </section>

      <section className="grid">
        <article className="dash-card">
          <header className="section-header">
            <div>
              <h3>Historial de cambios</h3>
              <span className="muted">Últimas modificaciones de usuarios</span>
            </div>
          </header>
          <HistoryList items={(data.histories?.cambios || []).map((item) => ({
            id: item.id,
            nombre: item.nombre,
            fecha: item.fecha,
            mensaje: `Rol ${item.rol}`,
            tipo: item.email,
          }))} />
        </article>
      </section>
    </div>
  )
}

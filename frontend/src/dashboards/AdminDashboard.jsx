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

function RoleGrid({ roles }) {
  const items = [
    { label: 'Administradores', value: formatNumber(roles?.ADMIN) },
    { label: 'Docentes', value: formatNumber(roles?.DOCENTE) },
    { label: 'Estudiantes', value: formatNumber(roles?.ESTUDIANTE) },
  ]
  return (
    <div className="role-grid">
      {items.map((item) => (
        <div key={item.label} className="role-card">
          <strong>{item.value}</strong>
          <span className="muted">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function MetricGrid({ metrics }) {
  const items = [
    { label: 'Tareas completadas', value: formatNumber(metrics?.tareasCompletadas) },
    { label: 'Recomendaciones activas', value: formatNumber(metrics?.recomendacionesActivas) },
    { label: 'Tiempo promedio por sesión', value: formatDuration(metrics?.tiempoPromedioSesionSegundos) },
    { label: 'Intentos promedio por estudiante', value: formatNumber(metrics?.intentosPromedioPorEstudiante) },
  ]
  return (
    <div className="metric-grid">
      {items.map((item) => (
        <div key={item.label} className="metric-card">
          <span className="muted">{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

function RecommendationFeed({ items }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin recomendaciones recientes"
        description="Cuando se envíen recordatorios globales aparecerán en este historial."
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
              <strong>{item.tipo || 'Notificación'}</strong>
              <span className="muted">{formatShortDate(item.fecha)}</span>
            </div>
            <p>{item.mensaje}</p>
            <div className="timeline-tags">
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

function ChangeHistoryList({ items }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin cambios recientes"
        description="Los movimientos de usuarios y catálogos aparecerán en esta bitácora."
      />
    )
  }
  return (
    <ul className="change-history">
      {items.map((item) => (
        <li key={item.id}>
          <div>
            <strong>{item.nombre}</strong>
            <span className="muted">{item.email}</span>
          </div>
          <div className="change-meta">
            <span className="badge neutral">{item.rol}</span>
            <span className="muted">{formatShortDate(item.fecha)}</span>
          </div>
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

  const recommendationHistory = useMemo(() => data?.histories?.recomendaciones || [], [data])
  const changeHistory = useMemo(() => data?.histories?.cambios || [], [data])

  const summaryMetrics = useMemo(() => {
    if (!data) return []
    const summary = data.summary || {}
    return [
      {
        title: 'Usuarios totales',
        value: formatNumber(summary.usuariosTotales),
        subtitle: 'Personas registradas en la plataforma',
        tone: 'accent',
      },
      {
        title: 'Progreso promedio',
        value: formatPercent(summary.progresoPromedio),
        subtitle: 'Promedio de los grados básicos',
      },
      {
        title: 'Intentos registrados',
        value: formatNumber(summary.intentosRegistrados),
        subtitle: 'Intentos acumulados',
      },
      {
        title: 'Tiempo total',
        value: formatDuration(summary.tiempoTotalSegundos),
        subtitle: 'Uso global de la aplicación',
      },
    ]
  }, [data])

  const navItems = useMemo(() => {
    if (!data) return []
    return [
      { id: 'admin-overview', label: 'Resumen' },
      { id: 'admin-roles', label: 'Roles y catálogo' },
      { id: 'admin-metrics', label: 'Métricas globales' },
      { id: 'admin-activity', label: 'Actividad', badge: recommendationHistory.length + changeHistory.length },
    ]
  }, [data, recommendationHistory, changeHistory])

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

  const hero = (
    <section id="admin-overview" className="hero-section admin-hero">
      <div className="hero-main">
        <div>
          <span className="hero-eyebrow">Panel administrativo</span>
          <h2>Control central del sistema</h2>
          <p>Gestiona usuarios, catálogos del CNB y monitorea indicadores globales en tiempo real.</p>
        </div>
        <div className="hero-side">
          <div className="hero-chip">
            <span>Promedio general</span>
            <strong>{data.summary?.promedioGeneral ? `${data.summary.promedioGeneral} pts` : 'Sin datos'}</strong>
          </div>
          <div className="hero-chip">
            <span>Cobertura</span>
            <strong>{formatPercent(data.summary?.cobertura)}</strong>
          </div>
          <div className="hero-chip">
            <span>Abandono</span>
            <strong>{formatPercent(data.summary?.abandono)}</strong>
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
    <DashboardLayout user={user} roleLabel="Administración" navItems={navItems} hero={hero}>
      <SectionCard
        id="admin-roles"
        title="Roles activos"
        description="Distribución actual de usuarios por rol."
      >
        <RoleGrid roles={data.roles || {}} />
      </SectionCard>

      <SectionCard
        id="admin-metrics"
        title="Métricas globales"
        description="Indicadores generales del sistema educativo digital."
      >
        <MetricGrid metrics={data.globalMetrics || {}} />
      </SectionCard>

      <SectionCard
        id="admin-usage"
        title="Uso de la plataforma"
        description="Sesiones registradas y tiempo acumulado en la última semana."
      >
        <div className="usage-summary">
          <strong>{formatDuration(data.usage?.totalSeconds)}</strong>
          <span className="muted">{data.usage?.sessions?.length || 0} sesiones recientes</span>
        </div>
        <UsageSpark usage={data.usage || { sessions: [] }} />
      </SectionCard>

      <SectionCard
        id="admin-activity"
        title="Actividad y bitácora"
        description="Historial de recomendaciones enviadas y cambios en usuarios."
      >
        <div className="admin-history-grid">
          <div>
            <h4>Recomendaciones</h4>
            <RecommendationFeed items={recommendationHistory} />
          </div>
          <div>
            <h4>Historial de cambios</h4>
            <ChangeHistoryList items={changeHistory} />
          </div>
        </div>
      </SectionCard>
    </DashboardLayout>
  )
}

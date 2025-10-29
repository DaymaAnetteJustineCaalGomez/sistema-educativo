import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout, { SectionCard, StatCard, EmptyState } from './DashboardLayout'
import { api } from '../api'
import { formatPercent, formatNumber, formatShortDate } from './utils'

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

function MetricBoard({ metrics, extra }) {
  const items = [
    { label: 'Tareas completadas', value: formatNumber(metrics?.tareasCompletadas) },
    { label: 'Recomendaciones activas', value: formatNumber(metrics?.recomendacionesActivas) },
    { label: 'Intentos promedio por estudiante', value: formatNumber(metrics?.intentosPromedioPorEstudiante) },
  ]
  if (extra) items.push(extra)
  return (
    <div className="metric-board">
      {items.map((item) => (
        <div key={item.label} className="metric-card">
          <span className="muted">{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

const gradeLabels = { 1: '1ro. Básico', 2: '2do. Básico', 3: '3ro. Básico' }
const gradeCodes = { '1B': '1ro. Básico', '2B': '2do. Básico', '3B': '3ro. Básico' }

function CatalogSummary({ resumen }) {
  const items = [
    { label: 'Áreas CNB', value: formatNumber(resumen?.totalAreas) },
    { label: 'Competencias', value: formatNumber(resumen?.totalCompetencias) },
    { label: 'Indicadores', value: formatNumber(resumen?.totalIndicadores) },
  ]
  return (
    <div className="catalog-summary-cards">
      {items.map((item) => (
        <div key={item.label}>
          <span className="muted">{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

function CatalogAreaList({ areas }) {
  if (!areas.length) {
    return (
      <EmptyState
        title="Catálogo sin áreas"
        description="Carga las áreas del CNB para visualizar competencias e indicadores por grado."
      />
    )
  }
  return (
    <div className="catalog-area-grid">
      {areas.map((area) => {
        const gradeEntries = Object.entries(area.indicadoresPorGrado || {})
        return (
          <article key={area.id} className="catalog-area-card">
            <header>
              <h4>{area.nombre}</h4>
              <span className="muted">{formatNumber(area.indicadores)} indicadores</span>
            </header>
            {area.descripcion ? <p>{area.descripcion}</p> : null}
            <div className="catalog-area-meta">
              <span className="badge neutral">{formatNumber(area.competencias)} competencias</span>
              <span className="badge info">{formatNumber(area.indicadores)} indicadores</span>
            </div>
            <ul>
              {gradeEntries.length ? (
                gradeEntries.map(([code, count]) => (
                  <li key={code}>
                    <span>{gradeCodes[code] || gradeLabels[code] || code}</span>
                    <strong>{formatNumber(count)}</strong>
                  </li>
                ))
              ) : (
                <li className="muted">Sin indicadores asignados por grado</li>
              )}
            </ul>
          </article>
        )
      })}
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
  const catalogAreas = useMemo(
    () => (Array.isArray(data?.cnbCatalog?.areas) ? data.cnbCatalog.areas : []),
    [data],
  )
  const catalogSummary = data?.cnbCatalog?.resumen || {}

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
        title: 'Cobertura global',
        value: formatPercent(summary.cobertura),
        subtitle: 'Indicadores completados',
      },
    ]
  }, [data])

  const navItems = useMemo(() => {
    if (!data) return []
    return [
      { id: 'admin-overview', label: 'Resumen' },
      { id: 'admin-roles', label: 'Usuarios y roles' },
      { id: 'admin-catalog', label: 'Catálogo CNB', badge: catalogAreas.length },
      { id: 'admin-metrics', label: 'Métricas globales' },
      { id: 'admin-activity', label: 'Actividad', badge: recommendationHistory.length + changeHistory.length },
    ]
  }, [data, catalogAreas, recommendationHistory, changeHistory])

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
        id="admin-catalog"
        title="Catálogo CNB"
        description="Áreas, competencias e indicadores disponibles para los grados básicos."
      >
        <CatalogSummary resumen={catalogSummary} />
        <CatalogAreaList areas={catalogAreas} />
      </SectionCard>

      <SectionCard
        id="admin-metrics"
        title="Métricas globales"
        description="Indicadores generales del sistema educativo digital."
      >
        <MetricBoard
          metrics={data.globalMetrics || {}}
          extra={{ label: 'Indicadores en catálogo', value: formatNumber(catalogSummary.totalIndicadores) }}
        />
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

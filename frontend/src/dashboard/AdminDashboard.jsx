// frontend/src/dashboard/AdminDashboard.jsx
import React, { useMemo } from 'react';
import DashboardHeader from './components/DashboardHeader.jsx';
import { getFirstName } from '../utils/user.js';

function formatValue(value, suffix = '') {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${Math.round(value)}${suffix}`;
  }
  return value;
}

function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${Math.round(number)}%`;
}

export default function AdminDashboard({ user, onLogout }) {
  const firstName = getFirstName(user);
  const report = user?.informeGlobal || user?.globalReport || {};

  const metrics = [
    {
      label: 'Tareas completadas',
      value: formatValue(report?.tareasCompletas ?? report?.tasksCompleted),
      hint: 'Total de tareas cerradas en toda la plataforma.',
    },
    {
      label: 'Progreso promedio',
      value: formatPercent(report?.progresoPromedio ?? report?.averageProgress),
      hint: 'Avance global de los estudiantes.',
    },
    {
      label: 'Tiempo de uso',
      value: formatValue(report?.tiempoUsoHoras ?? report?.usageHours, ' h'),
      hint: 'Horas acumuladas de sesiones activas.',
    },
    {
      label: 'Intentos realizados',
      value: formatValue(report?.intentos ?? report?.attempts),
      hint: 'Cantidad de intentos registrados en evaluaciones.',
    },
  ];

  const sessions = useMemo(() => {
    const raw = user?.tiempoUsoPorSesion || user?.sessionUsage || [];
    if (Array.isArray(raw) && raw.length) {
      return raw.map((item, index) => ({
        id: item.id || index,
        label: item?.label || item?.fecha || `Sesión ${index + 1}`,
        value: item?.duracion || item?.duration || '—',
      }));
    }
    return [
      { id: 'sesion-1', label: 'Semana actual', value: '18 h 20 min' },
      { id: 'sesion-2', label: 'Semana anterior', value: '16 h 05 min' },
      { id: 'sesion-3', label: 'Promedio mensual', value: '64 h' },
    ];
  }, [user]);

  const recommendationHistory = useMemo(() => {
    const history = user?.historialGlobalRecomendaciones || user?.globalRecommendations || [];
    if (Array.isArray(history) && history.length) {
      return history.map((item, index) => ({
        id: item?.id || index,
        title: item?.titulo || item?.title || 'Recomendación',
        date: item?.fecha || item?.date || '',
      }));
    }
    return [
      { id: 'rec-1', title: 'Refuerzo de Matemática 2° básico', date: 'Hace 3 días' },
      { id: 'rec-2', title: 'Proyecto de Ciencias Naturales', date: 'Hace 1 semana' },
    ];
  }, [user]);

  const changeLog = useMemo(() => {
    const changes = user?.historialCambios || user?.changeLog || [];
    if (Array.isArray(changes) && changes.length) {
      return changes.map((item, index) => ({
        id: item?.id || index,
        title: item?.titulo || item?.title || 'Actualización',
        description: item?.descripcion || item?.description || '',
        date: item?.fecha || item?.date || '',
      }));
    }
    return [
      {
        id: 'chg-1',
        title: 'Actualización del catálogo de cursos',
        description: 'Se agregaron nuevas áreas de programación y pensamiento lógico.',
        date: 'Hace 2 días',
      },
      {
        id: 'chg-2',
        title: 'Gestión de roles',
        description: 'Se asignó el rol de Docente a 4 usuarios nuevos.',
        date: 'Hace 5 días',
      },
    ];
  }, [user]);

  return (
    <div className="dashboard dashboard--admin">
      <DashboardHeader user={user} onLogout={onLogout} badge="Administración" />

      <section className="dashboard-hero dashboard-hero--admin">
        <div>
          <p className="dashboard-hero__eyebrow">Panel administrativo</p>
          <h1>Hola, {firstName}</h1>
          <p>
            Administra usuarios, catálogos y roles, mientras supervisas el desempeño global del
            sistema.
          </p>
        </div>
        <button type="button" className="btn-primary">Crear gestión</button>
      </section>

      <section className="admin-section admin-section--management">
        <article className="management-card">
          <h2>Usuarios</h2>
          <p>Gestiona altas, bajas y ediciones de estudiantes y docentes.</p>
          <button type="button" className="btn-secondary">Administrar usuarios</button>
        </article>
        <article className="management-card">
          <h2>Catálogo</h2>
          <p>Controla las áreas disponibles, contenidos y material de apoyo.</p>
          <button type="button" className="btn-secondary">Actualizar catálogo</button>
        </article>
        <article className="management-card">
          <h2>Roles</h2>
          <p>Define permisos y asigna responsabilidades dentro del sistema.</p>
          <button type="button" className="btn-secondary">Configurar roles</button>
        </article>
      </section>

      <section className="admin-section admin-section--metrics">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div className="metric-card__label">{metric.label}</div>
            <div className="metric-card__value">{metric.value}</div>
            <p className="metric-card__hint">{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="admin-section admin-section--sessions">
        <h2>Tiempo de uso por sesiones</h2>
        <p>Consulta la frecuencia con la que se utiliza la plataforma.</p>
        <ul>
          {sessions.map((session) => (
            <li key={session.id}>
              <span>{session.label}</span>
              <strong>{session.value}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-section admin-section--history">
        <div className="admin-history">
          <h2>Historial de recomendaciones</h2>
          <ul>
            {recommendationHistory.map((item) => (
              <li key={item.id}>
                <span>{item.title}</span>
                <time>{item.date}</time>
              </li>
            ))}
          </ul>
        </div>
        <div className="admin-history">
          <h2>Historial de cambios</h2>
          <ul>
            {changeLog.map((item) => (
              <li key={item.id}>
                <div>
                  <span className="admin-history__title">{item.title}</span>
                  <p>{item.description}</p>
                </div>
                <time>{item.date}</time>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

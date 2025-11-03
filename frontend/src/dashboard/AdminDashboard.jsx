// frontend/src/dashboard/AdminDashboard.jsx
import React, { useMemo, useState } from 'react';
import DashboardHeader from './components/DashboardHeader.jsx';
import { getFirstName } from '../utils/user.js';
import AdminOverview from './admin/AdminOverview.jsx';
import AdminUsersPanel from './admin/AdminUsersPanel.jsx';
import AdminCatalogPanel from './admin/AdminCatalogPanel.jsx';
import AdminRolesPanel from './admin/AdminRolesPanel.jsx';

const PANELS = [
  { id: 'overview', label: 'Resumen' },
  { id: 'users', label: 'Usuarios' },
  { id: 'catalog', label: 'Catálogo' },
  { id: 'roles', label: 'Roles' },
];

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
  const [activePanel, setActivePanel] = useState('overview');

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
    return [];
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
    return [];
  }, [user]);

  const handlePanelChange = (panelId) => {
    setActivePanel(panelId);
  };

  return (
    <div className="dashboard dashboard--admin">
      <DashboardHeader user={user} onLogout={onLogout} badge="Administración" />
      <div className="dashboard-layout dashboard-layout--admin">
        <aside className="dashboard-aside dashboard-aside--admin">
          <section className="dashboard-hero-card dashboard-hero-card--admin">
            <p className="dashboard-hero__eyebrow">Panel administrativo</p>
            <h1>Hola, {firstName}</h1>
            <p>
              Supervisa el desempeño global, gestiona los catálogos de contenido y mantén los roles y
              usuarios al día.
            </p>
            <button type="button" className="btn-primary" onClick={() => handlePanelChange('catalog')}>
              Crear gestión
            </button>
          </section>

          <nav className="dashboard-menu" aria-label="Secciones administrativas">
            <h2>Menú de administración</h2>
            <ul>
              {PANELS.map((panel) => (
                <li key={panel.id}>
                  <button
                    type="button"
                    className={`dashboard-menu__link ${activePanel === panel.id ? 'dashboard-menu__link--active' : ''}`}
                    onClick={() => handlePanelChange(panel.id)}
                  >
                    {panel.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="dashboard-main dashboard-main--admin">
          {activePanel === 'overview' ? (
            <AdminOverview
              metrics={metrics}
              sessions={sessions}
              recommendationHistory={recommendationHistory}
              changeLog={changeLog}
              onManageUsers={() => handlePanelChange('users')}
              onManageCatalog={() => handlePanelChange('catalog')}
              onManageRoles={() => handlePanelChange('roles')}
            />
          ) : null}

          {activePanel === 'users' ? <AdminUsersPanel active /> : null}
          {activePanel === 'catalog' ? <AdminCatalogPanel active /> : null}
          {activePanel === 'roles' ? <AdminRolesPanel active /> : null}
        </main>
      </div>
    </div>
  );
}

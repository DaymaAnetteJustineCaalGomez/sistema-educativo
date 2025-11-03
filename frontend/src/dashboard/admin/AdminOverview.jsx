// frontend/src/dashboard/admin/AdminOverview.jsx
import React from 'react';

export default function AdminOverview({
  metrics,
  sessions,
  recommendationHistory,
  changeLog,
  onManageUsers,
  onManageCatalog,
  onManageRoles,
}) {
  return (
    <div className="admin-overview">
      <section className="admin-section admin-section--management">
        <article className="management-card">
          <h2>Usuarios</h2>
          <p>Gestiona altas, bajas y ediciones de estudiantes y docentes.</p>
          <button type="button" className="btn-secondary" onClick={onManageUsers}>
            Administrar usuarios
          </button>
        </article>
        <article className="management-card">
          <h2>Catálogo</h2>
          <p>Controla las áreas disponibles, contenidos y material de apoyo.</p>
          <button type="button" className="btn-secondary" onClick={onManageCatalog}>
            Actualizar catálogo
          </button>
        </article>
        <article className="management-card">
          <h2>Roles</h2>
          <p>Define permisos y asigna responsabilidades dentro del sistema.</p>
          <button type="button" className="btn-secondary" onClick={onManageRoles}>
            Configurar roles
          </button>
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
            {recommendationHistory.length ? (
              recommendationHistory.map((item) => (
                <li key={item.id}>
                  <span>{item.title}</span>
                  <time>{item.date}</time>
                </li>
              ))
            ) : (
              <li className="admin-history__empty">Aún no hay recomendaciones registradas.</li>
            )}
          </ul>
        </div>
        <div className="admin-history">
          <h2>Historial de cambios</h2>
          <ul>
            {changeLog.length ? (
              changeLog.map((item) => (
                <li key={item.id}>
                  <div>
                    <span className="admin-history__title">{item.title}</span>
                    <p>{item.description}</p>
                  </div>
                  <time>{item.date}</time>
                </li>
              ))
            ) : (
              <li className="admin-history__empty">Sin cambios recientes.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

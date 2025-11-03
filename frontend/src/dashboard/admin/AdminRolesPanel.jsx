// frontend/src/dashboard/admin/AdminRolesPanel.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

const ROLE_DESCRIPTIONS = {
  ESTUDIANTE:
    'Acceso a contenidos, seguimiento de progreso y recomendaciones personalizadas para cada grado.',
  DOCENTE:
    'Puede monitorear estudiantes, generar informes detallados y asignar actividades de refuerzo.',
  ADMIN:
    'Gestiona usuarios, catálogos y configuraciones globales del sistema educativo.',
};

export default function AdminRolesPanel({ active }) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.admin.rolesSummary();
      const list = Array.isArray(response?.roles) ? response.roles : [];
      setRoles(list);
    } catch (err) {
      setError(err.message || 'No se pudo obtener el resumen de roles.');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) {
      fetchRoles();
    }
  }, [active]);

  return (
    <div className="admin-panel admin-panel--roles">
      <header className="admin-panel__header">
        <div>
          <h2>Configurar roles</h2>
          <p>Consulta la distribución actual de roles y verifica que cada equipo tenga los permisos adecuados.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={fetchRoles} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar resumen'}
        </button>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}

      <section className="admin-panel__section admin-panel__section--roles">
        {roles.length ? (
          roles.map((role) => (
            <article className="admin-role-card" key={role.rol}>
              <header>
                <span className="admin-role-card__badge">{role.rol}</span>
                <strong>{role.total}</strong>
              </header>
              <p>{ROLE_DESCRIPTIONS[role.rol] || 'Rol personalizado del sistema.'}</p>
            </article>
          ))
        ) : (
          <p className="admin-empty">No se encontraron roles asignados.</p>
        )}
      </section>

      <section className="admin-panel__section admin-panel__section--notes">
        <h3>Buenas prácticas</h3>
        <ul>
          <li>Revisa los permisos de docentes y administradores cada inicio de trimestre.</li>
          <li>Actualiza los roles de estudiantes que cambien de grado al finalizar el ciclo escolar.</li>
          <li>Documenta los cambios realizados para mantener el historial actualizado.</li>
        </ul>
      </section>
    </div>
  );
}

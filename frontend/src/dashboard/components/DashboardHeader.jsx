// frontend/src/dashboard/components/DashboardHeader.jsx
import React from 'react';
import { getFirstName } from '../../utils/user.js';

export default function DashboardHeader({ user, badge, onLogout }) {
  const firstName = getFirstName(user);
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__brand">
        <span className="dashboard-header__title">Sistema Educativo</span>
        {badge ? <span className="dashboard-header__badge">{badge}</span> : null}
      </div>
      <div className="dashboard-header__user">
        <div className="dashboard-header__user-info">
          <span className="dashboard-header__user-name">{firstName}</span>
          <span className="dashboard-header__user-role">{user?.role}</span>
        </div>
        <button type="button" className="btn-ghost" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}

// frontend/src/dashboard/DashboardShell.jsx
import React, { useCallback } from 'react';
import Dashboard from './Dashboard.jsx';
import useDashboardCourses from './useDashboardCourses.js';
import { parseGrado } from '../utils/user.js';

export default function DashboardShell({ user, onLogout }) {
  const grado = parseGrado(user?.grado) || 1;
  const { courses, loading, error, refresh } = useDashboardCourses(grado);

  const handleRefresh = useCallback(
    (targetGrade) => {
      const next = parseGrado(targetGrade) || grado;
      refresh(next);
    },
    [refresh, grado]
  );

  return (
    <Dashboard
      user={user}
      courses={courses}
      loading={loading}
      error={error}
      onRefresh={handleRefresh}
      onLogout={onLogout}
    />
  );
}

// frontend/src/dashboard/DashboardShell.jsx
import React, { useCallback, useMemo } from 'react';
import StudentDashboard from './StudentDashboard.jsx';
import TeacherDashboard from './TeacherDashboard.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import useDashboardCourses from './useDashboardCourses.js';
import { parseGrado } from '../utils/user.js';

const DASHBOARD_COMPONENTS = {
  ESTUDIANTE: StudentDashboard,
  DOCENTE: TeacherDashboard,
  ADMIN: AdminDashboard,
};

export default function DashboardShell({ user, onLogout }) {
  const role = String(user?.role || user?.rol || 'ESTUDIANTE').toUpperCase();
  const grado = parseGrado(user?.grado) || 1;
  const shouldLoadCourses = role === 'ESTUDIANTE';
  const { courses, loading, error, refresh } = useDashboardCourses(shouldLoadCourses ? grado : null);

  const handleRefresh = useCallback(
    (targetGrade) => {
      if (!shouldLoadCourses) return;
      const next = parseGrado(targetGrade) || grado;
      refresh(next);
    },
    [refresh, grado, shouldLoadCourses],
  );

  const DashboardComponent = useMemo(() => DASHBOARD_COMPONENTS[role] || StudentDashboard, [role]);

  if (role === 'ESTUDIANTE') {
    return (
      <DashboardComponent
        user={user}
        courses={courses}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        onLogout={onLogout}
      />
    );
  }

  return <DashboardComponent user={user} onLogout={onLogout} />;
}

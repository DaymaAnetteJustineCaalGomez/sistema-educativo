// frontend/src/dashboard/Dashboard.jsx
import React from 'react';
import { getFirstName, getGradeLabel, parseGrado } from '../utils/user.js';

function DashboardHeader({ user, gradeLabel, onLogout }) {
  return (
    <div className="dashboard__top">
      <div>
        <span className="dashboard__brand">Sistema Educativo</span>
        <span className="dashboard__grade">{gradeLabel}</span>
      </div>
      <div className="dashboard__user">
        <div className="dashboard__user-info">
          <strong>{user?.name || user?.email}</strong>
          <span className="badge">{user?.role}</span>
        </div>
        <button className="btn-secondary" onClick={onLogout} type="button">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function DashboardHero({ gradeLabel, firstName, loading, onRefresh }) {
  return (
    <section className="dashboard__hero">
      <div>
        <p className="dashboard__eyebrow">Mis cursos CNB · {gradeLabel}</p>
        <h1>¡Hola, {firstName}!</h1>
        <p>Explora las áreas del Currículo Nacional Base y sigue tu progreso.</p>
      </div>
      <button className="btn-secondary" type="button" onClick={onRefresh} disabled={loading}>
        {loading ? 'Actualizando...' : 'Actualizar'}
      </button>
    </section>
  );
}

function DashboardRecommendation({ gradeLabel }) {
  return (
    <section className="dashboard__recommendation">
      <div className="dashboard__card">
        <span className="dashboard__pill">Recomendado para ti</span>
        <h2>{gradeLabel}</h2>
        <p>Aún no hay recomendaciones. Completa algunos subtemas para generarlas.</p>
      </div>
    </section>
  );
}

function CourseCard({ course }) {
  const competencias = course?.competenciasCount ?? 0;
  const recursos = course?.recursosCount ?? 0;
  const progreso = Math.round(course?.progreso ?? 0);
  const title = course?.titulo || course?.area || 'Área sin nombre';

  return (
    <article className="course-card" key={course?._id || title}>
      <div className="course-card__meta">
        <span>{competencias} competencias</span>
        <span className="course-card__dot">•</span>
        <span>{recursos} recursos</span>
      </div>
      <h3>{title}</h3>
      <p className="course-card__progress">Progreso general: {progreso}%</p>
      <button className="course-card__link" type="button">
        Ver contenidos
      </button>
    </article>
  );
}

function CourseGrid({ courses }) {
  return (
    <div className="course-grid">
      {courses.map((course) => (
        <CourseCard course={course} key={course?._id || course?.titulo || course?.area} />
      ))}
    </div>
  );
}

function DashboardCourses({ courses, loading, error, countLabel, onRefresh }) {
  let content = null;

  if (loading) {
    content = <div className="dashboard__status">Cargando cursos...</div>;
  } else if (error) {
    content = <div className="dashboard__status dashboard__status--error">{error}</div>;
  } else if (!courses.length) {
    content = <div className="dashboard__status">No encontramos cursos para este grado.</div>;
  } else {
    content = <CourseGrid courses={courses} />;
  }

  return (
    <>
      <div className="dashboard__section-header">
        <div>
          <h2>Cursos del CNB</h2>
          <p className="dashboard__section-subtitle">{countLabel}</p>
        </div>
        <button
          className="dashboard__see-all"
          type="button"
          onClick={onRefresh}
          disabled={loading}
        >
          Ver todo
        </button>
      </div>
      {content}
    </>
  );
}

export default function Dashboard({ user, courses, loading, error, onRefresh, onLogout }) {
  const grado = parseGrado(user?.grado) || 1;
  const gradeLabel = getGradeLabel(grado);
  const firstName = getFirstName(user);
  const hasCourses = courses.length > 0;
  const countLabel = hasCourses ? `${courses.length} áreas disponibles` : 'Sin cursos disponibles';

  return (
    <div className="dashboard">
      <DashboardHeader user={user} gradeLabel={gradeLabel} onLogout={onLogout} />
      <DashboardHero
        gradeLabel={gradeLabel}
        firstName={firstName}
        loading={loading}
        onRefresh={() => onRefresh(grado)}
      />
      <DashboardRecommendation gradeLabel={gradeLabel} />
      <section className="dashboard__courses">
        <DashboardCourses
          courses={courses}
          loading={loading}
          error={error}
          countLabel={countLabel}
          onRefresh={() => onRefresh(grado)}
        />
      </section>
    </div>
  );
}

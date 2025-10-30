// frontend/src/dashboard/StudentDashboard.jsx
import React, { useMemo, useState } from 'react';
import DashboardHeader from './components/DashboardHeader.jsx';
import { getFirstName, getGradeLabel, parseGrado } from '../utils/user.js';

function formatPercentage(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${Math.round(number)}%`;
}

function resolveCourseAverage(course) {
  const candidates = [
    course?.promedioGeneral,
    course?.promedio_general,
    course?.promedio,
    course?.progreso,
  ];
  for (const candidate of candidates) {
    const number = Number(candidate);
    if (Number.isFinite(number) && number >= 0) {
      return number;
    }
  }
  return 0;
}

function StudentMetrics({ metrics, sectionId }) {
  return (
    <section id={sectionId} className="student-section student-section--metrics">
      {metrics.map((metric) => (
        <article className="metric-card" key={metric.label}>
          <div className="metric-card__label">{metric.label}</div>
          <div className="metric-card__value">{metric.value}</div>
          {metric.hint ? <p className="metric-card__hint">{metric.hint}</p> : null}
        </article>
      ))}
    </section>
  );
}

function StudentRecommendations({ latest, history, sectionId }) {
  return (
    <section id={sectionId} className="student-section student-section--recommendations">
      <div className="student-recommendations__main">
        <div className="student-recommendations__pill">Recomendación destacada</div>
        <h2>{latest?.title || 'Completa tus cursos para recibir recomendaciones'}</h2>
        <p>
          {latest?.summary ||
            'Cuando avances en tus cursos, aquí verás sugerencias de contenidos que te ayudarán a reforzar tus aprendizajes.'}
        </p>
        {latest?.action ? (
          <button type="button" className="btn-primary-outline">
            {latest.action}
          </button>
        ) : null}
      </div>
      <div className="student-recommendations__history">
        <h3>Historial de recomendaciones</h3>
        {history.length ? (
          <ul>
            {history.map((item) => (
              <li key={item.id || item.title}>
                <span className="student-recommendations__history-title">{item.title}</span>
                <span className="student-recommendations__history-date">{item.date}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="student-empty">Aún no tienes recomendaciones previas.</p>
        )}
      </div>
    </section>
  );
}

function StudentCourseGrid({ courses, loading, error, onRefresh, sectionId }) {
  let content = null;

  if (loading) {
    content = <div className="student-status">Cargando cursos...</div>;
  } else if (error) {
    content = <div className="student-status student-status--error">{error}</div>;
  } else if (!courses.length) {
    content = <div className="student-status">No encontramos cursos para este grado.</div>;
  } else {
    content = (
      <div className="course-grid">
        {courses.map((course) => {
          const progress = Math.round(course?.progreso ?? 0);
          const competencias = course?.competenciasCount ?? course?.competencias ?? 0;
          const recursos = course?.recursosCount ?? course?.recursos ?? 0;
          const title = course?.titulo || course?.area || 'Área sin nombre';
          return (
            <article className="course-card" key={course?._id || title}>
              <header>
                <h3>{title}</h3>
                <p>{competencias} competencias · {recursos} recursos</p>
              </header>
              <div className="course-card__progress">
                <span>Progreso</span>
                <strong>{formatPercentage(progress)}</strong>
              </div>
              <button type="button" className="course-card__button">
                Ver contenidos
              </button>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <section id={sectionId} className="student-section student-section--courses">
      <div className="section-header">
        <div>
          <h2>Tablero de cursos</h2>
          <p>Explora las áreas del Currículo Nacional Base asignadas a tu grado.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>
      {content}
    </section>
  );
}

function StudentLimits({ attemptsLeft, totalAttempts, history, sectionId }) {
  return (
    <section id={sectionId} className="student-section student-section--limits">
      <div className="student-limits__attempts">
        <h3>Intentos disponibles</h3>
        <p>
          {attemptsLeft} de {totalAttempts} intentos restantes
        </p>
        <span className="student-limits__hint">
          Cada evaluación cuenta con un máximo de {totalAttempts} intentos.
        </span>
      </div>
      <div className="student-limits__history">
        <h3>Historial de progreso</h3>
        {history.length ? (
          <ul>
            {history.map((item) => (
              <li key={item.id || item.title}>
                <span>{item.title}</span>
                <span>{item.date}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="student-empty">Aún no has completado actividades registradas.</p>
        )}
      </div>
    </section>
  );
}

export default function StudentDashboard({ user, courses, loading, error, onRefresh, onLogout }) {
  const grado = parseGrado(user?.grado) || 1;
  const gradeLabel = getGradeLabel(grado);
  const firstName = getFirstName(user);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificacionesEmail ?? user?.emailNotifications ?? true,
  );

  const average = useMemo(() => {
    if (!courses.length) return 0;
    const total = courses.reduce((sum, course) => sum + resolveCourseAverage(course), 0);
    return total / courses.length;
  }, [courses]);

  const progress = useMemo(() => {
    if (!courses.length) return 0;
    const total = courses.reduce((sum, course) => sum + (Number(course?.progreso) || 0), 0);
    return total / courses.length;
  }, [courses]);

  const tasksCompleted = useMemo(() => {
    if (user?.tareasCompletas !== undefined) return user.tareasCompletas;
    return courses.reduce(
      (sum, course) => sum + (Number(course?.tareasCompletas ?? course?.tareasCompletadas) || 0),
      0,
    );
  }, [courses, user]);

  const latestRecommendation = useMemo(() => {
    const recs = user?.recomendaciones ?? user?.recommendations ?? [];
    if (Array.isArray(recs) && recs.length) {
      const [latest] = recs;
      return {
        title: latest?.titulo || latest?.title,
        summary: latest?.descripcion || latest?.summary,
        action: latest?.action || 'Revisar recomendación',
      };
    }
    return null;
  }, [user]);

  const recommendationHistory = useMemo(() => {
    const history = user?.historialRecomendaciones ?? user?.recommendationsHistory ?? [];
    if (!Array.isArray(history)) return [];
    return history.map((item, index) => ({
      id: item.id || index,
      title: item?.titulo || item?.title || 'Recomendación',
      date: item?.fecha || item?.date || '',
    }));
  }, [user]);

  const progressHistory = useMemo(() => {
    const history = user?.historialProgreso ?? user?.progressHistory ?? [];
    if (!Array.isArray(history)) return [];
    return history.map((item, index) => ({
      id: item.id || index,
      title: item?.titulo || item?.title || 'Actividad',
      date: item?.fecha || item?.date || '',
    }));
  }, [user]);

  const totalAttempts = Number(user?.intentosTotales) || 3;
  const attemptsLeft = Number(user?.intentosRestantes) || totalAttempts;

  const metrics = [
    {
      label: 'Promedio general',
      value: formatPercentage(average),
      hint: 'Basado en el avance registrado en tus cursos.',
    },
    {
      label: 'Progreso total',
      value: formatPercentage(progress),
      hint: 'Contenido completado del CNB para tu grado.',
    },
    {
      label: 'Tareas completas',
      value: tasksCompleted ? `${tasksCompleted}` : '—',
      hint: 'Actividades que has entregado con éxito.',
    },
  ];

  const handleRefresh = () => onRefresh?.(grado);

  return (
    <div className="dashboard dashboard--student">
      <DashboardHeader user={user} badge={gradeLabel} onLogout={onLogout} />
      <div className="dashboard-layout">
        <main className="dashboard-main">
          <StudentCourseGrid
            sectionId="tablero-cursos"
            courses={courses}
            loading={loading}
            error={error}
            onRefresh={handleRefresh}
          />

          <StudentMetrics sectionId="metricas" metrics={metrics} />

          <StudentRecommendations
            sectionId="recomendaciones"
            latest={latestRecommendation}
            history={recommendationHistory}
          />

          <StudentLimits
            sectionId="intentos"
            attemptsLeft={attemptsLeft}
            totalAttempts={totalAttempts}
            history={progressHistory}
          />
        </main>

        <aside className="dashboard-aside">
          <section className="dashboard-hero-card">
            <p className="dashboard-hero__eyebrow">Bienvenido(a) · {gradeLabel}</p>
            <h1>Hola, {firstName}</h1>
            <p>
              Revisa tu progreso general, completa nuevas actividades y mantente al día con las
              recomendaciones personalizadas.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar tablero'}
            </button>
          </section>

          <nav className="dashboard-menu" aria-label="Navegación del tablero">
            <h2>Menú rápido</h2>
            <ul>
              <li><a href="#tablero-cursos">Cursos</a></li>
              <li><a href="#metricas">Promedios</a></li>
              <li><a href="#recomendaciones">Recomendaciones</a></li>
              <li><a href="#intentos">Intentos</a></li>
            </ul>
          </nav>

          <section className="student-section student-section--notifications" id="notificaciones">
            <div>
              <h2>Notificaciones por correo electrónico</h2>
              <p>Recibe alertas cuando haya nuevas actividades o recomendaciones.</p>
            </div>
            <button
              type="button"
              className={`toggle ${notificationsEnabled ? 'toggle--on' : 'toggle--off'}`}
              onClick={() => setNotificationsEnabled((value) => !value)}
            >
              <span className="toggle__indicator" />
              {notificationsEnabled ? 'Activadas' : 'Desactivadas'}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

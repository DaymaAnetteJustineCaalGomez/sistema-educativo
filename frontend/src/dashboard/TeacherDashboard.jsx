// frontend/src/dashboard/TeacherDashboard.jsx
import React, { useCallback, useMemo } from 'react';
import DashboardHeader from './components/DashboardHeader.jsx';
import { getFirstName } from '../utils/user.js';

function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${Math.round(number)}%`;
}

function normalizeStudentRow(item, index) {
  return {
    id: item?.id || index,
    name: item?.nombre || item?.name || 'Estudiante sin nombre',
    average: formatPercent(item?.promedio ?? item?.average),
    coverage: formatPercent(item?.cobertura ?? item?.coverage),
    progress: formatPercent(item?.progreso ?? item?.progress),
    completions: item?.completados ?? item?.completed ?? '—',
    dropout: formatPercent(item?.abandono ?? item?.dropout),
    focus: item?.focoDebil || item?.weakSpot || '—',
    frequency: item?.frecuenciaUso || item?.usageFrequency || '—',
  };
}

const SAMPLE_STUDENTS = [
  {
    id: 'sample-1',
    name: 'Ejemplo: Ana López',
    average: formatPercent(92),
    coverage: formatPercent(86),
    progress: formatPercent(78),
    completions: 18,
    dropout: formatPercent(4),
    focus: 'Álgebra',
    frequency: 'Alta',
  },
  {
    id: 'sample-2',
    name: 'Ejemplo: Carlos Pérez',
    average: formatPercent(88),
    coverage: formatPercent(80),
    progress: formatPercent(72),
    completions: 15,
    dropout: formatPercent(6),
    focus: 'Comprensión lectora',
    frequency: 'Media',
  },
];

const SAMPLE_HISTORY = [
  {
    id: 'history-1',
    title: 'Entrega destacada',
    description: 'Ana López completó "Proyecto de fracciones" con calificación sobresaliente.',
    date: '12 de marzo',
  },
  {
    id: 'history-2',
    title: 'Seguimiento requerido',
    description: 'Carlos Pérez necesita repasar "Comprensión de lectura - Unidad 2".',
    date: '09 de marzo',
  },
  {
    id: 'history-3',
    title: 'Nueva recomendación enviada',
    description: 'Se asignó refuerzo de Álgebra para el grupo de Matemática.',
    date: '06 de marzo',
  },
];

function TeacherStudentHistory({ entries, sectionId }) {
  return (
    <section id={sectionId} className="teacher-section teacher-section--history">
      <header className="section-header">
        <div>
          <h2>Historial de estudiantes</h2>
          <p>Últimos eventos registrados por la clase.</p>
        </div>
      </header>
      {entries.length ? (
        <ul className="teacher-history__list">
          {entries.map((item) => (
            <li key={item.id}>
              <div className="teacher-history__date">{item.date}</div>
              <div className="teacher-history__content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="teacher-empty">Aún no hay eventos registrados.</p>
      )}
    </section>
  );
}

export default function TeacherDashboard({ user, onLogout }) {
  const report = user?.reporteEstudiantil || user?.studentReport || {};
  const focusAreas = useMemo(() => {
    const focos = user?.focosDebiles || user?.weakFocus || [];
    if (Array.isArray(focos) && focos.length) return focos;
    return ['Álgebra', 'Geometría', 'Comprensión lectora'];
  }, [user]);

  const history = useMemo(() => {
    const historial = user?.historialEstudiantes || user?.studentHistory || [];
    if (Array.isArray(historial) && historial.length) {
      return historial.map(normalizeStudentRow);
    }
    return SAMPLE_STUDENTS;
  }, [user]);

  const activityHistory = useMemo(() => {
    const events = user?.historialAprendizaje || user?.studentActivityHistory || [];
    if (Array.isArray(events) && events.length) {
      return events.map((item, index) => ({
        id: item.id || index,
        title: item?.titulo || item?.title || 'Evento',
        description: item?.descripcion || item?.description || 'Actualización registrada.',
        date: item?.fecha || item?.date || '',
      }));
    }
    return SAMPLE_HISTORY;
  }, [user]);

  const metrics = [
    {
      label: 'Promedio general',
      value: formatPercent(report?.promedioGeneral || report?.average),
      hint: 'Promedio consolidado de tu grupo.',
    },
    {
      label: 'Cobertura',
      value: formatPercent(report?.cobertura || report?.coverage),
      hint: 'Porcentaje de contenidos abordados.',
    },
    {
      label: 'Progreso activo',
      value: formatPercent(report?.progreso || report?.progress),
      hint: 'Avance promedio de los estudiantes.',
    },
    {
      label: 'Completados',
      value: report?.completados ?? report?.completed ?? '—',
      hint: 'Actividades finalizadas por la clase.',
    },
    {
      label: 'Abandono',
      value: formatPercent(report?.abandono || report?.dropout),
      hint: 'Porcentaje de actividades abandonadas.',
    },
  ];

  const frequency = useMemo(() => {
    const freq = user?.frecuenciaUso || user?.usageFrequency;
    if (!freq) {
      return [
        { label: 'Semanal', value: '4 sesiones' },
        { label: 'Diaria', value: '35 min promedio' },
      ];
    }
    if (Array.isArray(freq)) return freq;
    return Object.entries(freq).map(([label, value]) => ({ label, value }));
  }, [user]);

  const firstName = getFirstName(user);

  const handleDownloadReport = useCallback(() => {
    if (!history.length) return;
    const headers = [
      'Estudiante',
      'Promedio',
      'Cobertura',
      'Progreso',
      'Completados',
      'Abandono',
      'Foco débil',
      'Frecuencia',
    ];
    const rows = history.map((row) => [
      row.name,
      row.average,
      row.coverage,
      row.progress,
      row.completions,
      row.dropout,
      row.focus,
      row.frequency,
    ]);
    const csvContent = [headers, ...rows].map((line) => line.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'informe-estudiantil.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [history]);

  return (
    <div className="dashboard dashboard--teacher">
      <DashboardHeader user={user} onLogout={onLogout} badge="Docente" />

      <div className="dashboard-layout">
        <main className="dashboard-main">
          <section id="informe-estudiantil" className="teacher-section teacher-section--report">
            <header className="section-header">
              <div>
                <h2>Informe estudiantil</h2>
                <p>Promedios, coberturas, avances y focos de atención por estudiante.</p>
              </div>
              <span className="section-note">Datos ilustrativos mientras se sincroniza la información.</span>
            </header>
            <div className="teacher-table">
              <div className="teacher-table__head">
                <span>Estudiante</span>
                <span>Promedio</span>
                <span>Cobertura</span>
                <span>Progreso</span>
                <span>Completados</span>
                <span>Abandono</span>
                <span>Foco débil</span>
                <span>Frecuencia</span>
              </div>
              <div className="teacher-table__body">
                {history.map((row) => (
                  <div className="teacher-table__row" key={row.id}>
                    <span>{row.name}</span>
                    <span>{row.average}</span>
                    <span>{row.coverage}</span>
                    <span>{row.progress}</span>
                    <span>{row.completions}</span>
                    <span>{row.dropout}</span>
                    <span>{row.focus}</span>
                    <span>{row.frequency}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="metricas-docente" className="teacher-section teacher-section--metrics">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <div className="metric-card__label">{metric.label}</div>
                <div className="metric-card__value">{metric.value}</div>
                <p className="metric-card__hint">{metric.hint}</p>
              </article>
            ))}
          </section>

          <TeacherStudentHistory sectionId="historial-estudiantes" entries={activityHistory} />

          <section id="focos" className="teacher-section teacher-section--focus">
            <div className="teacher-focus">
              <h2>Focos débiles</h2>
              <p>Temas que requieren refuerzo adicional.</p>
              <ul>
                {focusAreas.map((focus) => (
                  <li key={focus}>{focus}</li>
                ))}
              </ul>
            </div>
            <div className="teacher-frequency">
              <h2>Frecuencia de uso</h2>
              <p>Seguimiento del tiempo de conexión y sesiones por periodo.</p>
              <ul>
                {frequency.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>

        <aside className="dashboard-aside">
          <section className="dashboard-hero-card dashboard-hero-card--teacher">
            <p className="dashboard-hero__eyebrow">Panel docente</p>
            <h1>Hola, {firstName}</h1>
            <p>
              Supervisa el aprendizaje de tus estudiantes, identifica focos débiles y descarga
              informes listos para compartir.
            </p>
            <button type="button" className="btn-primary" onClick={handleDownloadReport}>
              Descargar informe
            </button>
          </section>

          <nav className="dashboard-menu" aria-label="Navegación del tablero docente">
            <h2>Menú rápido</h2>
            <ul>
              <li><a href="#informe-estudiantil">Informe estudiantil</a></li>
              <li><a href="#metricas-docente">Indicadores</a></li>
              <li><a href="#historial-estudiantes">Historial</a></li>
              <li><a href="#focos">Focos y frecuencia</a></li>
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}

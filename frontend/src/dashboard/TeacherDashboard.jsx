// frontend/src/dashboard/TeacherDashboard.jsx
import React, { useMemo } from 'react';
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

  return (
    <div className="dashboard dashboard--teacher">
      <DashboardHeader user={user} onLogout={onLogout} badge="Docente" />

      <section className="dashboard-hero dashboard-hero--teacher">
        <div>
          <p className="dashboard-hero__eyebrow">Panel docente</p>
          <h1>Hola, {firstName}</h1>
          <p>
            Supervisa el aprendizaje de tus estudiantes, identifica focos débiles y recibe informes
            listos para compartir.
          </p>
        </div>
        <button type="button" className="btn-primary">Descargar informe</button>
      </section>

      <section className="teacher-section teacher-section--metrics">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div className="metric-card__label">{metric.label}</div>
            <div className="metric-card__value">{metric.value}</div>
            <p className="metric-card__hint">{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="teacher-section teacher-section--report">
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

      <section className="teacher-section teacher-section--focus">
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
    </div>
  );
}

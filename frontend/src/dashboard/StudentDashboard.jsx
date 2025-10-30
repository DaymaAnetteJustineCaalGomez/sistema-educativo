// frontend/src/dashboard/StudentDashboard.jsx
import React, { useCallback, useMemo, useState } from 'react';
import DashboardHeader from './components/DashboardHeader.jsx';
import { getFirstName, getGradeLabel, parseGrado } from '../utils/user.js';
import { api } from '../api.js';

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

function createSampleResources(areaName) {
  const subject = areaName || 'Área';
  const sampleUrl = 'https://aprende.mineduc.gob.gt';
  const exercises = [
    {
      title: `Cuestionario diagnóstico de ${subject}`,
      url: sampleUrl,
      type: 'Evaluación',
    },
    {
      title: `Taller interactivo de ${subject}`,
      url: sampleUrl,
      type: 'Práctica guiada',
    },
  ];
  return {
    videos: [
      {
        title: `${subject}: introducción guiada`,
        url: sampleUrl,
        duration: '06:00',
      },
      {
        title: `${subject}: actividades prácticas`,
        url: sampleUrl,
        duration: '08:30',
      },
    ],
    lecturas: [
      {
        title: `Guía de estudio de ${subject}`,
        url: sampleUrl,
        description: 'Resumen de contenidos clave alineados al CNB.',
      },
      {
        title: `Planificación semanal de ${subject}`,
        url: sampleUrl,
        description: 'Secuencia sugerida de sesiones y actividades evaluables.',
      },
    ],
    ejercicios: exercises,
    cuestionarios: exercises,
  };
}

function sentenceCase(text) {
  if (!text) return '';
  const trimmed = String(text).trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function splitSubtopics(text) {
  if (!text) return [];
  return String(text)
    .split(/[\.;•\n-]/)
    .map((item) => item.replace(/^[\s•-]+/, '').trim())
    .filter(Boolean)
    .map((item) => sentenceCase(item));
}

function createActivitiesForTopic(areaName, topicTitle, firstSubtopic) {
  const focus = firstSubtopic || topicTitle || areaName;
  const subject = areaName || 'el curso';
  return [
    {
      tipo: 'Actividad guiada',
      descripcion: `Crea un resumen visual sobre ${focus} usando los recursos del CNB de ${subject}.`,
    },
    {
      tipo: 'Evaluación rápida',
      descripcion: `Resuelve el cuestionario sugerido para confirmar qué tanto dominas ${focus} antes de continuar.`,
    },
  ];
}

function createFeedbackForTopic(topicTitle, areaName) {
  const focus = topicTitle || areaName || 'este tema';
  return `Si aún tienes dudas en ${focus}, revisa los videos y lecturas recomendadas y vuelve a intentar las actividades hasta lograr el dominio.`;
}

function assignResourcesToTopic(resources, index) {
  if (!resources) return {};
  const pick = (list) => {
    if (!Array.isArray(list) || !list.length) return [];
    const item = list[index % list.length];
    return item ? [item] : [];
  };
  return {
    videos: pick(resources.videos),
    lecturas: pick(resources.lecturas),
    cuestionarios: pick(resources.cuestionarios || resources.ejercicios),
  };
}

function buildFallbackTopics(areaName, resources) {
  const subject = areaName || 'Curso';
  return [
    {
      titulo: `${subject}: fundamentos`,
      subtitulos: ['Objetivos de aprendizaje', 'Conceptos clave', 'Vocabulario necesario'],
      recursos: assignResourcesToTopic(resources, 0),
      actividades: createActivitiesForTopic(subject, `${subject}: fundamentos`, 'conceptos clave'),
      retroalimentacion: createFeedbackForTopic(`${subject}: fundamentos`, subject),
    },
    {
      titulo: `${subject}: aplicación práctica`,
      subtitulos: ['Resolución de ejercicios', 'Trabajo colaborativo', 'Autoevaluación'],
      recursos: assignResourcesToTopic(resources, 1),
      actividades: createActivitiesForTopic(subject, `${subject}: aplicación práctica`, 'resolución de ejercicios'),
      retroalimentacion: createFeedbackForTopic(`${subject}: aplicación práctica`, subject),
    },
  ];
}

function createTopicsFromCompetencias({ areaName, competencias, resources }) {
  if (!Array.isArray(competencias) || !competencias.length) {
    return buildFallbackTopics(areaName, resources);
  }

  return competencias.map((comp, index) => {
    const subtitulos = splitSubtopics(comp?.enunciado);
    const tituloBase = comp?.codigo
      ? `${comp.codigo} · ${sentenceCase(subtitulos[0] || comp.enunciado)}`
      : null;
    const titulo = tituloBase || sentenceCase(comp?.enunciado) || `Tema ${index + 1}`;
    return {
      id: comp?.id || comp?._id || index,
      codigo: comp?.codigo || null,
      titulo,
      subtitulos,
      recursos: assignResourcesToTopic(resources, index),
      actividades: createActivitiesForTopic(areaName, titulo, subtitulos[0]),
      retroalimentacion: createFeedbackForTopic(titulo, areaName),
    };
  });
}

function buildGeneralActivities(topics, areaName) {
  if (!Array.isArray(topics) || !topics.length) return [];
  const subject = areaName || 'el curso';
  return topics.slice(0, 3).map((topic, index) => ({
    tipo: `Seguimiento ${index + 1}`,
    descripcion: `Comparte cómo aplicaste "${topic.titulo}" y qué necesitas reforzar antes de avanzar en ${subject}.`,
  }));
}

function createGeneralFeedback(areaName) {
  const subject = areaName || 'el curso';
  return `Refuerza tus aprendizajes repasando las lecturas y videos del CNB cuando lo necesites. Domina cada tema antes de continuar con ${subject}.`;
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

function CourseContentPage({ course, content, loading, error, onBack, onRetry }) {
  if (!course) return null;

  const title = course?.titulo || course?.area || 'Área sin nombre';
  const description =
    content?.descripcion || course?.descripcion || `Recursos disponibles para ${title}.`;
  const competencias = Array.isArray(content?.competencias) ? content.competencias : [];
  const topics = Array.isArray(content?.temas) ? content.temas : [];
  const generalActivities = Array.isArray(content?.actividades) ? content.actividades : [];
  const courseVideos = content?.recursos?.videos || [];
  const courseLecturas = content?.recursos?.lecturas || [];
  const courseCuestionarios =
    content?.recursos?.cuestionarios || content?.recursos?.ejercicios || [];
  const totalRecursos = courseVideos.length + courseLecturas.length + courseCuestionarios.length;

  return (
    <div className="course-page">
      <section className="course-page__hero">
        <button type="button" className="course-page__back" onClick={onBack}>
          ← Volver al tablero
        </button>
        <div className="course-page__hero-body">
          <p className="course-page__eyebrow">Contenidos del CNB</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="course-page__hero-metrics">
          <div className="course-page__metric">
            <span className="course-page__metric-label">Competencias</span>
            <span className="course-page__metric-value">{competencias.length}</span>
          </div>
          <div className="course-page__metric">
            <span className="course-page__metric-label">Recursos</span>
            <span className="course-page__metric-value">{totalRecursos}</span>
          </div>
        </div>
      </section>

      <div className="course-page__layout">
        <aside className="course-page__sidebar">
          <nav aria-label="Navegación del contenido">
            <h2>Secciones</h2>
            <ul>
              <li>
                <a href="#course-descripcion">Descripción</a>
              </li>
              <li>
                <a href="#course-competencias">Competencias</a>
              </li>
              <li>
                <a href="#course-temas">Temas</a>
              </li>
              <li>
                <a href="#course-recursos">Recursos</a>
              </li>
              <li>
                <a href="#course-actividades">Actividades</a>
              </li>
              <li>
                <a href="#course-retro">Retroalimentación</a>
              </li>
            </ul>
          </nav>
          <div className="course-page__summary">
            <h3>Resumen rápido</h3>
            <p>
              Explora los recursos alineados al Currículo Nacional Base, revisa los temas y completa las
              actividades para avanzar con seguridad.
            </p>
          </div>
        </aside>

        <main className="course-page__content">
          {loading ? (
            <div className="course-page__status">Cargando contenidos...</div>
          ) : error ? (
            <div className="course-page__status course-page__status--error">
              <p>{error}</p>
              <button type="button" className="btn-secondary" onClick={onRetry}>
                Reintentar
              </button>
            </div>
          ) : !content ? (
            <div className="course-page__status">No se encontraron detalles para este curso.</div>
          ) : (
            <>
              <section id="course-descripcion" className="course-page__section">
                <h2>Descripción del curso</h2>
                <p>{description}</p>
              </section>

              <section id="course-competencias" className="course-page__section">
                <h2>Competencias</h2>
                {competencias.length ? (
                  <ul className="course-page__list course-page__list--competencias">
                    {competencias.map((item) => (
                      <li key={item.id || item.codigo || item.enunciado}>
                        {item.codigo ? <strong>{item.codigo}</strong> : null}
                        <span>{item.enunciado}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="student-empty">Aún no hay competencias registradas para este grado.</p>
                )}
              </section>

              <section id="course-temas" className="course-page__section">
                <h2>Temas y subtemas</h2>
                {topics.length ? (
                  <div className="course-topics">
                    {topics.map((topic, index) => {
                      const videos = topic?.recursos?.videos || [];
                      const lecturas = topic?.recursos?.lecturas || [];
                      const cuestionarios = topic?.recursos?.cuestionarios || [];
                      return (
                        <article className="course-topic" key={topic.id || topic.titulo || index}>
                          <div className="course-topic__header">
                            <h3>{topic.titulo}</h3>
                            {topic.codigo ? <span className="course-topic__code">{topic.codigo}</span> : null}
                          </div>

                          {topic.subtitulos?.length ? (
                            <div className="course-topic__subtopics">
                              <h4>Subtemas</h4>
                              <ul>
                                {topic.subtitulos.map((sub) => (
                                  <li key={sub}>{sub}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          <div className="course-topic__resources">
                            <div className="course-topic__resource-group">
                              <h4>Videos</h4>
                              {videos.length ? (
                                <ul>
                                  {videos.map((video) => (
                                    <li key={video.title}>
                                      <span className="resource-title">{video.title}</span>
                                      {video.duration ? (
                                        <span className="resource-meta">{video.duration}</span>
                                      ) : null}
                                      <a
                                        href={video.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="link-inline"
                                      >
                                        Ver video
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="student-empty">Agrega videos recomendados para complementar este tema.</p>
                              )}
                            </div>

                            <div className="course-topic__resource-group">
                              <h4>Lecturas</h4>
                              {lecturas.length ? (
                                <ul>
                                  {lecturas.map((item) => (
                                    <li key={item.title}>
                                      <span className="resource-title">{item.title}</span>
                                      {item.description ? (
                                        <span className="resource-meta">{item.description}</span>
                                      ) : null}
                                      <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="link-inline"
                                      >
                                        Abrir recurso
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="student-empty">Incluye lecturas o guías de apoyo para reforzar este contenido.</p>
                              )}
                            </div>

                            <div className="course-topic__resource-group">
                              <h4>Cuestionarios</h4>
                              {cuestionarios.length ? (
                                <ul>
                                  {cuestionarios.map((item) => (
                                    <li key={item.title}>
                                      <span className="resource-title">{item.title}</span>
                                      {item.type ? <span className="resource-meta">{item.type}</span> : null}
                                      <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="link-inline"
                                      >
                                        Resolver
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="student-empty">Incluye evaluaciones para medir tu comprensión.</p>
                              )}
                            </div>
                          </div>

                          {topic.actividades?.length ? (
                            <div className="course-topic__activities">
                              <h4>Actividades sugeridas</h4>
                              <ul>
                                {topic.actividades.map((activity) => (
                                  <li key={activity.descripcion}>
                                    <strong>{activity.tipo}</strong>
                                    <span>{activity.descripcion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {topic.retroalimentacion ? (
                            <div className="course-topic__feedback">
                              <h4>Retroalimentación</h4>
                              <p>{topic.retroalimentacion}</p>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="student-empty">Pronto verás los temas del CNB organizados aquí.</p>
                )}
              </section>

              <section id="course-recursos" className="course-page__section">
                <h2>Recursos del curso</h2>
                <div className="course-detail__resource-columns">
                  <div>
                    <h3>Videos</h3>
                    {courseVideos.length ? (
                      <ul>
                        {courseVideos.map((video) => (
                          <li key={video.title}>
                            <div>
                              <span className="resource-title">{video.title}</span>
                              {video.duration ? <span className="resource-meta">{video.duration}</span> : null}
                            </div>
                            <a href={video.url} target="_blank" rel="noreferrer" className="link-inline">
                              Ver video
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="student-empty">Pronto encontrarás videos sugeridos aquí.</p>
                    )}
                  </div>
                  <div>
                    <h3>Lecturas y guías</h3>
                    {courseLecturas.length ? (
                      <ul>
                        {courseLecturas.map((item) => (
                          <li key={item.title}>
                            <div>
                              <span className="resource-title">{item.title}</span>
                              {item.description ? <span className="resource-meta">{item.description}</span> : null}
                            </div>
                            <a href={item.url} target="_blank" rel="noreferrer" className="link-inline">
                              Abrir recurso
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="student-empty">Agrega lecturas y guías desde tu biblioteca.</p>
                    )}
                  </div>
                  <div>
                    <h3>Cuestionarios</h3>
                    {courseCuestionarios.length ? (
                      <ul>
                        {courseCuestionarios.map((item) => (
                          <li key={item.title}>
                            <div>
                              <span className="resource-title">{item.title}</span>
                              {item.type ? <span className="resource-meta">{item.type}</span> : null}
                            </div>
                            <a href={item.url} target="_blank" rel="noreferrer" className="link-inline">
                              Resolver
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="student-empty">Integra evaluaciones y prácticas desde tu plan de clase.</p>
                    )}
                  </div>
                </div>
              </section>

              {generalActivities.length ? (
                <section id="course-actividades" className="course-page__section">
                  <h2>Actividades de seguimiento</h2>
                  <ul className="course-page__list">
                    {generalActivities.map((activity, index) => (
                      <li key={activity.descripcion || index}>
                        <strong>{activity.tipo}</strong>
                        <span>{activity.descripcion}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {content.retroalimentacion ? (
                <section id="course-retro" className="course-page__section">
                  <h2>Retroalimentación recomendada</h2>
                  <p>{content.retroalimentacion}</p>
                </section>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function StudentCourseGrid({
  courses,
  loading,
  error,
  onRefresh,
  onViewContent,
  sectionId,
  loadingCourseId,
}) {
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
              <button
                type="button"
                className="course-card__button"
                onClick={() => onViewContent?.(course)}
                disabled={loadingCourseId === (course?._id || course?.slug || title)}
              >
                Ver contenido
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

function StudentAttempts({ attemptsLeft, totalAttempts, sectionId }) {
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
      <div className="student-limits__reminder">
        <h3>Recordatorio rápido</h3>
        <p>
          Usa tus intentos con estrategia y revisa las recomendaciones antes de intentar una evaluación
          nuevamente.
        </p>
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
  const [viewMode, setViewMode] = useState('dashboard');
  const [loadingCourseId, setLoadingCourseId] = useState(null);

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

  const [activeCourse, setActiveCourse] = useState(null);
  const [courseContent, setCourseContent] = useState(null);
  const [courseContentLoading, setCourseContentLoading] = useState(false);
  const [courseContentError, setCourseContentError] = useState('');

  const handleLoadContent = useCallback(
    async (course) => {
      if (!course) return;

      const courseId = course?._id || course?.slug || course?.area || course?.titulo;
      setViewMode('course');
      setActiveCourse(course);
      setCourseContent(null);
      setCourseContentError('');
      setCourseContentLoading(true);
      setLoadingCourseId(courseId || null);

      const areaId = course?._id || course?.slug;
      if (!areaId) {
        setCourseContentError('No se pudo identificar el curso seleccionado.');
        setCourseContentLoading(false);
        setLoadingCourseId(null);
        return;
      }

      try {
        const payload = await api.cursoContenido(grado, areaId);
        const sample = createSampleResources(course?.titulo || course?.area);
        const safeCompetencias = Array.isArray(payload?.competencias)
          ? payload.competencias
          : [];
        const safeRecursos = payload?.recursos || {};
        const courseName = course?.titulo || course?.area;
        const recursos = {
          videos:
            Array.isArray(safeRecursos.videos) && safeRecursos.videos.length
              ? safeRecursos.videos
              : sample.videos,
          lecturas:
            Array.isArray(safeRecursos.lecturas) && safeRecursos.lecturas.length
              ? safeRecursos.lecturas
              : sample.lecturas,
          ejercicios:
            Array.isArray(safeRecursos.ejercicios) && safeRecursos.ejercicios.length
              ? safeRecursos.ejercicios
              : sample.ejercicios,
          cuestionarios:
            Array.isArray(safeRecursos.cuestionarios) && safeRecursos.cuestionarios.length
              ? safeRecursos.cuestionarios
              : sample.cuestionarios,
        };

        const providedTopics = Array.isArray(payload?.temas) ? payload.temas : [];
        const baseTopics = providedTopics.length
          ? providedTopics
          : createTopicsFromCompetencias({ areaName: courseName, competencias: safeCompetencias, resources: recursos });

        const normalizedTopics = baseTopics.map((topic, index) => {
          const subtitulos = Array.isArray(topic?.subtitulos) ? topic.subtitulos : [];
          const topicResources = topic?.recursos || {};
          const fallbackResources = assignResourcesToTopic(recursos, index);
          return {
            id: topic?.id || topic?.codigo || index,
            codigo: topic?.codigo || null,
            titulo: topic?.titulo || `Tema ${index + 1}`,
            subtitulos,
            recursos: {
              videos:
                Array.isArray(topicResources.videos) && topicResources.videos.length
                  ? topicResources.videos
                  : fallbackResources.videos,
              lecturas:
                Array.isArray(topicResources.lecturas) && topicResources.lecturas.length
                  ? topicResources.lecturas
                  : fallbackResources.lecturas,
              cuestionarios:
                Array.isArray(topicResources.cuestionarios) && topicResources.cuestionarios.length
                  ? topicResources.cuestionarios
                  : fallbackResources.cuestionarios,
            },
            actividades:
              Array.isArray(topic?.actividades) && topic.actividades.length
                ? topic.actividades
                : createActivitiesForTopic(courseName, topic?.titulo || `Tema ${index + 1}`, subtitulos[0]),
            retroalimentacion:
              topic?.retroalimentacion || createFeedbackForTopic(topic?.titulo || `Tema ${index + 1}`, courseName),
          };
        });

        const generalActivities =
          Array.isArray(payload?.actividades) && payload.actividades.length
            ? payload.actividades
            : buildGeneralActivities(normalizedTopics, courseName);

        const generalFeedback = payload?.retroalimentacion || createGeneralFeedback(courseName);

        setCourseContent({
          titulo: payload?.titulo || courseName,
          descripcion:
            payload?.descripcion ||
            course?.descripcion ||
            `Recursos disponibles para ${courseName}.`,
          competencias: safeCompetencias,
          recursos,
          temas: normalizedTopics,
          actividades: generalActivities,
          retroalimentacion: generalFeedback,
        });
      } catch (err) {
        setCourseContentError(err.message || 'No se pudieron cargar los contenidos.');
      } finally {
        setCourseContentLoading(false);
        setLoadingCourseId(null);
      }
    },
    [grado],
  );

  const handleBackToDashboard = useCallback(() => {
    setViewMode('dashboard');
    setActiveCourse(null);
    setCourseContent(null);
    setCourseContentError('');
    setCourseContentLoading(false);
    setLoadingCourseId(null);
  }, []);

  const handleRetryContent = useCallback(() => {
    if (activeCourse) {
      handleLoadContent(activeCourse);
    }
  }, [activeCourse, handleLoadContent]);

  if (viewMode === 'course' && activeCourse) {
    return (
      <div className="dashboard dashboard--student">
        <DashboardHeader user={user} badge={gradeLabel} onLogout={onLogout} />
        <CourseContentPage
          course={activeCourse}
          content={courseContent}
          loading={courseContentLoading}
          error={courseContentError}
          onBack={handleBackToDashboard}
          onRetry={handleRetryContent}
        />
      </div>
    );
  }

  return (
    <div className="dashboard dashboard--student">
      <DashboardHeader user={user} badge={gradeLabel} onLogout={onLogout} />
      <div className="dashboard-layout dashboard-layout--student">
        <aside className="dashboard-aside dashboard-aside--student">
          <section className="dashboard-hero-card">
            <p className="dashboard-hero__eyebrow">Bienvenido(a) · {gradeLabel}</p>
            <h1>Hola, {firstName}</h1>
            <p>
              Revisa tu progreso general, completa nuevas actividades y mantente al día con las
              recomendaciones personalizadas.
            </p>
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

        <main className="dashboard-main">
          <StudentCourseGrid
            sectionId="tablero-cursos"
            courses={courses}
            loading={loading}
            error={error}
            onRefresh={handleRefresh}
            onViewContent={handleLoadContent}
            loadingCourseId={loadingCourseId}
          />

          <StudentMetrics sectionId="metricas" metrics={metrics} />

          <StudentRecommendations
            sectionId="recomendaciones"
            latest={latestRecommendation}
            history={recommendationHistory}
          />

          <StudentAttempts
            sectionId="intentos"
            attemptsLeft={attemptsLeft}
            totalAttempts={totalAttempts}
          />
        </main>
      </div>
    </div>
  );
}

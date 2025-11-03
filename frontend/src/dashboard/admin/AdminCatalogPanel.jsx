// frontend/src/dashboard/admin/AdminCatalogPanel.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';

const emptyBucket = () => ({
  videos: [],
  lecturas: [],
  ejercicios: [],
  cuestionarios: [],
  otros: [],
});

const mapResourceForForm = (resource, tipo) => ({
  titulo: resource?.titulo || resource?.title || '',
  url: resource?.url || '',
  descripcion: resource?.descripcion || resource?.description || '',
  duracion: resource?.duracion || resource?.duration || '',
  proveedor: resource?.proveedor || resource?.provider || '',
  tipo: tipo || resource?.tipo || '',
});

const normalizeTopic = (topic = {}) => ({
  titulo: topic?.titulo || '',
  descripcion: topic?.descripcion || '',
  subtitulos: Array.isArray(topic?.subtitulos) ? topic.subtitulos : [],
  indicadorIds: Array.isArray(topic?.indicadorIds)
    ? topic.indicadorIds.map((id) => String(id))
    : [],
  recursos: (() => {
    const bucket = emptyBucket();
    for (const key of Object.keys(bucket)) {
      bucket[key] = Array.isArray(topic?.recursos?.[key])
        ? topic.recursos[key].map((item) => mapResourceForForm(item, key.slice(0, -1)))
        : [];
    }
    return bucket;
  })(),
  actividades: Array.isArray(topic?.actividades) ? topic.actividades : [],
  retroalimentacion: topic?.retroalimentacion || '',
});

const normalizeDraft = (contenido) => ({
  descripcion: contenido?.descripcion || '',
  recursosGenerales: (() => {
    const bucket = emptyBucket();
    for (const key of Object.keys(bucket)) {
      bucket[key] = Array.isArray(contenido?.recursosGenerales?.[key])
        ? contenido.recursosGenerales[key].map((item) => mapResourceForForm(item, key.slice(0, -1)))
        : [];
    }
    return bucket;
  })(),
  temas: Array.isArray(contenido?.temas) ? contenido.temas.map((topic) => normalizeTopic(topic)) : [],
  actividadesGenerales: Array.isArray(contenido?.actividadesGenerales)
    ? contenido.actividadesGenerales
    : [],
  retroalimentacionGeneral: contenido?.retroalimentacionGeneral || '',
});

const RESOURCE_LABELS = {
  videos: 'Videos',
  lecturas: 'Lecturas',
  ejercicios: 'Ejercicios',
  cuestionarios: 'Cuestionarios',
  otros: 'Otros recursos',
};

const GRADES = [
  { value: '1', label: '1° Básico' },
  { value: '2', label: '2° Básico' },
  { value: '3', label: '3° Básico' },
];

export default function AdminCatalogPanel({ active }) {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('1');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState(normalizeDraft(null));
  const [baseInfo, setBaseInfo] = useState({ area: null, competencias: [], indicadores: [], recursos: emptyBucket() });

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const fetchAreas = async () => {
      try {
        const response = await api.admin.catalogAreas();
        if (cancelled) return;
        const list = Array.isArray(response?.areas) ? response.areas : [];
        setAreas(list);
        if (!selectedArea && list.length) {
          setSelectedArea(String(list[0]._id || list[0].id || list[0].slug));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudieron cargar las áreas.');
      }
    };
    fetchAreas();
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!active || !selectedArea) return;
    let cancelled = false;
    const fetchContent = async () => {
      setLoading(true);
      setError('');
      setStatus('');
      try {
        const response = await api.admin.catalogContent(selectedArea, selectedGrade);
        if (cancelled) return;
        setBaseInfo({
          area: response?.area || null,
          competencias: Array.isArray(response?.competencias) ? response.competencias : [],
          indicadores: Array.isArray(response?.indicadores) ? response.indicadores : [],
          recursos: response?.recursos || emptyBucket(),
        });
        setDraft(normalizeDraft(response?.contenido || null));
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudieron cargar los contenidos.');
          setDraft(normalizeDraft(null));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchContent();
    return () => {
      cancelled = true;
    };
  }, [active, selectedArea, selectedGrade]);

  const handleBucketChange = (bucketKey, index, field, value) => {
    setDraft((prev) => {
      const bucket = Array.isArray(prev.recursosGenerales[bucketKey])
        ? [...prev.recursosGenerales[bucketKey]]
        : [];
      bucket[index] = { ...bucket[index], [field]: value };
      return {
        ...prev,
        recursosGenerales: {
          ...prev.recursosGenerales,
          [bucketKey]: bucket,
        },
      };
    });
  };

  const handleAddBucketResource = (bucketKey) => {
    setDraft((prev) => ({
      ...prev,
      recursosGenerales: {
        ...prev.recursosGenerales,
        [bucketKey]: [
          ...(Array.isArray(prev.recursosGenerales[bucketKey])
            ? prev.recursosGenerales[bucketKey]
            : []),
          mapResourceForForm(null, bucketKey.slice(0, -1)),
        ],
      },
    }));
  };

  const handleRemoveBucketResource = (bucketKey, index) => {
    setDraft((prev) => {
      const bucket = Array.isArray(prev.recursosGenerales[bucketKey])
        ? prev.recursosGenerales[bucketKey].filter((_, idx) => idx !== index)
        : [];
      return {
        ...prev,
        recursosGenerales: {
          ...prev.recursosGenerales,
          [bucketKey]: bucket,
        },
      };
    });
  };

  const handleTopicChange = (index, field, value) => {
    setDraft((prev) => {
      const topics = [...prev.temas];
      topics[index] = { ...topics[index], [field]: value };
      return { ...prev, temas: topics };
    });
  };

  const handleTopicSubtopicsChange = (index, value) => {
    const lines = value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    handleTopicChange(index, 'subtitulos', lines);
  };

  const handleTopicIndicatorsChange = (index, selectedOptions) => {
    const values = Array.from(selectedOptions).map((option) => option.value);
    handleTopicChange(index, 'indicadorIds', values);
  };

  const handleTopicResourceChange = (topicIndex, bucketKey, resourceIndex, field, value) => {
    setDraft((prev) => {
      const topics = [...prev.temas];
      const bucket = Array.isArray(topics[topicIndex].recursos[bucketKey])
        ? [...topics[topicIndex].recursos[bucketKey]]
        : [];
      bucket[resourceIndex] = { ...bucket[resourceIndex], [field]: value };
      topics[topicIndex] = {
        ...topics[topicIndex],
        recursos: {
          ...topics[topicIndex].recursos,
          [bucketKey]: bucket,
        },
      };
      return { ...prev, temas: topics };
    });
  };

  const handleAddTopicResource = (topicIndex, bucketKey) => {
    setDraft((prev) => {
      const topics = [...prev.temas];
      const bucket = Array.isArray(topics[topicIndex].recursos[bucketKey])
        ? topics[topicIndex].recursos[bucketKey]
        : [];
      topics[topicIndex] = {
        ...topics[topicIndex],
        recursos: {
          ...topics[topicIndex].recursos,
          [bucketKey]: [...bucket, mapResourceForForm(null, bucketKey.slice(0, -1))],
        },
      };
      return { ...prev, temas: topics };
    });
  };

  const handleRemoveTopicResource = (topicIndex, bucketKey, resourceIndex) => {
    setDraft((prev) => {
      const topics = [...prev.temas];
      const bucket = Array.isArray(topics[topicIndex].recursos[bucketKey])
        ? topics[topicIndex].recursos[bucketKey].filter((_, idx) => idx !== resourceIndex)
        : [];
      topics[topicIndex] = {
        ...topics[topicIndex],
        recursos: {
          ...topics[topicIndex].recursos,
          [bucketKey]: bucket,
        },
      };
      return { ...prev, temas: topics };
    });
  };

  const handleAddTopic = () => {
    setDraft((prev) => ({
      ...prev,
      temas: [
        ...prev.temas,
        normalizeTopic({ titulo: `Nuevo tema ${prev.temas.length + 1}` }),
      ],
    }));
  };

  const handleRemoveTopic = (index) => {
    setDraft((prev) => ({
      ...prev,
      temas: prev.temas.filter((_, idx) => idx !== index),
    }));
  };

  const handleAddGeneralActivity = () => {
    setDraft((prev) => ({
      ...prev,
      actividadesGenerales: [
        ...prev.actividadesGenerales,
        { tipo: 'Seguimiento', descripcion: 'Describe la actividad a realizar.' },
      ],
    }));
  };

  const handleGeneralActivityChange = (index, field, value) => {
    setDraft((prev) => {
      const activities = [...prev.actividadesGenerales];
      activities[index] = { ...activities[index], [field]: value };
      return { ...prev, actividadesGenerales: activities };
    });
  };

  const handleRemoveGeneralActivity = (index) => {
    setDraft((prev) => ({
      ...prev,
      actividadesGenerales: prev.actividadesGenerales.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = async () => {
    if (!selectedArea) return;
    setSaving(true);
    setStatus('');
    setError('');
    try {
      const payload = {
        descripcion: draft.descripcion,
        recursosGenerales: draft.recursosGenerales,
        temas: draft.temas,
        actividadesGenerales: draft.actividadesGenerales,
        retroalimentacionGeneral: draft.retroalimentacionGeneral,
      };
      await api.admin.saveCatalogContent(selectedArea, selectedGrade, payload);
      setStatus('Catálogo actualizado correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo guardar el catálogo.');
    } finally {
      setSaving(false);
    }
  };

  const indicadorOptions = useMemo(() => {
    return baseInfo.indicadores.map((indicador) => ({
      value: indicador._id ? String(indicador._id) : String(indicador.id),
      label: `${indicador.codigo || 'Indicador'} · ${indicador.descripcion || ''}`.trim(),
    }));
  }, [baseInfo.indicadores]);

  return (
    <div className="admin-panel admin-panel--catalog">
      <header className="admin-panel__header">
        <div>
          <h2>Catálogo de contenidos</h2>
          <p>Administra los temas, subtemas y recursos asociados a cada área del CNB.</p>
        </div>
        <div className="admin-panel__actions">
          <select value={selectedArea} onChange={(event) => setSelectedArea(event.target.value)}>
            {areas.map((area) => {
              const id = area._id || area.id || area.slug;
              return (
                <option key={id} value={id}>
                  {area.nombre}
                </option>
              );
            })}
          </select>
          <select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)}>
            {GRADES.map((grade) => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}
      {status ? <p className="admin-status">{status}</p> : null}

      {loading ? (
        <p className="admin-loading">Cargando información del catálogo...</p>
      ) : (
        <>
          <section className="admin-panel__section admin-panel__section--description">
            <h3>Descripción detallada</h3>
            <textarea
              rows={3}
              value={draft.descripcion}
              onChange={(event) => setDraft((prev) => ({ ...prev, descripcion: event.target.value }))}
              placeholder="Describe los objetivos del área y el alcance para este grado."
            />
          </section>

          <section className="admin-panel__section admin-panel__section--resources">
            <h3>Recursos generales</h3>
            <p>
              Vincula recursos oficiales o materiales de apoyo para todo el curso. Puedes agregar videos, lecturas, ejercicios y
              cuestionarios.
            </p>
            {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
              <div className="admin-resource-group" key={key}>
                <header>
                  <h4>{label}</h4>
                  <button type="button" className="btn-link" onClick={() => handleAddBucketResource(key)}>
                    Agregar
                  </button>
                </header>
                {draft.recursosGenerales[key]?.length ? (
                  draft.recursosGenerales[key].map((resource, index) => (
                    <div className="admin-resource-item" key={`${key}-${index}`}>
                      <input
                        type="text"
                        value={resource.titulo}
                        placeholder="Título del recurso"
                        onChange={(event) => handleBucketChange(key, index, 'titulo', event.target.value)}
                        required
                      />
                      <input
                        type="url"
                        value={resource.url}
                        placeholder="https://..."
                        onChange={(event) => handleBucketChange(key, index, 'url', event.target.value)}
                        required
                      />
                      <input
                        type="text"
                        value={resource.descripcion}
                        placeholder="Descripción breve"
                        onChange={(event) => handleBucketChange(key, index, 'descripcion', event.target.value)}
                      />
                      <div className="admin-resource-actions">
                        <input
                          type="text"
                          value={resource.duracion}
                          placeholder="Duración"
                          onChange={(event) => handleBucketChange(key, index, 'duracion', event.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => handleRemoveBucketResource(key, index)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="admin-empty">Aún no has agregado {label.toLowerCase()}.</p>
                )}
              </div>
            ))}
          </section>

          <section className="admin-panel__section admin-panel__section--topics">
            <header>
              <h3>Temas y subtemas</h3>
              <button type="button" className="btn-secondary" onClick={handleAddTopic}>
                Añadir tema
              </button>
            </header>
            {draft.temas.length ? (
              draft.temas.map((topic, index) => (
                <article className="admin-topic" key={`topic-${index}`}>
                  <header>
                    <div>
                      <label>
                        Título del tema
                        <input
                          type="text"
                          value={topic.titulo}
                          onChange={(event) => handleTopicChange(index, 'titulo', event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Retroalimentación
                        <input
                          type="text"
                          value={topic.retroalimentacion}
                          onChange={(event) => handleTopicChange(index, 'retroalimentacion', event.target.value)}
                        />
                      </label>
                    </div>
                    <button type="button" className="btn-link" onClick={() => handleRemoveTopic(index)}>
                      Quitar tema
                    </button>
                  </header>
                  <label>
                    Subtemas
                    <textarea
                      rows={3}
                      value={topic.subtitulos.join('\n')}
                      onChange={(event) => handleTopicSubtopicsChange(index, event.target.value)}
                      placeholder="Escribe cada subtema en una línea distinta"
                    />
                  </label>
                  <label>
                    Indicadores vinculados
                    <select
                      multiple
                      value={topic.indicadorIds}
                      onChange={(event) => handleTopicIndicatorsChange(index, event.target.selectedOptions)}
                    >
                      {indicadorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="admin-topic-resources">
                    {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
                      <div className="admin-resource-group" key={`${key}-${index}`}>
                        <header>
                          <h4>{label}</h4>
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => handleAddTopicResource(index, key)}
                          >
                            Agregar
                          </button>
                        </header>
                        {topic.recursos[key]?.length ? (
                          topic.recursos[key].map((resource, resourceIndex) => (
                            <div className="admin-resource-item" key={`${key}-${index}-${resourceIndex}`}>
                              <input
                                type="text"
                                value={resource.titulo}
                                placeholder="Título del recurso"
                                onChange={(event) =>
                                  handleTopicResourceChange(index, key, resourceIndex, 'titulo', event.target.value)
                                }
                                required
                              />
                              <input
                                type="url"
                                value={resource.url}
                                placeholder="https://..."
                                onChange={(event) =>
                                  handleTopicResourceChange(index, key, resourceIndex, 'url', event.target.value)
                                }
                                required
                              />
                              <input
                                type="text"
                                value={resource.descripcion}
                                placeholder="Descripción breve"
                                onChange={(event) =>
                                  handleTopicResourceChange(index, key, resourceIndex, 'descripcion', event.target.value)
                                }
                              />
                              <div className="admin-resource-actions">
                                <input
                                  type="text"
                                  value={resource.duracion}
                                  placeholder="Duración"
                                  onChange={(event) =>
                                    handleTopicResourceChange(index, key, resourceIndex, 'duracion', event.target.value)
                                  }
                                />
                                <button
                                  type="button"
                                  className="btn-link"
                                  onClick={() => handleRemoveTopicResource(index, key, resourceIndex)}
                                >
                                  Quitar
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="admin-empty">Aún no agregaste {label.toLowerCase()} para este tema.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <p className="admin-empty">No hay temas registrados. Agrega al menos uno para este grado.</p>
            )}
          </section>

          <section className="admin-panel__section admin-panel__section--activities">
            <header>
              <h3>Actividades generales</h3>
              <button type="button" className="btn-link" onClick={handleAddGeneralActivity}>
                Agregar actividad
              </button>
            </header>
            {draft.actividadesGenerales.length ? (
              draft.actividadesGenerales.map((activity, index) => (
                <div className="admin-activity" key={`activity-${index}`}>
                  <input
                    type="text"
                    value={activity.tipo}
                    placeholder="Tipo de actividad"
                    onChange={(event) => handleGeneralActivityChange(index, 'tipo', event.target.value)}
                    required
                  />
                  <input
                    type="text"
                    value={activity.descripcion}
                    placeholder="Descripción"
                    onChange={(event) => handleGeneralActivityChange(index, 'descripcion', event.target.value)}
                    required
                  />
                  <button type="button" className="btn-link" onClick={() => handleRemoveGeneralActivity(index)}>
                    Quitar
                  </button>
                </div>
              ))
            ) : (
              <p className="admin-empty">Añade actividades para reforzar el aprendizaje del curso.</p>
            )}
          </section>

          <section className="admin-panel__section admin-panel__section--feedback">
            <h3>Retroalimentación general</h3>
            <textarea
              rows={3}
              value={draft.retroalimentacionGeneral}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, retroalimentacionGeneral: event.target.value }))
              }
              placeholder="Mensaje sugerido para estudiantes que necesiten reforzar este curso."
            />
          </section>

          <section className="admin-panel__section admin-panel__section--reference">
            <h3>Recursos disponibles en la base de datos</h3>
            <p>Estos recursos provienen directamente de la base de datos y se muestran como referencia.</p>
            <div className="admin-reference-grid">
              {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
                <div className="admin-reference-column" key={`ref-${key}`}>
                  <h4>{label}</h4>
                  {baseInfo.recursos[key]?.length ? (
                    <ul>
                      {baseInfo.recursos[key].map((resource) => (
                        <li key={`${key}-${resource.id || resource.url}`}>
                          <span className="admin-reference-title">{resource.title}</span>
                          <a href={resource.url} target="_blank" rel="noreferrer">
                            Abrir
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="admin-empty">Sin {label.toLowerCase()} registrados.</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

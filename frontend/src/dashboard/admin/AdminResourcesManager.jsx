// frontend/src/dashboard/admin/AdminResourcesManager.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';

const RESOURCE_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'lectura', label: 'Lectura' },
  { value: 'ejercicio', label: 'Ejercicio' },
  { value: 'quiz', label: 'Cuestionario' },
  { value: 'recurso', label: 'Otro recurso' },
];

const emptyResource = () => ({
  tipo: 'video',
  titulo: '',
  url: '',
  descripcion: '',
  proveedor: '',
  duracion: '',
  indicadorIds: [],
  activo: true,
});

const ensureArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item));
  return [String(value)];
};

export default function AdminResourcesManager({ active, areaId, grado, indicadorOptions = [], onReload }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState(() => emptyResource());
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState('');
  const [editDraft, setEditDraft] = useState(() => emptyResource());
  const [savingEditId, setSavingEditId] = useState('');

  const resetMessages = () => {
    setError('');
    setStatus('');
  };

  const fetchResources = useCallback(async () => {
    if (!active || !areaId || !grado) return;
    resetMessages();
    setLoading(true);
    try {
      const response = await api.admin.catalogResources(areaId, grado);
      const list = Array.isArray(response?.recursos) ? response.recursos : [];
      setResources(list);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los recursos.');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [active, areaId, grado]);

  useEffect(() => {
    if (!active || !areaId || !grado) return;
    fetchResources();
  }, [active, areaId, grado, fetchResources]);

  const handleDraftChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleDraftIndicators = (options) => {
    const values = Array.from(options).map((option) => option.value);
    setDraft((prev) => ({ ...prev, indicadorIds: values }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!areaId || !grado) return;
    resetMessages();
    setSaving(true);
    try {
      await api.admin.createResource(areaId, grado, {
        ...draft,
        indicadorIds: ensureArray(draft.indicadorIds),
      });
      setDraft(emptyResource());
      setStatus('Recurso agregado correctamente.');
      await fetchResources();
      onReload?.();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el recurso.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    const id = item?.id || item?._id;
    if (!id) return;
    setEditingId(String(id));
    setEditDraft({
      tipo: item?.tipo || 'recurso',
      titulo: item?.titulo || '',
      url: item?.url || '',
      descripcion: item?.descripcion || '',
      proveedor: item?.proveedor || '',
      duracion: item?.duracion || item?.duracionTexto || '',
      indicadorIds: ensureArray(item?.indicadorIds),
      activo: item?.activo !== false,
    });
    resetMessages();
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditDraft(emptyResource());
    setSavingEditId('');
  };

  const handleEditChange = (field, value) => {
    setEditDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditIndicators = (options) => {
    const values = Array.from(options).map((option) => option.value);
    setEditDraft((prev) => ({ ...prev, indicadorIds: values }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingId) return;
    resetMessages();
    setSavingEditId(editingId);
    try {
      await api.admin.updateResource(editingId, areaId, grado, {
        ...editDraft,
        indicadorIds: ensureArray(editDraft.indicadorIds),
      });
      setStatus('Recurso actualizado correctamente.');
      cancelEdit();
      await fetchResources();
      onReload?.();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el recurso.');
      setSavingEditId('');
    }
  };

  const handleDelete = async (item) => {
    const id = item?.id || item?._id;
    if (!id) return;
    resetMessages();
    const confirmed = window.confirm('¿Eliminar este recurso? Los estudiantes dejarán de verlo en el tablero.');
    if (!confirmed) return;
    try {
      await api.admin.deleteResource(id);
      setStatus('Recurso eliminado.');
      if (editingId === String(id)) {
        cancelEdit();
      }
      await fetchResources();
      onReload?.();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el recurso.');
    }
  };

  return (
    <section className="admin-panel__section admin-panel__section--db-resources">
      <header>
        <div>
          <h3>Recursos desde la base de datos</h3>
          <p>Agrega y actualiza enlaces reales para los indicadores de esta área.</p>
        </div>
      </header>

      <form className="admin-form-grid admin-form-grid--resources" onSubmit={handleCreate}>
        <select value={draft.tipo} onChange={(event) => handleDraftChange('tipo', event.target.value)}>
          {RESOURCE_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={draft.titulo}
          onChange={(event) => handleDraftChange('titulo', event.target.value)}
          placeholder="Título del recurso"
          required
        />
        <input
          type="url"
          value={draft.url}
          onChange={(event) => handleDraftChange('url', event.target.value)}
          placeholder="https://..."
          required
        />
        <input
          type="text"
          value={draft.descripcion}
          onChange={(event) => handleDraftChange('descripcion', event.target.value)}
          placeholder="Descripción breve"
        />
        <input
          type="text"
          value={draft.proveedor}
          onChange={(event) => handleDraftChange('proveedor', event.target.value)}
          placeholder="Fuente o proveedor"
        />
        <input
          type="text"
          value={draft.duracion}
          onChange={(event) => handleDraftChange('duracion', event.target.value)}
          placeholder="Duración"
        />
        <label className="admin-form__multiselect">
          <span>Indicadores asociados</span>
          <select
            multiple
            value={draft.indicadorIds}
            onChange={(event) => handleDraftIndicators(event.target.selectedOptions)}
            required={indicadorOptions.length > 0}
          >
            {indicadorOptions.length ? (
              indicadorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            ) : (
              <option disabled value="">
                No hay indicadores registrados
              </option>
            )}
          </select>
        </label>
        <label className="admin-form__checkbox">
          <input
            type="checkbox"
            checked={draft.activo}
            onChange={(event) => handleDraftChange('activo', event.target.checked)}
          />
          <span>Visible para estudiantes</span>
        </label>
        <button type="submit" className="btn-secondary" disabled={saving}>
          {saving ? 'Guardando...' : 'Agregar recurso'}
        </button>
      </form>

      {!indicadorOptions.length ? (
        <p className="admin-hint">
          Este grado aún no tiene indicadores vinculados. Podrás asociar recursos específicos cuando se carguen.
        </p>
      ) : null}

      {error ? <p className="admin-error">{error}</p> : null}
      {status ? <p className="admin-status">{status}</p> : null}

      {loading ? (
        <p className="admin-loading">Cargando recursos registrados...</p>
      ) : resources.length ? (
        <div className="admin-table-wrapper">
          <table className="admin-table admin-table--resources">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Título</th>
                <th>Indicadores</th>
                <th>Duración</th>
                <th>Estado</th>
                <th className="admin-table__actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((item) => {
                const id = item?.id || item?._id;
                const isEditing = editingId === String(id);
                return (
                  <tr key={id}>
                    <td data-label="Tipo" className="admin-table__column--small">
                      {isEditing ? (
                        <select
                          value={editDraft.tipo}
                          onChange={(event) => handleEditChange('tipo', event.target.value)}
                        >
                          {RESOURCE_TYPES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="admin-badge">{item?.tipo || '—'}</span>
                      )}
                    </td>
                    <td data-label="Título" className="admin-table__column--wide">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editDraft.titulo}
                            onChange={(event) => handleEditChange('titulo', event.target.value)}
                            required
                          />
                          <input
                            type="url"
                            value={editDraft.url}
                            onChange={(event) => handleEditChange('url', event.target.value)}
                            required
                          />
                          <input
                            type="text"
                            value={editDraft.descripcion}
                            onChange={(event) => handleEditChange('descripcion', event.target.value)}
                            placeholder="Descripción"
                          />
                        </>
                      ) : (
                        <div className="admin-resource-summary">
                          <a href={item?.url} target="_blank" rel="noreferrer">
                            {item?.titulo || 'Recurso'}
                          </a>
                          {item?.descripcion ? <p>{item.descripcion}</p> : null}
                          {item?.proveedor ? <span className="admin-meta">{item.proveedor}</span> : null}
                        </div>
                      )}
                    </td>
                    <td data-label="Indicadores" className="admin-table__column--wide">
                      {isEditing ? (
                        <select
                          multiple
                          value={editDraft.indicadorIds}
                          onChange={(event) => handleEditIndicators(event.target.selectedOptions)}
                          required={indicadorOptions.length > 0}
                        >
                          {indicadorOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : item?.indicadores?.length ? (
                        <ul className="admin-chip-list">
                          {item.indicadores.map((indicator) => (
                            <li key={indicator.id} className="admin-chip">
                              <span>{indicator.codigo || 'Indicador'}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td data-label="Duración" className="admin-table__column--small">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDraft.duracion}
                          onChange={(event) => handleEditChange('duracion', event.target.value)}
                          placeholder="Duración"
                        />
                      ) : (
                        <span>{item?.duracion || '—'}</span>
                      )}
                    </td>
                    <td data-label="Estado" className="admin-table__column--small">
                      {isEditing ? (
                        <label className="admin-form__checkbox">
                          <input
                            type="checkbox"
                            checked={editDraft.activo}
                            onChange={(event) => handleEditChange('activo', event.target.checked)}
                          />
                          <span>Activo</span>
                        </label>
                      ) : (
                        <span className={`admin-status-pill ${item?.activo !== false ? 'admin-status-pill--active' : ''}`}>
                          {item?.activo !== false ? 'Visible' : 'Oculto'}
                        </span>
                      )}
                    </td>
                    <td className="admin-table__actions">
                      {isEditing ? (
                        <div className="admin-table__action-group">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleUpdate}
                            disabled={savingEditId === editingId}
                          >
                            {savingEditId === editingId ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button type="button" className="btn-link" onClick={cancelEdit}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="admin-table__action-group">
                          <button type="button" className="btn-link" onClick={() => startEdit(item)}>
                            Editar
                          </button>
                          <button type="button" className="btn-link btn-link--danger" onClick={() => handleDelete(item)}>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">Todavía no registraste recursos para este grado.</p>
      )}
    </section>
  );
}

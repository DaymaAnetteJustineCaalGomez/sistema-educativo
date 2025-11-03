// frontend/src/dashboard/admin/AdminCompetenciasManager.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';

const emptyForm = () => ({
  codigo: '',
  enunciado: '',
  orden: '',
});

export default function AdminCompetenciasManager({ active, areaId, grado, onReload }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [createDraft, setCreateDraft] = useState(() => emptyForm());
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState('');
  const [editDraft, setEditDraft] = useState(() => emptyForm());
  const [savingEditId, setSavingEditId] = useState('');

  const resetMessages = () => {
    setError('');
    setStatus('');
  };

  const fetchCompetencias = useCallback(async () => {
    if (!active || !areaId || !grado) return;
    resetMessages();
    setLoading(true);
    try {
      const response = await api.admin.catalogCompetencias(areaId, grado);
      const list = Array.isArray(response?.competencias) ? response.competencias : [];
      setItems(list);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las competencias.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [active, areaId, grado]);

  useEffect(() => {
    if (!active || !areaId || !grado) return;
    fetchCompetencias();
  }, [active, areaId, grado, fetchCompetencias]);

  const handleCreateChange = (field, value) => {
    setCreateDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!areaId || !grado) return;
    resetMessages();
    setSaving(true);
    try {
      await api.admin.createCompetencia(areaId, grado, createDraft);
      setCreateDraft(emptyForm());
      setStatus('Competencia creada correctamente.');
      await fetchCompetencias();
      onReload?.();
    } catch (err) {
      setError(err.message || 'No se pudo crear la competencia.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    const id = item?._id || item?.id;
    if (!id) return;
    setEditingId(String(id));
    setEditDraft({
      codigo: item?.codigo || '',
      enunciado: item?.enunciado || '',
      orden: item?.orden !== undefined && item?.orden !== null ? String(item.orden) : '',
    });
    resetMessages();
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditDraft(emptyForm());
    setSavingEditId('');
  };

  const handleEditChange = (field, value) => {
    setEditDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingId) return;
    resetMessages();
    setSavingEditId(editingId);
    try {
      await api.admin.updateCompetencia(editingId, { ...editDraft, grado });
      setStatus('Competencia actualizada.');
      cancelEdit();
      await fetchCompetencias();
      onReload?.();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la competencia.');
      setSavingEditId('');
    }
  };

  const handleDelete = async (item) => {
    const id = item?._id || item?.id;
    if (!id) return;
    resetMessages();
    const confirmed = window.confirm('¿Eliminar esta competencia? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    try {
      await api.admin.deleteCompetencia(id);
      setStatus('Competencia eliminada.');
      if (editingId === String(id)) {
        cancelEdit();
      }
      await fetchCompetencias();
      onReload?.();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la competencia.');
    }
  };

  return (
    <section className="admin-panel__section admin-panel__section--competencias">
      <header>
        <div>
          <h3>Competencias del área</h3>
          <p>Gestiona los códigos y enunciados que verán los estudiantes en su tablero.</p>
        </div>
      </header>

      <form className="admin-form-grid admin-form-grid--competencias" onSubmit={handleSubmit}>
        <input
          type="text"
          value={createDraft.codigo}
          onChange={(event) => handleCreateChange('codigo', event.target.value)}
          placeholder="Código de competencia"
          required
        />
        <input
          type="text"
          value={createDraft.enunciado}
          onChange={(event) => handleCreateChange('enunciado', event.target.value)}
          placeholder="Enunciado de la competencia"
          required
        />
        <input
          type="number"
          value={createDraft.orden}
          min="0"
          onChange={(event) => handleCreateChange('orden', event.target.value)}
          placeholder="Orden"
        />
        <button type="submit" className="btn-secondary" disabled={saving}>
          {saving ? 'Guardando...' : 'Agregar competencia'}
        </button>
      </form>

      {error ? <p className="admin-error">{error}</p> : null}
      {status ? <p className="admin-status">{status}</p> : null}

      {loading ? (
        <p className="admin-loading">Cargando competencias registradas...</p>
      ) : items.length ? (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Enunciado</th>
                <th>Orden</th>
                <th className="admin-table__actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const id = item?._id || item?.id;
                const isEditing = editingId === String(id);
                return (
                  <tr key={id}>
                    <td data-label="Código">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDraft.codigo}
                          onChange={(event) => handleEditChange('codigo', event.target.value)}
                          required
                        />
                      ) : (
                        <span>{item?.codigo || '—'}</span>
                      )}
                    </td>
                    <td data-label="Enunciado">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDraft.enunciado}
                          onChange={(event) => handleEditChange('enunciado', event.target.value)}
                          required
                        />
                      ) : (
                        <span>{item?.enunciado || '—'}</span>
                      )}
                    </td>
                    <td data-label="Orden" className="admin-table__column--small">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editDraft.orden}
                          onChange={(event) => handleEditChange('orden', event.target.value)}
                          min="0"
                        />
                      ) : (
                        <span>{item?.orden ?? '—'}</span>
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
        <p className="admin-empty">Todavía no registraste competencias para este grado.</p>
      )}
    </section>
  );
}

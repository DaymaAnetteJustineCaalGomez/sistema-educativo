// frontend/src/dashboard/admin/AdminUsersPanel.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';

const ROLE_OPTIONS = [
  { value: 'ESTUDIANTE', label: 'Estudiante' },
  { value: 'DOCENTE', label: 'Docente' },
  { value: 'ADMIN', label: 'Administrador' },
];

const GRADE_OPTIONS = [
  { value: '', label: 'Sin grado' },
  { value: '1', label: '1° Básico' },
  { value: '2', label: '2° Básico' },
  { value: '3', label: '3° Básico' },
];

export default function AdminUsersPanel({ active }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [creationMessage, setCreationMessage] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'ESTUDIANTE',
    grado: '1',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.admin.listUsers();
      const list = Array.isArray(response?.users) ? response.users : [];
      setUsers(list);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los usuarios.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) {
      fetchUsers();
    }
  }, [active, fetchUsers]);

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.admin.updateUser(id, { rol: newRole });
      setUsers((prev) =>
        prev.map((user) => (user._id === id || user.id === id ? { ...user, rol: newRole } : user)),
      );
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el rol.');
    }
  };

  const handleGradeChange = async (id, newGrade) => {
    try {
      const payload = newGrade ? { grado: newGrade } : { grado: null };
      await api.admin.updateUser(id, payload);
      setUsers((prev) =>
        prev.map((user) =>
          user._id === id || user.id === id ? { ...user, grado: newGrade ? Number(newGrade) : null } : user,
        ),
      );
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el grado.');
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ nombre: '', email: '', password: '', rol: 'ESTUDIANTE', grado: '1' });
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreationMessage('');
    try {
      const payload = {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: form.rol,
        grado: form.grado,
      };
      const response = await api.admin.createUser(payload);
      const created = response?.user;
      if (created) {
        setUsers((prev) => [created, ...prev]);
      }
      setCreationMessage('Usuario creado correctamente.');
      resetForm();
    } catch (err) {
      setCreationMessage(err.message || 'No se pudo crear el usuario.');
    } finally {
      setCreating(false);
      fetchUsers();
    }
  };

  return (
    <div className="admin-panel admin-panel--users">
      <header className="admin-panel__header">
        <div>
          <h2>Administrar usuarios</h2>
          <p>Actualiza roles, grados y registra nuevos usuarios dentro del sistema.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={fetchUsers} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar lista'}
        </button>
      </header>

      <section className="admin-panel__section admin-panel__section--form">
        <h3>Crear usuario</h3>
        <form onSubmit={handleCreateUser} className="admin-form-grid">
          <label>
            Nombre completo
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Correo electrónico
            <input type="email" name="email" value={form.email} onChange={handleInputChange} required />
          </label>
          <label>
            Contraseña temporal
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleInputChange}
              required
              minLength={8}
            />
          </label>
          <label>
            Rol
            <select name="rol" value={form.rol} onChange={handleInputChange}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Grado
            <select name="grado" value={form.grado} onChange={handleInputChange}>
              {GRADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creando...' : 'Registrar usuario'}
            </button>
            {creationMessage ? <p className="admin-form__status">{creationMessage}</p> : null}
          </div>
        </form>
      </section>

      <section className="admin-panel__section admin-panel__section--list">
        <h3>Listado de usuarios</h3>
        {error ? <p className="admin-error">{error}</p> : null}
        <div className="admin-table">
          <div className="admin-table__header">
            <span>Nombre</span>
            <span>Correo</span>
            <span>Rol</span>
            <span>Grado</span>
            <span>Registrado</span>
          </div>
          {loading ? (
            <div className="admin-table__row">Cargando usuarios...</div>
          ) : users.length ? (
            users.map((user) => {
              const id = user._id || user.id;
              return (
                <div className="admin-table__row" key={id}>
                  <span className="admin-table__cell admin-table__cell--strong">{user.nombre}</span>
                  <span className="admin-table__cell">{user.email}</span>
                  <span className="admin-table__cell">
                    <select value={user.rol} onChange={(event) => handleRoleChange(id, event.target.value)}>
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span className="admin-table__cell">
                    <select
                      value={user.grado ? String(user.grado) : ''}
                      onChange={(event) => handleGradeChange(id, event.target.value)}
                    >
                      {GRADE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span className="admin-table__cell admin-table__cell--muted">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="admin-table__row">No hay usuarios registrados.</div>
          )}
        </div>
      </section>
    </div>
  );
}

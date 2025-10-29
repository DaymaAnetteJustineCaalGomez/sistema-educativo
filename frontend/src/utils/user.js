// frontend/src/utils/user.js
// Utilidades relacionadas con normalización de usuarios y grados.

const GRADE_LABELS = {
  1: '1° Básico',
  2: '2° Básico',
  3: '3° Básico',
};

export const parseGrado = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if ([1, 2, 3].includes(num)) return num;
  const match = String(value).match(/([123])/);
  return match ? Number(match[1]) : null;
};

export const normalizeUser = (raw) => {
  if (!raw) return null;
  const grado = parseGrado(raw.grado ?? raw.grade);
  const name = (raw.nombre || raw.name || '').trim();
  const role = String(raw.rol || raw.role || 'ESTUDIANTE').toUpperCase();
  return {
    id: raw.id || raw._id || raw.uid || null,
    name,
    nombre: name,
    email: raw.email || '',
    role,
    rol: role,
    grado,
  };
};

export const getGradeLabel = (grado) => GRADE_LABELS[grado] || 'CNB Básico';

export const getFirstName = (user) => {
  const base = (user?.name || user?.nombre || user?.email || '').trim();
  if (!base) return 'Estudiante';
  const parts = base.split(/\s+/);
  return parts[0] || base;
};

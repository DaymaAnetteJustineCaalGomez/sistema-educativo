// backend/routes/users.routes.js
import { Router } from 'express';
import { authRequired } from '../middlewares/auth.middleware.js';
import { Usuario } from '../models/Usuario.js';

const router = Router();

const SAFE_USER_FIELDS = 'nombre email rol grado createdAt updatedAt';

/**
 * GET /api/users/me
 * Devuelve el perfil del usuario autenticado (incluye `grado`).
 */
router.get('/me', authRequired, async (req, res) => {
  const user = await Usuario.findById(req.user.id)
    .select(SAFE_USER_FIELDS);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user });
});

/**
 * PATCH /api/users/me
 * Permite actualizar campos: grado, nombre, avatar (whitelist).
 * Body: { grado?: 1|2|3, nombre?: string, avatar?: string }
 */
router.patch('/me', authRequired, async (req, res) => {
  const allowed = ['grado', 'nombre'];
  const hasAllowed = allowed.some((key) => Object.prototype.hasOwnProperty.call(req.body, key));
  if (!hasAllowed) {
    const user = await Usuario.findById(req.user.id)
      .select(SAFE_USER_FIELDS);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ user });
  }

  const user = await Usuario.findById(req.user.id)
    .select(SAFE_USER_FIELDS);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  let touched = false;

  if (Object.prototype.hasOwnProperty.call(req.body, 'grado')) {
    const g = Number(req.body.grado);
    if (![1, 2, 3].includes(g)) {
      return res.status(400).json({ error: 'Grado inválido. Use 1, 2 o 3.' });
    }

    if (user.grado && user.grado !== g) {
      return res
        .status(409)
        .json({ error: 'El grado ya fue asignado. Contacta a administración para cambios.' });
    }

    if (!user.grado) {
      user.grado = g;
      touched = true;
    }
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'nombre')) {
    const nombre = String(req.body.nombre || '').trim();
    if (nombre && nombre !== user.nombre) {
      user.nombre = nombre;
      touched = true;
    }
  }

  if (touched) {
    await user.save({ validateBeforeSave: false });
  }

  const fresh = await Usuario.findById(req.user.id)
    .select(SAFE_USER_FIELDS)
    .lean();
  if (!fresh) return res.status(404).json({ error: 'Usuario no encontrado' });

  res.json({ user: fresh });
});

export default router;

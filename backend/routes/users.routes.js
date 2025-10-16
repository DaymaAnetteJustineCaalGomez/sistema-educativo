// backend/routes/users.routes.js
import { Router } from 'express';
import { authRequired } from '../middlewares/auth.middleware.js';
import { Usuario } from '../models/Usuario.js';

const router = Router();

/**
 * GET /api/users/me
 * Devuelve el perfil del usuario autenticado (incluye `grado`).
 */
router.get('/me', authRequired, async (req, res) => {
  const user = await Usuario.findById(req.user.id)
    .select('-password -passwordHash -passwordResetToken -passwordResetExpires -__v');
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user });
});

/**
 * PATCH /api/users/me
 * Permite actualizar campos: grado, nombre, avatar (whitelist).
 * Body: { grado?: 1|2|3, nombre?: string, avatar?: string }
 */
router.patch('/me', authRequired, async (req, res) => {
  const allowed = ['grado', 'nombre', 'avatar'];
  const updates = {};
  for (const k of allowed) if (k in req.body) updates[k] = req.body[k];

  if ('grado' in updates) {
    const g = Number(updates.grado);
    if (![1, 2, 3].includes(g)) {
      return res.status(400).json({ error: 'Grado inválido. Use 1, 2 o 3.' });
    }
    updates.grado = g;
  }

  const user = await Usuario.findByIdAndUpdate(req.user.id, updates, { new: true })
    .select('-password -passwordHash -passwordResetToken -passwordResetExpires -__v');
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  res.json({ user });
});

export default router;

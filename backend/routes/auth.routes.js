// backend/routes/auth.routes.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario, ROLES } from '../models/Usuario.js';
import { authRequired } from '../middlewares/auth.middleware.js';

const router = Router();

const normEmail = (raw) => (raw || '').trim().toLowerCase();

/* POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const nombre = (req.body.nombre || '').trim();
    const email = normEmail(req.body.email);
    const password = req.body.password || '';
    const rol = req.body.rol;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password son obligatorios' });
    }
    if (rol && !ROLES.includes(rol)) {
      return res.status(400).json({ error: `rol inválido. Usa: ${ROLES.join(', ')}` });
    }

    const ya = await Usuario.findOne({ email }).lean();
    if (ya) return res.status(409).json({ error: 'El email ya está registrado' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await Usuario.create({
      nombre,
      email,
      passwordHash,
      rol: rol || 'ESTUDIANTE'
    });

    return res.status(201).json({
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      createdAt: user.createdAt
    });
  } catch (e) {
    if (e.code === 11000){
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    return res.status(500).json({ error: e.message });
  }
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Falta JWT_SECRET en el .env' });
    }

    const email = normEmail(req.body.email);
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son obligatorios' });
    }

    const user = await Usuario.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user._id.toString(), rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '1d' }
    );

    return res.json({
      token,
      user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Reemplaza TU /me por este:
router.get('/me', authRequired, async (req, res) => {
  const user = await Usuario.findById(req.user.id).select('_id nombre email rol').lean();
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol } });
});

export default router;


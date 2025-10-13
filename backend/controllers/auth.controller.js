// backend/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Usuario, ROLES } from '../models/Usuario.js';
import { sendEmail } from '../utils/sendEmail.js';
import { resetPasswordTemplate } from '../utils/emailTemplates.js';

const norm = (s) => (s || '').trim();
const normEmail = (s) => norm(s).toLowerCase();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '1d' }
  );

// -------- POST /api/auth/register --------
export const register = async (req, res, next) => {
  try {
    const nombre = norm(req.body.nombre);
    const email = normEmail(req.body.email);
    const password = norm(req.body.password);
    const rol = (req.body.rol && String(req.body.rol).toUpperCase()) || 'ESTUDIANTE';

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son requeridos' });
    }
    if (!ROLES.includes(rol)) {
      return res.status(400).json({ error: `Rol inválido. Usa uno de: ${ROLES.join(', ')}` });
    }

    const exists = await Usuario.findOne({ email });
    if (exists) return res.status(409).json({ error: 'El email ya está registrado' });

    const user = await Usuario.create({ nombre, email, password, rol }); // password se hashea en pre('save')
    const { password: _p, passwordHash: _ph, ...safe } = user.toObject();
    return res.status(201).json({ ok: true, user: safe });
  } catch (err) {
    return next(err);
  }
};

// -------- POST /api/auth/login --------
export const login = async (req, res, next) => {
  try {
    const email = normEmail(req.body.email);
    const password = norm(req.body.password);

    // Necesitamos los hashes ocultos
    const user = await Usuario.findOne({ email }).select('+password +passwordHash +passwordChangedAt');
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signToken(user);
    const { password: _p, passwordHash: _ph, passwordChangedAt: _pc, ...safe } = user.toObject();
    return res.json({ token, user: safe });
  } catch (err) {
    return next(err);
  }
};

// -------- GET /api/auth/me --------
export const me = async (req, res, next) => {
  try {
    const user = await Usuario.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const { password: _p, passwordHash: _ph, ...safe } = user.toObject();
    return res.json({ user: safe });
  } catch (err) {
    return next(err);
  }
};

// -------- POST /api/auth/forgot-password --------
export const forgotPassword = async (req, res, next) => {
  try {
    const email = normEmail(req.body.email);
    const user = await Usuario.findOne({ email });

    // No filtramos existencia: respuesta uniforme
    if (!user) return res.json({ ok: true });

    // Genera token crudo y guarda hash + expiración
    const rawToken = user.createPasswordResetToken(); // método del modelo
    await user.save();

    // Construye URL hacia tu frontend (APP_BASE_URL)
    const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${rawToken}`;
    const html = resetPasswordTemplate(resetUrl);

    try {
      await sendEmail({ to: user.email, subject: 'Restablece tu contraseña', html });
    } catch (e) {
      // Si falló el envío, revierte estado de reset
      if (typeof user.clearPasswordReset === 'function') {
        user.clearPasswordReset();
      } else {
        user.passwordResetToken = null;
        user.passwordResetExpires = null;

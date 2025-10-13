// backend/routes/auth.routes.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { Usuario, ROLES } from '../models/Usuario.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import { sendEmail } from '../utils/sendEmail.js';

const router = Router();

const norm = (s) => (s || '').toString().trim();
const normEmail = (raw) => norm(raw).toLowerCase();

const signToken = (userId, rol) =>
  jwt.sign({ id: userId, rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '1d'
  });

// === Rate limiters específicos ===
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 5, // 5 intentos inválidos -> 429 en el 6º
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // solo cuenta fallos
  message: { error: 'Demasiados intentos. Intenta más tarde.' },
});

const forgotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
});

const resetLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
});

// =====================
//      AUTH BASE
// =====================

/* POST /api/auth/register */
router.post('/register', async (req, res, next) => {
  try {
    const nombre = norm(req.body.nombre);
    const email = normEmail(req.body.email);
    const password = norm(req.body.password);
    const rol = req.body.rol ? String(req.body.rol).toUpperCase() : 'ESTUDIANTE';

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password son obligatorios' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    if (rol && !ROLES.includes(rol)) {
      return res.status(400).json({ error: `rol inválido. Usa: ${ROLES.join('|')}` });
    }

    const exists = await Usuario.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email ya registrado' });

    const user = await Usuario.create({ nombre, email, password, rol });
    return res.status(201).json({
      ok: true,
      user: {
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        createdAt: user.createdAt,
      }
    });
  } catch (err) {
    next(err);
  }
});

/* POST /api/auth/login */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = normEmail(req.body.email);
    const password = norm(req.body.password);

    // Importante: incluir +password y +passwordHash por compatibilidad legado
    const user = await Usuario.findOne({ email })
      .select('+password +passwordHash +passwordChangedAt');
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signToken(user._id, user.rol);
    return res.json({
      ok: true,
      token,
      user: {
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (err) {
    next(err);
  }
});

/* GET /api/auth/me */
router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await Usuario.findById(req.user.id)
      .select('-password -passwordHash -passwordResetToken -passwordResetExpires -__v');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
});

// ===============================
//  FORGOT / RESET PASSWORD FLOW
// ===============================

/* POST /api/auth/forgot-password */
router.post('/forgot-password', forgotLimiter, async (req, res, next) => {
  try {
    const email = normEmail(req.body.email);
    if (!email) return res.status(400).json({ error: 'email es obligatorio' });

    const genericMsg = { ok: true, message: 'Si el correo existe, se envió un enlace para restablecer la contraseña.' };
    const user = await Usuario.findOne({ email });

    // Respuesta uniforme (no revelamos existencia)
    if (!user) return res.json(genericMsg);

    if (!process.env.APP_BASE_URL) {
      return res.status(500).json({ error: 'Falta APP_BASE_URL en el .env' });
    }

    // Token crudo para email + hash en BD
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = tokenHash;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.APP_BASE_URL}/reset-password?token=${resetToken}`;
    const subject = 'Restablecer contraseña';
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">
        <h2 style="margin:0 0 12px">Restablecer contraseña</h2>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente botón (válido por 15 minutos):</p>
        <p>
          <a href="${resetURL}" style="display:inline-block;padding:10px 16px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px" target="_blank" rel="noopener noreferrer">
            Cambiar mi contraseña
          </a>
        </p>
        <p>Si el botón no funciona, copia y pega esta URL:</p>
        <p><a href="${resetURL}" target="_blank" rel="noopener noreferrer">${resetURL}</a></p>
        <p style="color:#64748b;font-size:13px">Si no solicitaste esto, ignora este correo.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject,
        html,
        text: `Restablecer contraseña: ${resetURL}`,
      });
    } catch (e) {
      // Revertir si falló el envío
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ error: 'No se pudo enviar el correo.' });
    }

    return res.json(genericMsg);
  } catch (err) {
    next(err);
  }
});

/* POST /api/auth/reset-password/:token */
router.post('/reset-password/:token', resetLimiter, async (req, res, next) => {
  try {
    const { token } = req.params;
    const password = norm(req.body.password);
    const confirmPassword = norm(req.body.confirmPassword);

    if (!token) return res.status(400).json({ error: 'token requerido' });
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'password es obligatorio (mínimo 8 caracteres)' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    // Hashear el token recibido para buscar
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await Usuario.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() }, // no expirado
    }).select('+password +passwordHash +passwordChangedAt');

    if (!user) return res.status(400).json({ error: 'Token inválido o expirado' });

    // Actualizar password (pre('save') hará hash)
    user.password = password;
    // Invalida JWTs antiguos (además del pre('save'))
    user.passwordChangedAt = new Date(Date.now() - 1000);
    // Limpia estado de reset
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    // Si quieres, podrías iniciar sesión automática devolviendo un JWT:
    // const jwtToken = signToken(user._id, user.rol);
    // return res.json({ ok: true, message: 'Contraseña actualizada', token: jwtToken });

    return res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (err) {
    next(err);
  }
});

export default router;

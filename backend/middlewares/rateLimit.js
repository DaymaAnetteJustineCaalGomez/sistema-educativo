// middlewares/rateLimit.js
import rateLimit from 'express-rate-limit';

export const limitLogin = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de login. Inténtalo más tarde.' }
});

export const limitForgotPassword = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Has superado el límite de solicitudes. Inténtalo más tarde.' }
});

export const limitResetPassword = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Has superado el límite de solicitudes. Inténtalo más tarde.' }
});

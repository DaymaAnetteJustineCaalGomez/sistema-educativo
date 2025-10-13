// backend/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/Usuario.js';

function getTokenFromRequest(req) {
  // 1) Authorization: Bearer <token>
  const auth = (req.headers.authorization || '').trim();
  if (auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  // 2) x-access-token (algunos clientes lo usan)
  if (req.headers['x-access-token']) {
    const token = String(req.headers['x-access-token']).trim();
    if (token) return token;
  }

  // 3) Cookies (si usas cookie-parser y guardas 'token')
  if (req.cookies && req.cookies.token) {
    const token = String(req.cookies.token).trim();
    if (token) return token;
  }

  return null;
}

function send401(res, msg = 'No autenticado') {
  return res.status(401).json({ error: msg });
}

function send403(res, msg = 'No autorizado') {
  return res.status(403).json({ error: msg });
}

export const authRequired = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      // Configuración faltante en el servidor
      return res.status(500).json({ error: 'Falta JWT_SECRET en el .env' });
    }

    const token = getTokenFromRequest(req);
    if (!token) return send401(res, 'Token requerido');

    // Valida firma y expiración
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET /* , { clockTolerance: 5 } */);
      // payload esperado: { id, iat, exp, ... }
    } catch (e) {
      // Diferencia entre expirado y malformado
      if (e.name === 'TokenExpiredError') {
        return send401(res, 'Token expirado');
      }
      return send401(res, 'Token inválido');
    }

    if (!payload?.id) return send401(res, 'Token inválido');

    // Carga mínima del usuario; necesitamos rol y passwordChangedAt para invalidación
    const user = await Usuario.findById(payload.id)
      .select('+passwordChangedAt rol nombre email');

    if (!user) return send401(res, 'Token inválido');

    // Invalida tokens emitidos antes del cambio de contraseña
    if (typeof user.changedPasswordAfter === 'function' && payload.iat) {
      const changed = user.changedPasswordAfter(payload.iat);
      if (changed) {
        return send401(res, 'Token expirado por cambio de contraseña');
      }
    }

    // Expón info útil y segura al request
    req.user = {
      id: user._id.toString(),
      rol: user.rol,
      nombre: user.nombre,
      email: user.email,
    };
    req.auth = payload; // por si necesitas iat/exp en otra capa
    return next();
  } catch (err) {
    // Fallback general
    return send401(res, 'Token inválido o expirado');
  }
};

export const allowRoles = (...roles) => {
  // Normaliza roles esperados (p. ej., 'ADMIN', 'DOCENTE', 'ESTUDIANTE')
  const expected = roles.map(r => String(r).toUpperCase());
  return (req, res, next) => {
    if (!req.user) return send401(res, 'No autenticado');

    const current = String(req.user.rol || '').toUpperCase();
    if (!expected.includes(current)) {
      return send403(
        res,
        `No autorizado: se requiere uno de [${expected.join(', ')}]`
      );
    }
    return next();
  };
};

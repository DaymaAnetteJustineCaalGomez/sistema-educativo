// backend/models/Usuario.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const ROLES = ['ESTUDIANTE', 'DOCENTE', 'ADMIN'];

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Contraseña (hash). Por seguridad, no se devuelve por defecto.
    // NOTA: Al hacer login, recuerda seleccionar explícitamente:
    // Usuario.findOne({ email }).select('+password +passwordHash')
    password: {
      type: String,
      minlength: 8,      // endurecemos a 8 (recomendado)
      select: false,
    },

    // Compatibilidad con documentos viejos que usaban "passwordHash"
    passwordHash: {
      type: String,
      select: false,
    },

    rol: { type: String, enum: ROLES, default: 'ESTUDIANTE' },

    // Seguridad extra
    passwordChangedAt: { type: Date, select: false },

    // Reset de contraseña (hash + expiración)
    passwordResetToken: { type: String, select: false, default: null },
    passwordResetExpires: { type: Date, select: false, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // Nunca exponer estos campos si por algún motivo fueron seleccionados
        delete ret.password;
        delete ret.passwordHash;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.passwordChangedAt;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.passwordHash;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.passwordChangedAt;
        return ret;
      },
    },
  }
);

// Índice útil. 'sparse' evita problemas cuando el campo es null.
usuarioSchema.index({ passwordResetToken: 1 }, { sparse: true });

/**
 * Hash de contraseña antes de guardar cuando se modifique "password".
 */
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  this.passwordHash = undefined; // limpia legado para no duplicar

  // Marca momento de cambio de contraseña (−1s por seguridad contra iat)
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

/**
 * Comparar contraseña en login.
 * Soporta "password" (nuevo) y "passwordHash" (legado).
 * IMPORTANTE: Asegúrate de seleccionar +password/+passwordHash al consultar para login.
 */
usuarioSchema.methods.comparePassword = async function (plain) {
  const hash = this.password || this.passwordHash;
  if (!hash) return false; // evita "Illegal arguments" si no se seleccionó
  return bcrypt.compare(plain, hash);
};

/**
 * Verifica si el usuario cambió la contraseña después de emitido el JWT.
 * @param {number} JWTIatSeconds - `iat` del token en segundos.
 */
usuarioSchema.methods.changedPasswordAfter = function (JWTIatSeconds) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return changedTimestamp > JWTIatSeconds;
};

/**
 * Genera token de reset y guarda su hash + expiración.
 * Devuelve el token en texto plano para enviarlo por email.
 */
usuarioSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // token crudo (se envía por email)
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // hash que guardamos
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min (recomendado)
  return resetToken;
};

/**
 * Limpia el estado de reset de contraseña (tras usar o si falla envío de correo).
 */
usuarioSchema.methods.clearPasswordReset = function () {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
};

export const Usuario = mongoose.model('Usuario', usuarioSchema);

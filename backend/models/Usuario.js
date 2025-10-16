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

    // Hash de contraseña (no se devuelve por defecto)
    password: {
      type: String,
      minlength: 8,
      select: false,
    },

    // Compatibilidad con documentos viejos que usaban "passwordHash"
    passwordHash: {
      type: String,
      select: false,
    },

    rol: { type: String, enum: ROLES, default: 'ESTUDIANTE' },

    // 👇 NUEVO: grado del ciclo básico (1,2,3)
    grado: { type: Number, enum: [1, 2, 3], default: null },

    // Seguridad extra / recuperación
    passwordChangedAt: { type: Date, select: false },
    passwordResetToken: { type: String, select: false, default: null },
    passwordResetExpires: { type: Date, select: false, default: null },
  },
  {
    timestamps: true,
    toJSON: {
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

usuarioSchema.index({ passwordResetToken: 1 }, { sparse: true });

usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  this.passwordHash = undefined;
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

usuarioSchema.methods.comparePassword = async function (plain) {
  const hash = this.password || this.passwordHash;
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
};

usuarioSchema.methods.changedPasswordAfter = function (JWTIatSeconds) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return changedTimestamp > JWTIatSeconds;
};

usuarioSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  return resetToken;
};

usuarioSchema.methods.clearPasswordReset = function () {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
};

export const Usuario = mongoose.model('Usuario', usuarioSchema);

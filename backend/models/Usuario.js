// backend/models/Usuario.js
import mongoose from 'mongoose';

export const ROLES = ['ESTUDIANTE', 'DOCENTE', 'ADMIN'];

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email:  { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  rol: { type: String, enum: ROLES, default: 'ESTUDIANTE' }
}, { timestamps: true });

export const Usuario = mongoose.model('Usuario', usuarioSchema);

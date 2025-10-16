import mongoose from 'mongoose';

const IntentoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', index: true, required: true },
  indicadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'indicadores', index: true, required: true },
  recursoId: { type: mongoose.Schema.Types.ObjectId, ref: 'recursos' },
  estado: { type: String, enum: ['pendiente','en_progreso','completado','abandonado'], default: 'en_progreso' },
  puntuacion: { type: Number, min: 0, max: 100, default: null },
  duracionSeg: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('intentos', IntentoSchema);

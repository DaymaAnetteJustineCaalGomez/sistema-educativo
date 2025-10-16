import mongoose from 'mongoose';

const ProgresoIndicadorSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', index: true, required: true },
  indicadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'indicadores', index: true, required: true },
  estadoIndicador: { type: String, enum: ['pendiente','en_progreso','completado'], default: 'pendiente' },
  promedio: { type: Number, default: null },
  intentosTotales: { type: Number, default: 0 },
  intentosAbandonados: { type: Number, default: 0 },
  ultimoIntentoAt: { type: Date },
}, { timestamps: true });

ProgresoIndicadorSchema.index({ usuarioId: 1, indicadorId: 1 }, { unique: true });

export default mongoose.model('progresos_indicador', ProgresoIndicadorSchema);

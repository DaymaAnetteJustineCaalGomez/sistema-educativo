import mongoose from 'mongoose';

const NotificacionSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', index: true, required: true },
  tipo: { type: String, enum: ['repaso','sistema','otro'], default: 'sistema' },
  mensaje: { type: String, required: true },
  leida: { type: Boolean, default: false },
  fecha: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('notificaciones', NotificacionSchema);

// backend/models/Recurso.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const RecursoSchema = new Schema(
  {
    // ✅ Soporta 1 o varios indicadores/subtemas
    indicadorId:  { type: Schema.Types.ObjectId, ref: 'indicadores', index: true },        // opcional (1 a 1)
    indicadorIds: [{ type: Schema.Types.ObjectId, ref: 'indicadores', index: true }],      // opcional (1 a N)

    tipo:        { type: String, required: true },      // video | lectura | ejercicio | quiz ...
    titulo:      { type: String, required: true, index: true },
    descripcion: { type: String, default: '' },
    proveedor:   { type: String, default: '' },
    nivel:       { type: String, default: 'intro' },    // intro | basico | medio | avanzado
    idioma:      { type: String, default: 'es' },       // es | en ...
    url:         { type: String, required: true },
    duracionMin: { type: Number, default: 0 },
    duracionTexto: { type: String, default: '' },

    activo:      { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// (Opcional) índice de texto para búsquedas por título
RecursoSchema.index({ titulo: 'text' });

export default mongoose.model('recursos', RecursoSchema);

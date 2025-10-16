import mongoose from "mongoose";

const ProgresoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  indicadorId: { type: mongoose.Schema.Types.ObjectId, ref: "CNBIndicador", required: true },
  recursoId: { type: mongoose.Schema.Types.ObjectId, ref: "Recurso" },
  estado: { type: String, enum: ["pendiente", "en_progreso", "completado"], default: "pendiente" },
  puntuacion: { type: Number, min: 0, max: 100, default: 0 },
  ultimaVez: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Progreso", ProgresoSchema);

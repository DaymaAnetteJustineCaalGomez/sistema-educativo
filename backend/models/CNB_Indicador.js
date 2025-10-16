import mongoose from "mongoose";
const IndSchema = new mongoose.Schema({
  areaId: { type: mongoose.Schema.Types.ObjectId, ref: "CNBArea", index: true },
  competenciaId: { type: mongoose.Schema.Types.ObjectId, ref: "CNBCompetencia", index: true },
  grado: { type: String, enum: ["1B","2B","3B"], index: true },
  codigo: { type: String, index: true },
  descripcion: String,
  contenidos: [{ codigo: String, titulo: String }],
  prerrequisitos: [String],
  orden: Number,
  fuente: { url: String }
}, { timestamps: true });
export default mongoose.model("CNBIndicador", IndSchema);

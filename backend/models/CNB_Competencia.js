import mongoose from "mongoose";
const CompSchema = new mongoose.Schema({
  areaId: { type: mongoose.Schema.Types.ObjectId, ref: "CNBArea", index: true },
  grado: { type: String, enum: ["1B","2B","3B"], index: true },
  codigo: { type: String, index: true },
  enunciado: String,
  orden: Number
}, { timestamps: true });
export default mongoose.model("CNBCompetencia", CompSchema);

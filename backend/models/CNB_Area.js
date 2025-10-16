import mongoose from "mongoose";
const AreaSchema = new mongoose.Schema({
  slug: { type: String, index: true, unique: true },
  nombre: String,
  descripcion: String,
  fuente: { url: String, version: String }
}, { timestamps: true });
export default mongoose.model("CNBArea", AreaSchema);

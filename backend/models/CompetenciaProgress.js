// backend/models/CompetenciaProgress.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const CompetenciaProgressSchema = new Schema(
  {
    usuarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true, index: true },
    competenciaId: {
      type: Schema.Types.ObjectId,
      ref: "CNBCompetencia",
      required: true,
      index: true,
    },
    areaId: { type: Schema.Types.ObjectId, ref: "CNBArea", required: true, index: true },
    grado: { type: String, enum: ["1B", "2B", "3B"], required: true, index: true },
    estado: {
      type: String,
      enum: ["pendiente", "en_progreso", "dominado"],
      default: "pendiente",
    },
    notas: { type: String, trim: true, default: "" },
    actualizadoEn: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

CompetenciaProgressSchema.index({ usuarioId: 1, competenciaId: 1 }, { unique: true });

CompetenciaProgressSchema.pre("save", function onSave(next) {
  this.actualizadoEn = new Date();
  next();
});

export default mongoose.model("CompetenciaProgress", CompetenciaProgressSchema);

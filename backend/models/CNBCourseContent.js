// backend/models/CNBCourseContent.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const ResourceItemSchema = new Schema(
  {
    tipo: { type: String, trim: true, default: "recurso" },
    titulo: { type: String, trim: true, required: true },
    descripcion: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, required: true },
    duracion: { type: String, trim: true, default: "" },
    proveedor: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const ActivitySchema = new Schema(
  {
    tipo: { type: String, trim: true, required: true },
    descripcion: { type: String, trim: true, required: true },
  },
  { _id: false },
);

const ResourceBucketSchema = new Schema(
  {
    videos: { type: [ResourceItemSchema], default: [] },
    lecturas: { type: [ResourceItemSchema], default: [] },
    ejercicios: { type: [ResourceItemSchema], default: [] },
    cuestionarios: { type: [ResourceItemSchema], default: [] },
    otros: { type: [ResourceItemSchema], default: [] },
  },
  { _id: false },
);

const TopicSchema = new Schema(
  {
    titulo: { type: String, trim: true, required: true },
    subtitulos: { type: [String], default: [] },
    descripcion: { type: String, trim: true, default: "" },
    indicadorIds: { type: [Schema.Types.ObjectId], ref: "CNBIndicador", default: [] },
    recursos: { type: ResourceBucketSchema, default: () => ({}) },
    actividades: { type: [ActivitySchema], default: [] },
    retroalimentacion: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const MetadataSchema = new Schema(
  {
    lastUpdatedBy: {
      id: { type: Schema.Types.ObjectId, ref: "Usuario" },
      nombre: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    lastUpdatedAt: { type: Date },
  },
  { _id: false },
);

const CNBCourseContentSchema = new Schema(
  {
    areaId: { type: Schema.Types.ObjectId, ref: "CNBArea", required: true, index: true },
    grado: { type: String, required: true, enum: ["1B", "2B", "3B"], index: true },
    descripcion: { type: String, trim: true, default: "" },
    recursosGenerales: { type: ResourceBucketSchema, default: () => ({}) },
    temas: { type: [TopicSchema], default: [] },
    actividadesGenerales: { type: [ActivitySchema], default: [] },
    retroalimentacionGeneral: { type: String, trim: true, default: "" },
    metadata: { type: MetadataSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    minimize: false,
  },
);

CNBCourseContentSchema.index({ areaId: 1, grado: 1 }, { unique: true });

export default mongoose.model("CNBCourseContent", CNBCourseContentSchema);

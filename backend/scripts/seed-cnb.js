// ESM compatible con Node 22
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Area from "../models/CNB_Area.js";
import Comp from "../models/CNB_Competencia.js";
import Ind from "../models/CNB_Indicador.js";

// Cargar backend/.env SIN depender del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, "../.env");

console.log("→ Cargando .env:", ENV_PATH);
if (!fs.existsSync(ENV_PATH)) {
  console.error("❌ No existe backend/.env en esa ruta.");
  process.exit(1);
}
dotenv.config({ path: ENV_PATH });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI no definido en backend/.env");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Conectado a Mongo");

  // Limpia colecciones (solo en desarrollo)
  await Promise.all([Area.deleteMany({}), Comp.deleteMany({}), Ind.deleteMany({})]);

  const area = await Area.create({
    slug: "matematica",
    nombre: "Matemática",
    descripcion: "Malla CNB Ciclo Básico",
    fuente: { url: "https://cnbguatemala.org/wiki/CNB_Ciclo_Básico", version: "2025-01" }
  });

  const c1 = await Comp.create({
    areaId: area._id, grado: "1B", codigo: "MAT-C1",
    enunciado: "Resuelve problemas con operaciones con números y expresiones.", orden: 1
  });
  const c2 = await Comp.create({
    areaId: area._id, grado: "1B", codigo: "MAT-C2",
    enunciado: "Aplica álgebra básica en situaciones de contexto.", orden: 2
  });

  await Ind.insertMany([
    {
      areaId: area._id, competenciaId: c1._id, grado: "1B",
      codigo: "MAT-C1.1",
      descripcion: "Opera con enteros y fracciones en problemas cotidianos.",
      contenidos: [
        { codigo: "1.1.1", titulo: "Suma y resta de fracciones" },
        { codigo: "1.1.2", titulo: "Multiplicación y división de fracciones" }
      ],
      prerrequisitos: [],
      orden: 1,
      fuente: { url: area.fuente.url }
    },
    {
      areaId: area._id, competenciaId: c2._id, grado: "1B",
      codigo: "MAT-C2.1",
      descripcion: "Simplifica y factoriza expresiones polinómicas simples.",
      contenidos: [
        { codigo: "2.1.1", titulo: "Productos notables básicos" },
        { codigo: "2.1.2", titulo: "Factorización por factor común" }
      ],
      prerrequisitos: ["MAT-C1.1"],
      orden: 1,
      fuente: { url: area.fuente.url }
    }
  ]);

  console.log("🌱 CNB seed listo ✔");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Error en seed:", e);
  process.exit(1);
});

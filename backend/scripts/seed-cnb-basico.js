// backend/scripts/seed-cnb-basico.js
// Semilla mínima para llenar Áreas y Competencias del CNB (Ciclo Básico)
import "dotenv/config";
import mongoose from "mongoose";
import CNBArea from "../models/CNB_Area.js";
import CNBCompetencia from "../models/CNB_Competencia.js";

const AREAS = [
  { slug: "lengua-espanol", nombre: "Comunicación y Lenguaje Idioma Español" },
  { slug: "lengua-extranjero", nombre: "Comunicación y Lenguaje Idioma Extranjero" },
  { slug: "matematica", nombre: "Matemática" },
  { slug: "ciencias-naturales", nombre: "Ciencias Naturales" },
  { slug: "ciencias-sociales", nombre: "Ciencias Sociales, Formación Ciudadana e Interculturalidad" },
  { slug: "culturas-idiomas", nombre: "Culturas e Idiomas Maya, Garífuna o Xinca" },
  { slug: "educacion-artistica", nombre: "Educación Artística" },
  { slug: "educacion-fisica", nombre: "Educación Física" },
  { slug: "emprendimiento", nombre: "Emprendimiento para la Productividad" },
  { slug: "tecnologias-aprendizaje", nombre: "Tecnologías del Aprendizaje y la Comunicación" },
];

// Crea 3 competencias genéricas por área y por grado (1B/2B/3B)
function buildComps(areaId, baseSlug) {
  const grados = ["1B", "2B", "3B"];
  const result = [];
  for (const g of grados) {
    for (let i = 1; i <= 3; i++) {
      result.push({
        areaId,
        grado: g,
        codigo: `${baseSlug.toUpperCase()}-${g}-C${i}`,
        enunciado: `Competencia ${i} para ${baseSlug} (${g})`,
        orden: i,
      });
    }
  }
  return result;
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("❌ Falta MONGO_URI en el .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Conectado a Mongo");

  // Inserta áreas si no existen
  const existing = await CNBArea.countDocuments();
  if (!existing) {
    await CNBArea.insertMany(AREAS);
    console.log(`✅ Áreas insertadas: ${AREAS.length}`);
  } else {
    console.log(`ℹ️ Ya existen áreas: ${existing}`);
  }

  // Inserta competencias si no existen (por cada área)
  const areas = await CNBArea.find().lean();
  let total = 0;
  for (const a of areas) {
    const count = await CNBCompetencia.countDocuments({ areaId: a._id });
    if (count === 0) {
      const comps = buildComps(a._id, a.slug || "area");
      await CNBCompetencia.insertMany(comps);
      total += comps.length;
      console.log(`  • Competencias para ${a.nombre}: ${comps.length}`);
    } else {
      console.log(`  • ${a.nombre}: ya tiene ${count} competencias`);
    }
  }

  if (total > 0) console.log(`✅ Competencias insertadas: ${total}`);
  console.log("🎉 Seed CNB Básico completo.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// backend/routes/cnb.routes.js
import { Router } from "express";
import { authRequired } from "../middlewares/auth.middleware.js";
import CNBArea from "../models/CNB_Area.js";
import CNBCompetencia from "../models/CNB_Competencia.js";

// Si más adelante vinculas Recurso con el área, podrás contar recursos aquí
let Recurso = null;
try {
  Recurso = (await import("../models/Recurso.js")).default;
} catch {
  Recurso = null;
}

const router = Router();

// Mapas y utilidades
const gradoNumToCode = (n) => ({ 1: "1B", 2: "2B", 3: "3B" }[Number(n)] || null);

const buildSampleResources = (areaName, sourceUrl) => {
  const subject = areaName || "Área";
  const baseUrl = sourceUrl || "https://aprende.mineduc.gob.gt";
  return {
    videos: [
      {
        title: `${subject}: introducción guiada`,
        url: baseUrl,
        duration: "06:00",
      },
      {
        title: `${subject}: actividades prácticas`,
        url: baseUrl,
        duration: "08:30",
      },
    ],
    lecturas: [
      {
        title: `Guía de estudio de ${subject}`,
        url: baseUrl,
        description: "Resumen de los contenidos clave del CNB para reforzar desde casa.",
      },
      {
        title: `Planificación semanal de ${subject}`,
        url: baseUrl,
        description: "Secuencia sugerida de sesiones y actividades evaluables.",
      },
    ],
    ejercicios: [
      {
        title: `Cuestionario diagnóstico de ${subject}`,
        url: baseUrl,
        type: "Evaluación",
      },
      {
        title: `Taller interactivo de ${subject}`,
        url: baseUrl,
        type: "Práctica guiada",
      },
    ],
  };
};
const fallbackAreasBasico = [
  "Comunicación y Lenguaje Idioma Español",
  "Comunicación y Lenguaje Idioma Extranjero",
  "Matemática",
  "Ciencias Naturales",
  "Ciencias Sociales, Formación Ciudadana e Interculturalidad",
  "Culturas e Idiomas Maya, Garífuna o Xinca",
  "Educación Artística",
  "Educación Física",
  "Emprendimiento para la Productividad",
  "Tecnologías del Aprendizaje y la Comunicación",
];

// --------- Catálogos simples (útiles para depurar) ----------
router.get("/areas", authRequired, async (_req, res) => {
  const areas = await CNBArea.find().lean();
  res.json(areas);
});

router.get("/competencias", authRequired, async (req, res) => {
  const { areaSlug, grado } = req.query;
  const area = await CNBArea.findOne({ slug: areaSlug }).lean();
  if (!area) return res.status(404).json({ error: "Área no encontrada" });

  const q = { areaId: area._id };
  if (grado) q.grado = grado; // "1B" | "2B" | "3B"

  const comps = await CNBCompetencia.find(q).sort({ orden: 1 }).lean();
  res.json(comps);
});

// --------- Cursos del CNB por grado (lo que necesita el dashboard) ----------
/**
 * GET /api/cnb/basico/:grado/cursos
 * Grado: 1 | 2 | 3  => se mapea a 1B/2B/3B
 * Respuesta: [{ _id, titulo, area, competenciasCount, recursosCount, progreso }]
 */
router.get("/basico/:grado/cursos", authRequired, async (req, res) => {
  try {
    const code = gradoNumToCode(req.params.grado);
    if (!code) return res.status(400).json({ error: "Grado inválido (use 1, 2 o 3)" });

    // 1) Trae todas las áreas
    let areas = await CNBArea.find().lean();

    // 2) Si la colección aún está vacía, responde fallback (UI lista mientras corres el seed)
    if (!areas?.length) {
      const data = fallbackAreasBasico.map((name, i) => ({
        _id: `fallback-${code}-${i}`,
        slug: null,
        titulo: name,
        area: name,
        descripcion: `Colección de contenidos de ${name}.`,
        competenciasCount: 0,
        recursosCount: 0,
        progreso: 0,
      }));
      return res.json(data);
    }

    // 3) Cuenta competencias por área para el grado solicitado
    const results = await Promise.all(
      areas.map(async (a) => {
        const competenciasCount = await CNBCompetencia.countDocuments({
          areaId: a._id,
          grado: code, // "1B" | "2B" | "3B"
        }).catch(() => 0);

        // Por ahora 0 porque tu modelo Recurso no vincula área
        let recursosCount = 0;
        if (Recurso) {
          // TODO: cuando agregues areaId en Recurso, descomenta y ajusta:
          // recursosCount = await Recurso.countDocuments({ areaId: a._id }).catch(() => 0);
        }

        const progreso = 0; // en el futuro con tus colecciones de progreso/intentos
        const titulo = a?.nombre || a?.slug || "Área sin nombre";

        return {
          _id: String(a._id),
          slug: a?.slug || null,
          titulo,
          area: titulo,
          descripcion: a?.descripcion || null,
          competenciasCount,
          recursosCount,
          progreso,
        };
      })
    );

    // 4) Ordena por título para una UI estable
    results.sort((x, y) => x.titulo.localeCompare(y.titulo, "es"));
    res.json(results);
  } catch (err) {
    console.error("[CNB] GET /basico/:grado/cursos", err);
    res.status(500).json({ error: "Error al obtener cursos del CNB" });
  }
});

router.get("/basico/:grado/cursos/:areaId/contenidos", authRequired, async (req, res) => {
  try {
    const code = gradoNumToCode(req.params.grado);
    if (!code) return res.status(400).json({ error: "Grado inválido (use 1, 2 o 3)" });

    const { areaId } = req.params;
    let area = null;
    if (areaId?.startsWith("fallback")) {
      const index = Number(areaId.split("-").pop());
      const name = fallbackAreasBasico[index] || "Área sin nombre";
      area = {
        _id: areaId,
        nombre: name,
        descripcion: `Contenidos de ${name} alineados al Currículo Nacional Base de Guatemala.`,
        fuente: { url: "https://aprende.mineduc.gob.gt" },
        slug: null,
      };
    } else {
      area =
        (await CNBArea.findById(areaId).lean()) ||
        (await CNBArea.findOne({ slug: areaId }).lean());
    }

    if (!area) return res.status(404).json({ error: "Área no encontrada" });

    const competencias = await CNBCompetencia.find({
      areaId: area?._id,
      grado: code,
    })
      .sort({ orden: 1 })
      .lean()
      .catch(() => []);

    const response = {
      id: String(area._id || areaId),
      slug: area.slug || null,
      titulo: area.nombre || area.slug || "Área sin nombre",
      descripcion:
        area.descripcion ||
        `Colección de competencias, recursos y ejercicios de ${area.nombre || "esta área"} para ${code}.`,
      competencias: competencias.map((comp) => ({
        id: String(comp._id),
        codigo: comp.codigo,
        enunciado: comp.enunciado,
      })),
      recursos: buildSampleResources(area.nombre, area.fuente?.url),
    };

    res.json(response);
  } catch (err) {
    console.error("[CNB] GET /basico/:grado/cursos/:areaId/contenidos", err);
    res.status(500).json({ error: "Error al obtener contenidos del curso" });
  }
});

export default router;

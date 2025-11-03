// backend/routes/cnb.routes.js
import { Router } from "express";
import { authRequired } from "../middlewares/auth.middleware.js";
import CNBArea from "../models/CNB_Area.js";
import CNBCompetencia from "../models/CNB_Competencia.js";
import { getCuratedContentForArea } from "./cnbCuratedContent.js";

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
  const ejercicios = [
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
  ];
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
    ejercicios,
    cuestionarios: ejercicios,
  };
};

const toSentence = (text) => {
  if (!text) return "";
  const trimmed = String(text).trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const splitSubtopics = (text) => {
  if (!text) return [];
  return String(text)
    .split(/[\.;•\n-]/)
    .map((item) => item.replace(/^[\s•-]+/, "").trim())
    .filter(Boolean)
    .map((item) => toSentence(item));
};

const buildActivitiesForTopic = (areaName, topicTitle, firstSubtopic) => {
  const focus = firstSubtopic || topicTitle || areaName;
  const base = areaName || "el área";
  return [
    {
      tipo: "Actividad guiada",
      descripcion: `Elabora un mapa conceptual sobre ${focus} utilizando los recursos proporcionados del CNB de ${base}.`,
    },
    {
      tipo: "Evaluación rápida",
      descripcion: `Resuelve el cuestionario sugerido para comprobar tu comprensión de ${focus} antes de avanzar al siguiente tema.`,
    },
  ];
};

const buildFeedbackForTopic = (topicTitle, areaName) => {
  const focus = topicTitle || areaName || "este tema";
  return `Si necesitas reforzar ${focus}, repasa los videos y lecturas sugeridas y vuelve a intentar la actividad de evaluación.`;
};

const assignResourcesToTopic = (resources, index) => {
  if (!resources) return {};
  const pick = (list) => {
    if (!Array.isArray(list) || !list.length) return [];
    const item = list[index % list.length];
    return item ? [item] : [];
  };
  return {
    videos: pick(resources.videos),
    lecturas: pick(resources.lecturas),
    cuestionarios: pick(resources.cuestionarios || resources.ejercicios),
  };
};

const buildFallbackTopics = (areaName, resources) => {
  const subject = areaName || "Curso";
  return [
    {
      titulo: `${subject}: fundamentos`,
      subtitulos: [
        "Objetivos de aprendizaje",
        "Conceptos clave",
        "Vocabulario necesario",
      ],
      recursos: assignResourcesToTopic(resources, 0),
      actividades: buildActivitiesForTopic(subject, `${subject}: fundamentos`, "conceptos clave"),
      retroalimentacion: buildFeedbackForTopic(`${subject}: fundamentos`, subject),
    },
    {
      titulo: `${subject}: aplicación práctica`,
      subtitulos: [
        "Resolución de ejercicios",
        "Trabajo colaborativo",
        "Autoevaluación",
      ],
      recursos: assignResourcesToTopic(resources, 1),
      actividades: buildActivitiesForTopic(subject, `${subject}: aplicación práctica`, "resolución de ejercicios"),
      retroalimentacion: buildFeedbackForTopic(`${subject}: aplicación práctica`, subject),
    },
  ];
};

const buildTopicsFromCompetencias = ({ areaName, competencias, resources }) => {
  if (!Array.isArray(competencias) || !competencias.length) {
    return buildFallbackTopics(areaName, resources);
  }

  return competencias.map((comp, index) => {
    const subtopics = splitSubtopics(comp?.enunciado);
    const tituloBase = comp?.codigo ? `${comp.codigo} · ${toSentence(subtopics[0] || comp.enunciado)}` : null;
    const titulo = tituloBase || toSentence(comp?.enunciado) || `Tema ${index + 1}`;
    return {
      id: String(comp?._id || index),
      codigo: comp?.codigo || null,
      titulo,
      subtitulos: subtopics,
      recursos: assignResourcesToTopic(resources, index),
      actividades: buildActivitiesForTopic(areaName, titulo, subtopics[0]),
      retroalimentacion: buildFeedbackForTopic(titulo, areaName),
    };
  });
};

const buildGeneralActivities = (temas, areaName) => {
  if (!Array.isArray(temas) || !temas.length) return [];
  const subject = areaName || "el curso";
  return temas.slice(0, 3).map((tema, index) => ({
    tipo: `Seguimiento ${index + 1}`,
    descripcion: `Comparte evidencias de tu avance en "${tema.titulo}" y reflexiona sobre qué necesitas reforzar antes de continuar con ${subject}.`,
  }));
};

const buildGeneralFeedback = (areaName) => {
  const subject = areaName || "el curso";
  return `Recuerda que puedes repetir los cuestionarios y revisar las lecturas cuando necesites reforzar ${subject}. Cada tema debe dominarse antes de pasar al siguiente.`;
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

    const curated = getCuratedContentForArea(area);
    const curatedResources = curated?.recursos || curated?.resources || null;
    const recursos =
      curatedResources || buildSampleResources(area.nombre, curated?.sourceUrl || area.fuente?.url);
    const competenciasNormalizadas = competencias.map((comp) => ({
      id: String(comp._id),
      codigo: comp.codigo,
      enunciado: comp.enunciado,
    }));

    const temas =
      curated?.temas ||
      buildTopicsFromCompetencias({
        areaName: area.nombre,
        competencias: competenciasNormalizadas,
        resources: recursos,
      });

    const actividadesGenerales =
      curated?.actividadesGenerales || buildGeneralActivities(temas, area.nombre);
    const retroalimentacionGeneral =
      curated?.retroalimentacionGeneral || buildGeneralFeedback(area.nombre);

    const descripcionDetallada =
      curated?.descripcion ||
      area.descripcion ||
      `Colección de competencias, recursos y ejercicios de ${area.nombre || "esta área"} para ${code}.`;

    const response = {
      id: String(area._id || areaId),
      slug: area.slug || null,
      titulo: area.nombre || area.slug || "Área sin nombre",
      descripcion: descripcionDetallada,
      competencias: competenciasNormalizadas,
      recursos,
      temas,
      actividades: actividadesGenerales,
      retroalimentacion: retroalimentacionGeneral,
    };

    res.json(response);
  } catch (err) {
    console.error("[CNB] GET /basico/:grado/cursos/:areaId/contenidos", err);
    res.status(500).json({ error: "Error al obtener contenidos del curso" });
  }
});

export default router;

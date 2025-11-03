// backend/routes/cnb.routes.js
import { Router } from "express";
import { authRequired } from "../middlewares/auth.middleware.js";
import CNBArea from "../models/CNB_Area.js";
import CNBCompetencia from "../models/CNB_Competencia.js";
import CNBIndicador from "../models/CNB_Indicador.js";
import CNBCourseContent from "../models/CNBCourseContent.js";
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

const emptyResources = () => ({
  videos: [],
  lecturas: [],
  ejercicios: [],
  cuestionarios: [],
  otros: [],
});

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
    const providedSubtopics = Array.isArray(comp?.subtitulos) ? comp.subtitulos : [];
    const subtopics = providedSubtopics.length
      ? providedSubtopics.map((item) => toSentence(item)).filter(Boolean)
      : splitSubtopics(comp?.enunciado);
    const tituloBase = comp?.codigo ? `${comp.codigo} · ${toSentence(subtopics[0] || comp.enunciado)}` : null;
    const titulo = tituloBase || toSentence(comp?.enunciado) || `Tema ${index + 1}`;
    const indicadorIds = Array.isArray(comp?.indicadorIds)
      ? comp.indicadorIds.map((id) => id?.toString?.()).filter(Boolean)
      : [];
    return {
      id: String(comp?._id || index),
      codigo: comp?.codigo || null,
      titulo,
      subtitulos: subtopics,
      indicadorIds,
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

const mapResourceFromDb = (resource) => ({
  id: resource?._id ? resource._id.toString() : undefined,
  title: resource?.titulo || resource?.title || "",
  url: resource?.url || "",
  description:
    resource?.descripcion || resource?.description || resource?.proveedor || resource?.source || "",
  duration:
    resource?.duracion ||
    resource?.duracionTexto ||
    resource?.duration ||
    (resource?.duracionMin ? `${resource.duracionMin} min` : resource?.length || ""),
  proveedor: resource?.proveedor || resource?.provider || "",
  tipo: resource?.tipo || resource?.type || "",
});

const groupResourcesByType = (items = []) => {
  const result = emptyResources();
  for (const item of items) {
    const mapped = mapResourceFromDb(item);
    if (!mapped.title || !mapped.url) continue;
    const tipo = String(mapped.tipo || "").toLowerCase();
    if (["video", "videos"].includes(tipo)) result.videos.push(mapped);
    else if (["lectura", "articulo", "artículo", "texto"].includes(tipo)) result.lecturas.push(mapped);
    else if (["ejercicio", "practica", "práctica"].includes(tipo)) result.ejercicios.push(mapped);
    else if (["quiz", "cuestionario", "evaluacion", "evaluación", "evaluacion diagnostica"].includes(tipo))
      result.cuestionarios.push(mapped);
    else result.otros.push(mapped);
  }
  return result;
};

const normalizeBucket = (bucket = {}) => {
  const result = emptyResources();
  for (const key of Object.keys(result)) {
    const items = Array.isArray(bucket[key]) ? bucket[key] : [];
    result[key] = items
      .map((item) => mapResourceFromDb(item))
      .filter((item) => item.title && item.url);
  }
  return result;
};

const mergeResourceBuckets = (...buckets) => {
  const result = emptyResources();
  const seen = new Set();

  for (const bucket of buckets) {
    if (!bucket) continue;
    const normalized = normalizeBucket(bucket);
    for (const key of Object.keys(result)) {
      for (const item of normalized[key]) {
        const identifier = `${key}|${(item.title || "").toLowerCase()}|${item.url}`;
        if (seen.has(identifier)) continue;
        seen.add(identifier);
        result[key].push(item);
      }
    }
  }

  return result;
};

const mapActivity = (activity) => {
  if (!activity) return null;
  const tipo = activity?.tipo || activity?.title || activity?.name;
  const descripcion = activity?.descripcion || activity?.description || activity?.detalle;
  if (!tipo || !descripcion) return null;
  return {
    tipo,
    descripcion,
  };
};

const mergeActivities = (...lists) => {
  const result = [];
  const seen = new Set();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const activity of list) {
      const mapped = mapActivity(activity);
      if (!mapped) continue;
      const key = `${mapped.tipo.toLowerCase()}|${mapped.descripcion}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(mapped);
    }
  }
  return result;
};

const buildIndicatorResourceMap = (resources = []) => {
  const map = new Map();
  for (const resource of resources) {
    const mapped = mapResourceFromDb(resource);
    if (!mapped.title || !mapped.url) continue;
    const ids = [];
    if (resource?.indicadorId) ids.push(String(resource.indicadorId));
    if (Array.isArray(resource?.indicadorIds)) {
      for (const id of resource.indicadorIds) {
        if (!id) continue;
        ids.push(String(id));
      }
    }
    for (const id of ids) {
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(resource);
    }
  }
  return map;
};

const collectResourcesForIndicators = (resourceMap, indicadorIds = []) => {
  if (!indicadorIds?.length) return emptyResources();
  const docs = [];
  for (const id of indicadorIds) {
    const key = String(id);
    const items = resourceMap.get(key);
    if (items?.length) docs.push(...items);
  }
  return groupResourcesByType(docs);
};

const normalizeSubtopicsFromIndicator = (indicator) => {
  const subtitles = [];
  if (indicator?.descripcion) {
    subtitles.push(toSentence(indicator.descripcion));
  }
  if (Array.isArray(indicator?.contenidos)) {
    for (const content of indicator.contenidos) {
      const title = content?.titulo || content?.title || content?.descripcion;
      if (title) subtitles.push(toSentence(title));
    }
  }
  return subtitles;
};

const normalizeTopicFromDoc = (topic) => {
  if (!topic) return null;
  const titulo = topic?.titulo || topic?.name;
  if (!titulo) return null;

  const subtitulos = Array.isArray(topic?.subtitulos)
    ? topic.subtitulos.map((item) => toSentence(item)).filter(Boolean)
    : [];

  const indicadorIds = Array.isArray(topic?.indicadorIds)
    ? topic.indicadorIds.map((id) => id?.toString?.()).filter(Boolean)
    : [];

  return {
    id: topic?._id?.toString?.() || topic?.id || titulo,
    codigo: topic?.codigo || null,
    titulo,
    subtitulos,
    descripcion: topic?.descripcion || "",
    indicadorIds,
    recursos: normalizeBucket(topic?.recursos),
    actividades: mergeActivities(topic?.actividades),
    retroalimentacion: topic?.retroalimentacion || "",
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

    const [competencias, indicadores, personalizado] = await Promise.all([
      CNBCompetencia.find({ areaId: area?._id, grado: code }).sort({ orden: 1 }).lean(),
      CNBIndicador.find({ areaId: area?._id, grado: code }).sort({ orden: 1 }).lean(),
      CNBCourseContent.findOne({ areaId: area?._id, grado: code }).lean(),
    ]);

    const competenciasNormalizadas = competencias.map((comp) => ({
      _id: comp._id,
      id: String(comp._id),
      codigo: comp.codigo,
      enunciado: comp.enunciado,
    }));

    const indicadorIds = indicadores.map((item) => item._id);
    let recursosDocs = [];
    if (Recurso && indicadorIds.length && !areaId?.startsWith("fallback")) {
      try {
        recursosDocs = await Recurso.find({
          activo: { $ne: false },
          $or: [
            { indicadorId: { $in: indicadorIds } },
            { indicadorIds: { $elemMatch: { $in: indicadorIds } } },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();
      } catch {
        recursosDocs = [];
      }
    }

    const recursosPorIndicador = buildIndicatorResourceMap(recursosDocs);
    const recursosGeneralesDb = groupResourcesByType(recursosDocs);

    const curated = getCuratedContentForArea(area) || null;

    const recursosGenerales = mergeResourceBuckets(
      recursosGeneralesDb,
      personalizado?.recursosGenerales,
      // Solo usamos recursos del curado si tienen URL válidas
      curated?.recursos && normalizeBucket(curated.recursos),
    );

    const temasPersonalizados = Array.isArray(personalizado?.temas)
      ? personalizado.temas
          .map((topic) => normalizeTopicFromDoc(topic))
          .filter(Boolean)
          .map((topic) => ({
            ...topic,
            recursos: mergeResourceBuckets(
              topic.recursos,
              collectResourcesForIndicators(recursosPorIndicador, topic.indicadorIds),
            ),
          }))
      : [];

    const actividadesGenerales =
      mergeActivities(
        personalizado?.actividadesGenerales,
        curated?.actividadesGenerales,
        buildGeneralActivities(temasPersonalizados, area.nombre),
      ) || [];

    const retroalimentacionGeneral =
      personalizado?.retroalimentacionGeneral ||
      curated?.retroalimentacionGeneral ||
      buildGeneralFeedback(area.nombre);

    const descripcionDetallada =
      personalizado?.descripcion ||
      curated?.descripcion ||
      area.descripcion ||
      `Colección de competencias, recursos y ejercicios de ${area.nombre || "esta área"} para ${code}.`;

    const indicadoresPorCompetencia = indicadores.reduce((acc, indicador) => {
      const compId = indicador?.competenciaId ? indicador.competenciaId.toString() : "otros";
      if (!acc.has(compId)) acc.set(compId, []);
      acc.get(compId).push(indicador);
      return acc;
    }, new Map());

    const temasDesdeCompetencias = buildTopicsFromCompetencias({
      areaName: area.nombre,
      competencias: competenciasNormalizadas.map((comp) => ({
        ...comp,
        subtitulos: (indicadoresPorCompetencia.get(comp.id) || [])
          .flatMap((indicator) => normalizeSubtopicsFromIndicator(indicator))
          .filter(Boolean),
        indicadorIds: (indicadoresPorCompetencia.get(comp.id) || []).map((ind) => ind._id),
      })),
      resources: recursosGenerales,
    }).map((topic) => ({
      ...topic,
      indicadorIds: Array.isArray(topic.indicadorIds)
        ? topic.indicadorIds.map((id) => id?.toString?.()).filter(Boolean)
        : [],
      recursos: mergeResourceBuckets(
        topic.recursos,
        collectResourcesForIndicators(recursosPorIndicador, topic.indicadorIds),
      ),
    }));

    let temas = temasPersonalizados;
    if (!temas.length) {
      const curatedTopics = Array.isArray(curated?.temas)
        ? curated.temas
            .map((topic) => normalizeTopicFromDoc(topic))
            .filter(Boolean)
            .map((topic) => ({
              ...topic,
              recursos: mergeResourceBuckets(
                topic.recursos,
                collectResourcesForIndicators(recursosPorIndicador, topic.indicadorIds),
              ),
            }))
        : [];

      if (curatedTopics.length) {
        temas = curatedTopics;
      } else {
        temas = temasDesdeCompetencias;
      }
    }

    if (!temas.length) {
      temas = buildFallbackTopics(area.nombre, recursosGenerales);
    }

    const response = {
      id: String(area._id || areaId),
      slug: area.slug || null,
      titulo: area.nombre || area.slug || "Área sin nombre",
      descripcion: descripcionDetallada,
      competencias: competenciasNormalizadas,
      recursos: recursosGenerales,
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

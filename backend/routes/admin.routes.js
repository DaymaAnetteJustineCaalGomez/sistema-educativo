// backend/routes/admin.routes.js
import { Router } from "express";
import mongoose from "mongoose";

import { authRequired, allowRoles } from "../middlewares/auth.middleware.js";
import { Usuario, ROLES } from "../models/Usuario.js";
import CNBArea from "../models/CNB_Area.js";
import CNBCompetencia from "../models/CNB_Competencia.js";
import CNBIndicador from "../models/CNB_Indicador.js";
import Recurso from "../models/Recurso.js";
import CNBCourseContent from "../models/CNBCourseContent.js";

const router = Router();

const gradoToCode = (grado) => {
  if (!grado && grado !== 0) return null;
  const text = String(grado).trim().toUpperCase();
  if (["1", "1B", "PRIMERO", "PRIMERO B"].includes(text)) return "1B";
  if (["2", "2B", "SEGUNDO", "SEGUNDO B"].includes(text)) return "2B";
  if (["3", "3B", "TERCERO", "TERCERO B"].includes(text)) return "3B";
  return null;
};

const sanitizeString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const sanitizeResource = (payload = {}) => {
  const titulo = sanitizeString(payload.titulo);
  const url = sanitizeString(payload.url);
  if (!titulo || !url) return null;
  return {
    tipo: sanitizeString(payload.tipo) || "recurso",
    titulo,
    descripcion: sanitizeString(payload.descripcion),
    url,
    duracion: sanitizeString(payload.duracion),
    proveedor: sanitizeString(payload.proveedor),
  };
};

const sanitizeResourcesBucket = (bucket = {}) => {
  const result = { videos: [], lecturas: [], ejercicios: [], cuestionarios: [], otros: [] };
  for (const key of Object.keys(result)) {
    const items = Array.isArray(bucket[key]) ? bucket[key] : [];
    result[key] = items
      .map((item) => sanitizeResource(item))
      .filter(Boolean);
  }
  return result;
};

const sanitizeActivity = (payload = {}) => {
  const tipo = sanitizeString(payload.tipo);
  const descripcion = sanitizeString(payload.descripcion);
  if (!tipo || !descripcion) return null;
  return { tipo, descripcion };
};

const sanitizeActivities = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => sanitizeActivity(item)).filter(Boolean);
};

const sanitizeTopic = (payload = {}) => {
  const titulo = sanitizeString(payload.titulo);
  if (!titulo) return null;
  const subtitulos = Array.isArray(payload.subtitulos)
    ? payload.subtitulos.map((item) => sanitizeString(item)).filter(Boolean)
    : sanitizeString(payload.subtitulos)
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

  const indicadorIds = Array.isArray(payload.indicadorIds)
    ? payload.indicadorIds
        .map((id) => {
          try {
            return new mongoose.Types.ObjectId(String(id));
          } catch (err) {
            return null;
          }
        })
        .filter(Boolean)
    : [];

  return {
    titulo,
    descripcion: sanitizeString(payload.descripcion),
    subtitulos,
    indicadorIds,
    recursos: sanitizeResourcesBucket(payload.recursos),
    actividades: sanitizeActivities(payload.actividades),
    retroalimentacion: sanitizeString(payload.retroalimentacion),
  };
};

const sanitizeTopics = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => sanitizeTopic(item)).filter(Boolean);
};

const resolveArea = async (areaId) => {
  if (!areaId) return null;
  let area = null;
  if (mongoose.Types.ObjectId.isValid(areaId)) {
    area = await CNBArea.findById(areaId).lean();
  }
  if (!area) {
    area = await CNBArea.findOne({ slug: areaId }).lean();
  }
  return area;
};

const extractIndicatorIdsFromResource = (resource) => {
  const ids = [];
  if (resource?.indicadorId) {
    ids.push(resource.indicadorId.toString());
  }
  if (Array.isArray(resource?.indicadorIds)) {
    for (const id of resource.indicadorIds) {
      if (!id) continue;
      try {
        ids.push(new mongoose.Types.ObjectId(id).toString());
      } catch {
        ids.push(String(id));
      }
    }
  }
  return Array.from(new Set(ids));
};

const sanitizeBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "sí", "si", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return undefined;
};

const parseDurationToMinutes = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const text = sanitizeString(value);
  if (!text) return undefined;

  if (/^\d+:\d+$/.test(text)) {
    const [minutes, seconds] = text.split(":").map((n) => Number(n));
    if (Number.isFinite(minutes)) {
      const secs = Number.isFinite(seconds) ? seconds : 0;
      return Math.max(0, Math.round(minutes + secs / 60));
    }
  }

  const lower = text.toLowerCase();
  let totalMinutes = 0;
  const hoursMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*h/);
  if (hoursMatch) {
    totalMinutes += parseFloat(hoursMatch[1].replace(",", ".")) * 60;
  }
  const minutesMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*m/);
  if (minutesMatch) {
    totalMinutes += parseFloat(minutesMatch[1].replace(",", "."));
  }
  const secondsMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*s/);
  if (secondsMatch) {
    totalMinutes += parseFloat(secondsMatch[1].replace(",", ".")) / 60;
  }

  if (totalMinutes > 0) {
    return Math.round(totalMinutes);
  }

  const numeric = Number(text.replace(",", "."));
  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.round(numeric));
  }

  return undefined;
};

const parseOrderValue = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const sanitizeResourceDocument = (payload = {}, allowedIndicatorIds = new Set()) => {
  const tipo = sanitizeString(payload.tipo) || "recurso";
  const titulo = sanitizeString(payload.titulo);
  const url = sanitizeString(payload.url);
  if (!titulo || !url) return null;

  const descripcion = sanitizeString(payload.descripcion);
  const proveedor = sanitizeString(payload.proveedor);
  const duracionTexto = sanitizeString(payload.duracion || payload.duracionTexto);
  const indicadorRaw = Array.isArray(payload.indicadorIds)
    ? payload.indicadorIds
    : Array.isArray(payload.indicadores)
      ? payload.indicadores
      : payload.indicadorId
        ? [payload.indicadorId]
        : [];

  const indicatorIds = indicadorRaw
    .map((id) => {
      try {
        const objectId = new mongoose.Types.ObjectId(String(id));
        if (allowedIndicatorIds.size && !allowedIndicatorIds.has(objectId.toString())) {
          return null;
        }
        return objectId;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (allowedIndicatorIds.size && !indicatorIds.length) {
    return null;
  }

  const doc = {
    tipo,
    titulo,
    url,
  };

  if (descripcion) doc.descripcion = descripcion;
  if (proveedor) doc.proveedor = proveedor;
  if (duracionTexto) doc.duracionTexto = duracionTexto;

  const durationMinutes = parseDurationToMinutes(duracionTexto ?? payload.duracionMin);
  if (durationMinutes !== undefined) {
    doc.duracionMin = durationMinutes;
  }

  if (indicatorIds.length === 1) {
    doc.indicadorId = indicatorIds[0];
  }
  if (indicatorIds.length) {
    doc.indicadorIds = indicatorIds;
  }

  const activo = sanitizeBoolean(payload.activo);
  if (typeof activo === "boolean") {
    doc.activo = activo;
  }

  return { doc, indicatorIds };
};

const mapResourceWithIndicators = (resource, indicatorsMap) => {
  const indicatorIds = extractIndicatorIdsFromResource(resource);
  const indicadores = indicatorIds.map((id) => {
    const indicator = indicatorsMap.get(id) || {};
    return {
      id,
      codigo: indicator.codigo || "",
      descripcion: indicator.descripcion || "",
    };
  });

  const durationString =
    resource?.duracionTexto ||
    (resource?.duracionMin && Number(resource.duracionMin) > 0
      ? `${resource.duracionMin} min`
      : "");

  return {
    id: resource?._id?.toString?.(),
    tipo: resource?.tipo || "recurso",
    titulo: resource?.titulo || "",
    descripcion: resource?.descripcion || "",
    proveedor: resource?.proveedor || "",
    url: resource?.url || "",
    duracion: durationString,
    duracionTexto: resource?.duracionTexto || "",
    duracionMin: resource?.duracionMin || 0,
    indicadorIds,
    indicadores,
    activo: resource?.activo !== false,
    createdAt: resource?.createdAt,
    updatedAt: resource?.updatedAt,
  };
};

router.use(authRequired, allowRoles("ADMIN"));

// ---------------- Usuarios ----------------
router.get("/users", async (_req, res, next) => {
  try {
    const users = await Usuario.find()
      .select("nombre email rol grado createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const { nombre, email, password, rol, grado } = req.body || {};

    if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });
    if (!email) return res.status(400).json({ error: "El correo es obligatorio" });
    if (!password || String(password).length < 8)
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });

    const targetRole = String(rol || "ESTUDIANTE").toUpperCase();
    if (!ROLES.includes(targetRole)) {
      return res.status(400).json({ error: `Rol inválido. Use uno de ${ROLES.join(", ")}` });
    }

    const existing = await Usuario.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Ya existe un usuario con este correo" });
    }

    const payload = new Usuario({
      nombre: sanitizeString(nombre),
      email: String(email).toLowerCase(),
      password: String(password),
      rol: targetRole,
    });

    const gradoCode = gradoToCode(grado);
    if (gradoCode) {
      payload.grado = Number(gradoCode[0]);
    }

    await payload.save();

    res.status(201).json({
      user: {
        id: payload._id,
        nombre: payload.nombre,
        email: payload.email,
        rol: payload.rol,
        grado: payload.grado,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Id inválido" });
    }

    const updates = {};
    if (req.body?.nombre) updates.nombre = sanitizeString(req.body.nombre);
    if (req.body?.rol) {
      const targetRole = String(req.body.rol).toUpperCase();
      if (!ROLES.includes(targetRole)) {
        return res.status(400).json({ error: `Rol inválido. Use uno de ${ROLES.join(", ")}` });
      }
      updates.rol = targetRole;
    }
    if (req.body?.grado !== undefined) {
      const gradoCode = gradoToCode(req.body.grado);
      updates.grado = gradoCode ? Number(gradoCode[0]) : null;
    }

    if (req.body?.password) {
      const password = String(req.body.password);
      if (password.length < 8) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
      }
      updates.password = password;
    }

    const user = await Usuario.findById(id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    Object.assign(user, updates);
    await user.save();

    res.json({
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        grado: user.grado,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------------- Roles ----------------
router.get("/roles", async (_req, res, next) => {
  try {
    const aggregation = await Usuario.aggregate([
      {
        $group: {
          _id: "$rol",
          total: { $sum: 1 },
        },
      },
    ]);

    const counts = Object.fromEntries(aggregation.map((item) => [item._id, item.total]));
    const roles = ROLES.map((role) => ({
      rol: role,
      total: counts[role] || 0,
    }));

    res.json({ roles });
  } catch (err) {
    next(err);
  }
});

// ---------------- Catálogo CNB ----------------
router.get("/catalog/areas", async (_req, res, next) => {
  try {
    const areas = await CNBArea.find()
      .select("nombre slug descripcion")
      .sort({ nombre: 1 })
      .lean();
    res.json({ areas });
  } catch (err) {
    next(err);
  }
});

const mapResourceFromDb = (resource) => ({
  id: resource._id?.toString?.(),
  title: resource.titulo,
  url: resource.url,
  description: resource.descripcion || resource.proveedor || "",
  duration:
    resource.duracionTexto ||
    (resource.duracionMin && Number(resource.duracionMin) > 0 ? `${resource.duracionMin} min` : ""),
  duracionTexto: resource.duracionTexto || "",
  tipo: resource.tipo,
  proveedor: resource.proveedor || "",
});

const groupResourcesByType = (items = []) => {
  const result = { videos: [], lecturas: [], ejercicios: [], cuestionarios: [], otros: [] };
  for (const item of items) {
    const tipo = String(item.tipo || "").toLowerCase();
    const mapped = mapResourceFromDb(item);
    if (["video", "videos"].includes(tipo)) result.videos.push(mapped);
    else if (["lectura", "articulo", "texto"].includes(tipo)) result.lecturas.push(mapped);
    else if (["ejercicio", "practica"].includes(tipo)) result.ejercicios.push(mapped);
    else if (["quiz", "cuestionario", "evaluacion", "evaluación"].includes(tipo))
      result.cuestionarios.push(mapped);
    else result.otros.push(mapped);
  }
  return result;
};

router.get("/catalog/areas/:areaId/contenidos", async (req, res, next) => {
  try {
    const { areaId } = req.params;
    const gradoCode = gradoToCode(req.query.grado);
    if (!gradoCode) {
      return res.status(400).json({ error: "Grado inválido. Use 1, 2 o 3." });
    }

    const area = await resolveArea(areaId);
    if (!area) return res.status(404).json({ error: "Área no encontrada" });

    const [competencias, indicadores, contenido] = await Promise.all([
      CNBCompetencia.find({ areaId: area._id, grado: gradoCode }).sort({ orden: 1 }).lean(),
      CNBIndicador.find({ areaId: area._id, grado: gradoCode }).sort({ orden: 1 }).lean(),
      CNBCourseContent.findOne({ areaId: area._id, grado: gradoCode }).lean(),
    ]);

    const indicadorIds = indicadores.map((item) => item._id);
    let recursosDb = [];
    if (indicadorIds.length) {
      recursosDb = await Recurso.find({
        activo: { $ne: false },
        $or: [
          { indicadorId: { $in: indicadorIds } },
          { indicadorIds: { $elemMatch: { $in: indicadorIds } } },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    const groupedResources = groupResourcesByType(recursosDb);

    res.json({
      area: {
        id: area._id,
        nombre: area.nombre,
        descripcion: area.descripcion,
        slug: area.slug,
      },
      grado: gradoCode,
      competencias,
      indicadores,
      recursos: groupedResources,
      contenido: contenido || null,
    });
  } catch (err) {
    next(err);
  }
});

router.put("/catalog/areas/:areaId/contenidos", async (req, res, next) => {
  try {
    const { areaId } = req.params;
    const gradoCode = gradoToCode(req.body?.grado ?? req.query?.grado);
    if (!gradoCode) {
      return res.status(400).json({ error: "Grado inválido. Use 1, 2 o 3." });
    }

    const area = await resolveArea(areaId);
    if (!area) return res.status(404).json({ error: "Área no encontrada" });

    const payload = {
      descripcion: sanitizeString(req.body?.descripcion),
      recursosGenerales: sanitizeResourcesBucket(req.body?.recursosGenerales),
      temas: sanitizeTopics(req.body?.temas),
      actividadesGenerales: sanitizeActivities(req.body?.actividadesGenerales),
      retroalimentacionGeneral: sanitizeString(req.body?.retroalimentacionGeneral),
      metadata: {
        lastUpdatedBy: {
          id: req.user.id,
          nombre: req.user.nombre,
          email: req.user.email,
        },
        lastUpdatedAt: new Date(),
      },
    };

    const doc = await CNBCourseContent.findOneAndUpdate(
      { areaId: area._id, grado: gradoCode },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ contenido: doc });
  } catch (err) {
    next(err);
  }
});

// ---------------- Competencias ----------------
router.get("/catalog/areas/:areaId/competencias", async (req, res, next) => {
  try {
    const { areaId } = req.params;
    const gradoCode = gradoToCode(req.query?.grado);
    if (!gradoCode) {
      return res.status(400).json({ error: "Grado inválido. Use 1, 2 o 3." });
    }

    const area = await resolveArea(areaId);
    if (!area) return res.status(404).json({ error: "Área no encontrada" });

    const competencias = await CNBCompetencia.find({ areaId: area._id, grado: gradoCode })
      .sort({ orden: 1, createdAt: 1 })
      .lean();

    res.json({ competencias });
  } catch (err) {
    next(err);
  }
});

router.post("/catalog/areas/:areaId/competencias", async (req, res, next) => {
  try {
    const { areaId } = req.params;
    const gradoCode = gradoToCode(req.body?.grado ?? req.query?.grado);
    if (!gradoCode) {
      return res.status(400).json({ error: "Grado inválido. Use 1, 2 o 3." });
    }

    const area = await resolveArea(areaId);
    if (!area) return res.status(404).json({ error: "Área no encontrada" });

    const codigo = sanitizeString(req.body?.codigo);
    const enunciado = sanitizeString(req.body?.enunciado);
    if (!codigo || !enunciado) {
      return res.status(400).json({ error: "Código y enunciado son obligatorios" });
    }

    const competencia = new CNBCompetencia({
      areaId: area._id,
      grado: gradoCode,
      codigo,
      enunciado,
    });

    const orden = parseOrderValue(req.body?.orden);
    if (orden !== undefined) {
      competencia.orden = orden;
    }

    await competencia.save();

    res.status(201).json({ competencia });
  } catch (err) {
    next(err);
  }
});

router.patch("/catalog/competencias/:competenciaId", async (req, res, next) => {
  try {
    const { competenciaId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(competenciaId)) {
      return res.status(404).json({ error: "Competencia no encontrada" });
    }

    const updates = {};
    const codigo = sanitizeString(req.body?.codigo);
    if (codigo) updates.codigo = codigo;
    const enunciado = sanitizeString(req.body?.enunciado);
    if (enunciado) updates.enunciado = enunciado;
    const orden = parseOrderValue(req.body?.orden);
    if (orden !== undefined) updates.orden = orden;
    const grado = gradoToCode(req.body?.grado);
    if (grado) updates.grado = grado;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "No se proporcionaron cambios" });
    }

    const competencia = await CNBCompetencia.findByIdAndUpdate(
      competenciaId,
      { $set: updates },
      { new: true },
    );

    if (!competencia) {
      return res.status(404).json({ error: "Competencia no encontrada" });
    }

    res.json({ competencia });
  } catch (err) {
    next(err);
  }
});

router.delete("/catalog/competencias/:competenciaId", async (req, res, next) => {
  try {
    const { competenciaId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(competenciaId)) {
      return res.status(404).json({ error: "Competencia no encontrada" });
    }

    const deleted = await CNBCompetencia.findByIdAndDelete(competenciaId);
    if (!deleted) {
      return res.status(404).json({ error: "Competencia no encontrada" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---------------- Recursos ----------------
router.get("/catalog/areas/:areaId/recursos", async (req, res, next) => {
  try {
    const { areaId } = req.params;
    const gradoCode = gradoToCode(req.query?.grado);
    if (!gradoCode) {
      return res.status(400).json({ error: "Grado inválido. Use 1, 2 o 3." });
    }

    const area = await resolveArea(areaId);
    if (!area) return res.status(404).json({ error: "Área no encontrada" });

    const indicadores = await CNBIndicador.find({ areaId: area._id, grado: gradoCode })
      .sort({ orden: 1 })
      .lean();

    const indicatorIds = indicadores.map((item) => item._id);
    let recursos = [];
    if (indicatorIds.length) {
      recursos = await Recurso.find({
        $or: [
          { indicadorId: { $in: indicatorIds } },
          { indicadorIds: { $elemMatch: { $in: indicatorIds } } },
        ],
      })
        .sort({ updatedAt: -1 })
        .lean();
    }

    const indicatorMap = new Map(indicadores.map((item) => [item._id.toString(), item]));
    const recursosFormateados = recursos.map((resource) => mapResourceWithIndicators(resource, indicatorMap));

    res.json({ recursos: recursosFormateados, indicadores });
  } catch (err) {
    next(err);
  }
});

router.post("/catalog/areas/:areaId/recursos", async (req, res, next) => {
  try {
    const { areaId } = req.params;
    const gradoCode = gradoToCode(req.body?.grado ?? req.query?.grado);
    if (!gradoCode) {
      return res.status(400).json({ error: "Grado inválido. Use 1, 2 o 3." });
    }

    const area = await resolveArea(areaId);
    if (!area) return res.status(404).json({ error: "Área no encontrada" });

    const indicadores = await CNBIndicador.find({ areaId: area._id, grado: gradoCode }).lean();
    const indicatorMap = new Map(indicadores.map((item) => [item._id.toString(), item]));
    const allowedIndicatorIds = new Set(indicatorMap.keys());

    const sanitized = sanitizeResourceDocument(req.body, allowedIndicatorIds);
    if (!sanitized) {
      return res.status(400).json({ error: "Datos inválidos para el recurso" });
    }

    const recurso = new Recurso({ ...sanitized.doc, activo: sanitized.doc.activo ?? true });
    await recurso.save();

    res.status(201).json({ recurso: mapResourceWithIndicators(recurso.toObject(), indicatorMap) });
  } catch (err) {
    next(err);
  }
});

router.patch("/catalog/recursos/:recursoId", async (req, res, next) => {
  try {
    const { recursoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(recursoId)) {
      return res.status(404).json({ error: "Recurso no encontrado" });
    }

    const areaParam = req.body?.areaId ?? req.query?.areaId;
    const gradoCode = gradoToCode(req.body?.grado ?? req.query?.grado);
    if (!areaParam || !gradoCode) {
      return res.status(400).json({ error: "Área y grado son obligatorios" });
    }

    const area = await resolveArea(areaParam);
    if (!area) return res.status(404).json({ error: "Área no encontrada" });

    const indicadores = await CNBIndicador.find({ areaId: area._id, grado: gradoCode }).lean();
    const indicatorMap = new Map(indicadores.map((item) => [item._id.toString(), item]));
    const allowedIndicatorIds = new Set(indicatorMap.keys());

    const sanitized = sanitizeResourceDocument(req.body, allowedIndicatorIds);
    if (!sanitized) {
      return res.status(400).json({ error: "Datos inválidos para el recurso" });
    }

    const recurso = await Recurso.findByIdAndUpdate(recursoId, { $set: sanitized.doc }, { new: true });
    if (!recurso) {
      return res.status(404).json({ error: "Recurso no encontrado" });
    }

    res.json({ recurso: mapResourceWithIndicators(recurso.toObject(), indicatorMap) });
  } catch (err) {
    next(err);
  }
});

router.delete("/catalog/recursos/:recursoId", async (req, res, next) => {
  try {
    const { recursoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(recursoId)) {
      return res.status(404).json({ error: "Recurso no encontrado" });
    }

    const deleted = await Recurso.findByIdAndDelete(recursoId);
    if (!deleted) {
      return res.status(404).json({ error: "Recurso no encontrado" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

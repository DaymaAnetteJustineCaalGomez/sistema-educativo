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
  duration: resource.duracionMin ? `${resource.duracionMin} min` : "",
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

    let area = null;
    if (mongoose.Types.ObjectId.isValid(areaId)) {
      area = await CNBArea.findById(areaId).lean();
    }
    if (!area) {
      area = await CNBArea.findOne({ slug: areaId }).lean();
    }
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

    let area = null;
    if (mongoose.Types.ObjectId.isValid(areaId)) {
      area = await CNBArea.findById(areaId);
    }
    if (!area) {
      area = await CNBArea.findOne({ slug: areaId });
    }
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

export default router;

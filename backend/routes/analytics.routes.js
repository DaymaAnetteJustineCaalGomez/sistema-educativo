// backend/routes/analytics.routes.js
import { Router } from "express";
import mongoose from "mongoose";
import Progreso from "../models/Progreso.js";
import CNBArea from "../models/CNB_Area.js";
import CNBInd from "../models/CNB_Indicador.js";
import CNBComp from "../models/CNB_Competencia.js";

const router = Router();

// nombres de colección reales (evita problemas de pluralización)
const IND_COL = CNBInd.collection.name;
const COMP_COL = CNBComp.collection.name;

/* =========================================================
 * 1) Resumen por usuario (MVP existente) - se mantiene
 *    /api/analytics/usuario/:usuarioId/resumen
 * =======================================================*/
router.get("/usuario/:usuarioId/resumen", async (req, res, next) => {
  try {
    const { usuarioId } = req.params;
    const { areaSlug = "matematica", grado = "1B" } = req.query;

    const area = await CNBArea.findOne({ slug: areaSlug }).lean();
    if (!area) return res.json({ area: null, grado, totalIndicadores: 0, competencias: [] });

    const inds = await CNBInd.find({ areaId: area._id, grado }).lean();
    const indIds = inds.map(i => i._id);

    const agg = await Progreso.aggregate([
      { $match: { usuarioId: new mongoose.Types.ObjectId(usuarioId), indicadorId: { $in: indIds } } },
      { $project: { indicadorId: 1, puntuacion: 1, estado: 1 } },
      { $lookup: { from: IND_COL, localField: "indicadorId", foreignField: "_id", as: "ind" } },
      { $unwind: "$ind" },
      { $group: {
        _id: "$ind.competenciaId",
        indicadoresTotales: { $sum: 1 }, // vistos por el alumno
        completados: { $sum: { $cond: [{ $eq: ["$estado", "completado"] }, 1, 0] } },
        promedio: { $avg: "$puntuacion" }
      }},
      { $lookup: { from: COMP_COL, localField: "_id", foreignField: "_id", as: "comp" } },
      { $unwind: "$comp" },
      { $project: {
        competenciaId: "$_id",
        codigo: "$comp.codigo",
        nombre: "$comp.nombre",
        indicadoresTotales: 1,
        completados: 1,
        cobertura: {
          $cond: [
            { $gt: ["$indicadoresTotales", 0] },
            { $multiply: [{ $divide: ["$completados", "$indicadoresTotales"] }, 100] },
            0
          ]
        },
        promedio: { $ifNull: ["$promedio", 0] }
      }},
      { $sort: { codigo: 1 } }
    ]);

    res.json({
      area: area.nombre,
      grado,
      totalIndicadores: inds.length,
      competencias: agg
    });
  } catch (e) { next(e); }
});

/* =========================================================
 * 2) NUEVO — Resumen AVANZADO (plan CNB completo)
 *    /api/analytics/usuario/:usuarioId/resumen-avanzado
 * =======================================================*/
router.get("/usuario/:usuarioId/resumen-avanzado", async (req, res, next) => {
  try {
    const { usuarioId } = req.params;
    const { areaSlug = "matematica", grado = "1B" } = req.query;

    // Área y plan CNB (todos los indicadores del grado)
    const area = await CNBArea.findOne({ slug: areaSlug }).lean();
    if (!area) return res.json({ area: null, grado, totalIndicadoresPlan: 0, promedioGeneral: 0, coberturaTotal: 0, competencias: [] });

    const planInds = await CNBInd.find({ areaId: area._id, grado }).lean(); // todo el plan
    const indIds = planInds.map(i => i._id);

    // Mapear indicadores por competencia para contar totales del plan
    const compPlanMap = new Map();      // compId -> { totales, indIds[] }
    for (const ind of planInds) {
      const key = String(ind.competenciaId);
      if (!compPlanMap.has(key)) compPlanMap.set(key, { totales: 0, indIds: [] });
      const bucket = compPlanMap.get(key);
      bucket.totales += 1;
      bucket.indIds.push(String(ind._id));
    }

    // Competencias del plan para etiquetas (código/nombre)
    const compIds = [...compPlanMap.keys()].map(id => new mongoose.Types.ObjectId(id));
    const compDocs = await CNBComp.find({ _id: { $in: compIds } }).lean();
    const compMeta = new Map(compDocs.map(c => [String(c._id), { codigo: c.codigo, nombre: c.nombre }]));

    // Progreso del usuario en esos indicadores
    const prog = await Progreso.find({
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      indicadorId: { $in: indIds }
    }).lean();

    // Índices auxiliares
    const progByInd = new Map(prog.map(p => [String(p.indicadorId), p]));

    // Cálculo por competencia
    const competencias = [];
    let sumPunt = 0, nPunt = 0, totalCompletados = 0;

    for (const [compId, bucket] of compPlanMap.entries()) {
      const meta = compMeta.get(compId) || { codigo: "—", nombre: "—" };

      let completados = 0;
      let enProgreso = 0;
      let suma = 0, n = 0;

      for (const indId of bucket.indIds) {
        const p = progByInd.get(indId);
        if (p) {
          if (p.estado === "completado") completados += 1;
          else if (p.estado === "en_progreso") enProgreso += 1;
          if (typeof p.puntuacion === "number") {
            suma += p.puntuacion;
            n += 1;
          }
        }
      }

      const pendientes = Math.max(bucket.totales - completados - enProgreso, 0);
      const promedio = n > 0 ? +(suma / n).toFixed(2) : 0;
      const cobertura = bucket.totales > 0 ? +((completados / bucket.totales) * 100).toFixed(2) : 0;

      competencias.push({
        competenciaId: compId,
        codigo: meta.codigo,
        nombre: meta.nombre,
        totales: bucket.totales,        // indicadores del plan CNB
        completados,
        enProgreso,
        pendientes,
        promedio,
        cobertura
      });

      totalCompletados += completados;
      sumPunt += suma;
      nPunt += n;
    }

    // Resumen general
    const totalPlan = planInds.length;
    const promedioGeneral = nPunt > 0 ? +(sumPunt / nPunt).toFixed(2) : 0;
    const coberturaTotal = totalPlan > 0 ? +((totalCompletados / totalPlan) * 100).toFixed(2) : 0;

    // Ordenar por código de competencia
    competencias.sort((a, b) => (a.codigo || "").localeCompare(b.codigo || ""));

    res.json({
      area: area.nombre,
      grado,
      totalIndicadoresPlan: totalPlan,
      promedioGeneral,
      coberturaTotal,
      competencias
    });
  } catch (e) { next(e); }
});

/* =========================================================
 * 3) Grupo — indicadores débiles (se mantiene)
 * =======================================================*/
router.post("/grupo/resumen", async (req, res, next) => {
  try {
    const { usuarioIds = [], areaSlug = "matematica", grado = "1B" } = req.body;
    if (!usuarioIds.length) return res.status(400).json({ error: "usuarioIds vacío" });

    const area = await CNBArea.findOne({ slug: areaSlug }).lean();
    if (!area) return res.json({ topIndicadoresDebiles: [] });

    const inds = await CNBInd.find({ areaId: area._id, grado }).lean();
    const indIds = inds.map(i => i._id);

    const agg = await Progreso.aggregate([
      {
        $match: {
          usuarioId: { $in: usuarioIds.map(id => new mongoose.Types.ObjectId(id)) },
          indicadorId: { $in: indIds }
        }
      },
      {
        $group: {
          _id: "$indicadorId",
          n: { $sum: 1 },
          promedio: { $avg: "$puntuacion" },
          pendientes: { $sum: { $cond: [{ $eq: ["$estado", "pendiente"] }, 1, 0] } }
        }
      },
      { $lookup: { from: IND_COL, localField: "_id", foreignField: "_id", as: "ind" } },
      { $unwind: "$ind" },
      {
        $project: {
          indicadorId: "$_id",
          codigo: "$ind.codigo",
          descripcion: "$ind.descripcion",
          n: 1,
          promedio: { $ifNull: ["$promedio", 0] },
          pendientes: 1
        }
      },
      { $sort: { promedio: 1, pendientes: -1 } },
      { $limit: 10 }
    ]);

    res.json({ topIndicadoresDebiles: agg });
  } catch (e) { next(e); }
});

export default router;

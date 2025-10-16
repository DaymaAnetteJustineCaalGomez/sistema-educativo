// backend/routes/recomendaciones.routes.js
import { Router } from "express";
import mongoose from "mongoose";

import Intento from "../models/Intento.js";
import ProgresoIndicador from "../models/ProgresoIndicador.js";
import Recurso from "../models/Recurso.js";

const router = Router();

const isHex24 = (s) => /^[0-9a-fA-F]{24}$/.test(String(s || ""));
const toObjId = (s) =>
  mongoose.Types.ObjectId.isValid(String(s))
    ? new mongoose.Types.ObjectId(String(s))
    : null;

/* ------------------------------------------------------------------
   Helper ultra-robusto para traer recursos por indicador(es).
   1) Intenta matchear en Mongo usando $in con ObjectId y con string.
   2) Si no encuentra, hace un Fallback EN MEMORIA:
      - carga recursos activos
      - compara por igualdad de cadenas (toString) en indicadorId y
        por "includes" en indicadorIds (array), todo como string.
------------------------------------------------------------------- */
async function recursosPorIndicadores(indicadorIds = []) {
  const hexes = indicadorIds
    .map((x) => String(x || "").trim())
    .filter((x) => isHex24(x));
  if (!hexes.length) return [];

  const oids = hexes.map((h) => new mongoose.Types.ObjectId(h));

  // 1) Query directo en Mongo (ObjectId + string)
  let recs = await Recurso.find({
    activo: { $ne: false },
    $or: [
      { indicadorId: { $in: oids } },
      { indicadorIds: { $in: oids } },
      { indicadorId: { $in: hexes } },
      { indicadorIds: { $in: hexes } },
    ],
  })
    .sort({ nivel: 1, createdAt: -1 })
    .lean();

  if (recs.length) return recs;

  // 2) Fallback en memoria (tipos mezclados)
  const todos = await Recurso.find({ activo: { $ne: false } })
    .sort({ nivel: 1, createdAt: -1 })
    .lean();

  const setHex = new Set(hexes);
  recs = todos.filter((r) => {
    const single = r.indicadorId ? String(r.indicadorId) : null;
    if (single && setHex.has(single)) return true;

    const arr = Array.isArray(r.indicadorIds) ? r.indicadorIds : [];
    for (const raw of arr) {
      const val = String(raw);
      if (setHex.has(val)) return true;
    }
    return false;
  });

  return recs;
}

/* ------------------------------------------------------------------
   GET /api/recomendaciones/:usuarioId
   - Usa ProgresoIndicador si existe (refuerzo/repaso)
   - Si no hay progreso → fallback a Intentos (<60 → refuerzo)
   - Compatible con usuarioId guardado como ObjectId o string
   - Compatible con recursos guardados con ids como ObjectId o string

   DEBUG: agrega ?debug=1 para ver candidatos, ids y recursos crudos.
------------------------------------------------------------------- */
router.get("/:usuarioId", async (req, res, next) => {
  try {
    const { usuarioId } = req.params;
    const debug = String(req.query.debug || "") === "1";

    const uidStr = String(usuarioId).trim();
    if (!isHex24(uidStr)) {
      return res.status(400).json({ error: "usuarioId inválido" });
    }
    const uidObj = toObjId(uidStr);

    const now = new Date();
    const repasoMs = 14 * 24 * 60 * 60 * 1000;

    // 1) ProgresoIndicador (usuarioId como ObjectId o string)
    const progresos = await ProgresoIndicador.find({
      $or: [{ usuarioId: uidObj }, { usuarioId: uidStr }],
    }).lean();

    let candidatos = [];

    if (progresos && progresos.length) {
      for (const p of progresos) {
        const indId = (p.indicadorId || p.indicador)?.toString();
        if (!indId) continue;

        const lastScore =
          typeof p.ultimoScore === "number" ? p.ultimoScore : p.lastScore;
        const estado = p.estado || p.status || "pendiente";
        const ultimoIntentoAt = p.ultimoIntentoAt || p.updatedAt || p.createdAt;

        if (
          (typeof lastScore === "number" && lastScore < 60) ||
          estado !== "completado"
        ) {
          candidatos.push({ indicadorId: indId, motivo: "refuerzo" });
          continue;
        }

        if (ultimoIntentoAt && now - new Date(ultimoIntentoAt) > repasoMs) {
          candidatos.push({ indicadorId: indId, motivo: "repaso" });
        }
      }
    } else {
      // 2) Fallback: Intentos con puntaje < 60
      const intentos = await Intento.find({
        $or: [{ usuarioId: uidObj }, { usuarioId: uidStr }],
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const debiles = intentos
        .filter((it) => typeof it.puntuacion === "number" && it.puntuacion < 60)
        .map((it) => it.indicadorId?.toString())
        .filter(Boolean);

      const unico = [...new Set(debiles)];
      candidatos = unico.map((id) => ({ indicadorId: id, motivo: "refuerzo" }));
    }

    if (!candidatos.length) {
      return debug
        ? res.json({ debug: { motivo: "sin_candidatos" }, data: [] })
        : res.json([]);
    }

    // Unificar por indicador (prioriza "refuerzo")
    const porIndicador = candidatos.reduce((acc, c) => {
      const k = c.indicadorId;
      if (!acc[k]) acc[k] = { indicadorId: k, motivo: c.motivo, recursos: [] };
      if (c.motivo === "refuerzo") acc[k].motivo = "refuerzo";
      return acc;
    }, {});
    const ids = Object.keys(porIndicador);

    // Traer recursos
    const recursos = await recursosPorIndicadores(ids);

    /* ------------------------------------------------------------
       Armar salida con DEDUPE y límite de 3 por indicador.
       Evita duplicados cuando un mismo recurso matchea por
       indicadorId y también por indicadorIds.
    ------------------------------------------------------------ */
    for (const r of recursos) {
      const rId = String(r._id);

      // todos los candidatos (single + array) como string
      const candidates = [
        r.indicadorId ? String(r.indicadorId) : null,
        ...(Array.isArray(r.indicadorIds)
          ? r.indicadorIds.map((x) => String(x))
          : []),
      ].filter(Boolean);

      for (const id of candidates) {
        const bucket = porIndicador[id];
        if (!bucket) continue;

        // set interno para dedupe por indicador
        if (!bucket._seen) bucket._seen = new Set();

        // ya agregado a este indicador → saltar
        if (bucket._seen.has(rId)) continue;

        // límite de 3 por indicador
        if (bucket.recursos.length >= 3) continue;

        bucket._seen.add(rId);
        bucket.recursos.push({
          _id: r._id,
          titulo: r.titulo,
          tipo: r.tipo,
          proveedor: r.proveedor,
          nivel: r.nivel,
          idioma: r.idioma,
          url: r.url,
          duracionMin: r.duracionMin,
        });
      }
    }

    // limpiar _seen y dejar solo indicadores con recursos
    const salida = Object.values(porIndicador)
      .map((b) => {
        const { _seen, ...rest } = b;
        return rest;
      })
      .filter((x) => x.recursos.length > 0);

    if (debug) {
      return res.json({
        debug: {
          usuarioId: uidStr,
          candidatos,
          ids,
          recursosEncontrados: recursos.length,
          nota:
            "Si recursosEncontrados=0 pero sabes que hay, revisa tipos y valores de indicadorId/indicadorIds.",
        },
        data: salida,
      });
    }

    res.json(salida);
  } catch (err) {
    next(err);
  }
});

export default router;

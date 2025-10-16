// backend/routes/recursos.routes.js
import { Router } from "express";
import mongoose from "mongoose";
import Recurso from "../models/Recurso.js";

const router = Router();

const isHex24 = (s) => /^[0-9a-fA-F]{24}$/.test(String(s));
const toObjId = (s) =>
  mongoose.Types.ObjectId.isValid(String(s))
    ? new mongoose.Types.ObjectId(String(s))
    : null;

/* ------------------------- GET /api/recursos -------------------------
   Soporta:
   - ?indicadorId=<id>           (un id)
   - ?indicadorIds=<id1,id2,...> (varios ids separados por coma)
   Coincide cuando el campo en DB esté guardado como ObjectId **o** como string.
--------------------------------------------------------------------- */
router.get("/", async (req, res, next) => {
  try {
    const { indicadorId, indicadorIds } = req.query;

    const q = { activo: { $ne: false } };
    const or = [];

    // --- indicadorId (single)
    if (indicadorId) {
      const hex = String(indicadorId).trim();
      if (!isHex24(hex)) {
        return res.status(400).json({ error: "indicadorId inválido" });
      }
      const oid = toObjId(hex);

      // match cuando el campo es ObjectId
      or.push({ indicadorId: { $eq: oid } });
      or.push({ indicadorIds: { $elemMatch: { $eq: oid } } });

      // match cuando el campo se guardó como string
      or.push({ indicadorId: { $eq: hex } });
      or.push({ indicadorIds: { $elemMatch: { $eq: hex } } });
    }

    // --- indicadorIds (lista separada por coma)
    if (indicadorIds) {
      const idsHex = String(indicadorIds)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (idsHex.some((h) => !isHex24(h))) {
        return res
          .status(400)
          .json({ error: "indicadorIds contiene ids inválidos", ids: idsHex });
      }

      const oids = idsHex.map(toObjId);

      // match cuando los campos son ObjectId
      or.push({ indicadorId: { $in: oids } });
      or.push({ indicadorIds: { $elemMatch: { $in: oids } } });

      // match cuando los campos son strings
      or.push({ indicadorId: { $in: idsHex } });
      or.push({ indicadorIds: { $elemMatch: { $in: idsHex } } });
    }

    if (or.length) q.$or = or;

    const items = await Recurso.find(q).sort({ createdAt: -1 }).limit(100).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
});

/* ------------------------- POST /api/recursos -------------------------
   Acepta:
   - indicadorId: "<id>"
   - indicadorIds: ["<id1>", "<id2>"]  (o string con coma)
   Normaliza y guarda en ambos campos (single + array) como ObjectId.
--------------------------------------------------------------------- */
router.post("/", async (req, res, next) => {
  try {
    if (!req.is("application/json")) {
      return res
        .status(415)
        .json({ error: "Content-Type debe ser application/json" });
    }

    const {
      indicadorId,
      indicadorIds,
      tipo,
      titulo,
      url,
      proveedor,
      idioma = "es",
      nivel = "intro",
      duracionMin = 0,
      activo = true,
    } = req.body || {};

    // Normaliza IDs (acepta single/array/coma)
    let ids = [];
    if (Array.isArray(indicadorIds)) ids = indicadorIds;
    else if (typeof indicadorIds === "string")
      ids = indicadorIds.split(",").map((s) => s.trim()).filter(Boolean);
    if (indicadorId) ids = [indicadorId, ...ids];

    // Valida y castea a ObjectId
    const uniqueHex = [...new Set(ids.map(String))];
    if (!uniqueHex.length)
      return res
        .status(400)
        .json({ error: "Debe enviar indicadorId o indicadorIds con al menos 1 id" });

    const invalid = uniqueHex.filter((h) => !isHex24(h));
    if (invalid.length)
      return res.status(400).json({ error: "Ids inválidos", invalid });

    const oids = uniqueHex.map((h) => new mongoose.Types.ObjectId(h));

    if (!tipo) return res.status(400).json({ error: "tipo es requerido" });
    if (!titulo) return res.status(400).json({ error: "titulo es requerido" });
    if (!url) return res.status(400).json({ error: "url es requerido" });

    const doc = await Recurso.create({
      indicadorId: oids[0],
      indicadorIds: oids,
      tipo,
      titulo,
      url,
      proveedor,
      idioma,
      nivel,
      duracionMin,
      activo,
    });

    res.status(201).json(doc);
  } catch (err) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ error: "Validación falló", detail: err.errors });
    }
    if (err?.name === "CastError") {
      return res.status(400).json({ error: `CastError en ${err.path}`, value: err.value });
    }
    next(err);
  }
});

export default router;

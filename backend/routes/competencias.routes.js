// backend/routes/competencias.routes.js
import { Router } from "express";
import mongoose from "mongoose";
import { authRequired } from "../middlewares/auth.middleware.js";
import CompetenciaProgress from "../models/CompetenciaProgress.js";
import CNBCompetencia from "../models/CNB_Competencia.js";

const router = Router();

const allowedStates = new Set(["pendiente", "en_progreso", "dominado"]);

router.use(authRequired);

router.get("/progreso", async (req, res, next) => {
  try {
    const { areaId } = req.query;
    const query = { usuarioId: req.user.id };

    if (areaId && mongoose.Types.ObjectId.isValid(areaId)) {
      query.areaId = areaId;
    }

    const progreso = await CompetenciaProgress.find(query)
      .sort({ actualizadoEn: -1 })
      .lean();

    res.json({ progreso });
  } catch (err) {
    next(err);
  }
});

router.post("/progreso", async (req, res, next) => {
  try {
    const { competenciaId, estado, notas } = req.body || {};

    if (!competenciaId) {
      return res.status(400).json({ error: "competenciaId es requerido" });
    }

    if (!mongoose.Types.ObjectId.isValid(competenciaId)) {
      return res.status(400).json({ error: "competenciaId inválido" });
    }

    const competencia = await CNBCompetencia.findById(competenciaId).lean();
    if (!competencia) {
      return res.status(404).json({ error: "Competencia no encontrada" });
    }

    const nextState = allowedStates.has(String(estado)) ? String(estado) : "en_progreso";

    const payload = {
      estado: nextState,
      notas: notas ? String(notas).trim() : "",
      areaId: competencia.areaId,
      grado: competencia.grado,
      actualizadoEn: new Date(),
    };

    const progreso = await CompetenciaProgress.findOneAndUpdate(
      { usuarioId: req.user.id, competenciaId },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    res.json({ progreso });
  } catch (err) {
    next(err);
  }
});

export default router;

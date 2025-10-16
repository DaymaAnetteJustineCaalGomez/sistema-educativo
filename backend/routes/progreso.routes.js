import { Router } from "express";
import Progreso from "../models/Progreso.js";

const router = Router();

// Registrar / actualizar progreso
router.post("/", async (req, res) => {
  try {
    const { usuarioId, indicadorId, recursoId, estado, puntuacion } = req.body;

    const progreso = await Progreso.findOneAndUpdate(
      { usuarioId, indicadorId },
      { recursoId, estado, puntuacion, ultimaVez: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json(progreso);
  } catch (err) {
    console.error("❌ Error al guardar progreso:", err.message);
    res.status(500).json({ error: "Error al registrar progreso" });
  }
});

// Obtener progreso por usuario
router.get("/:usuarioId", async (req, res) => {
  try {
    const data = await Progreso.find({ usuarioId: req.params.usuarioId }).populate("indicadorId recursoId");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener progreso" });
  }
});

export default router;

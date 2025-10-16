import { Router } from 'express';
import Intento from '../models/Intento.js';
import { recalcularProgresoUsuarioIndicador } from '../services/progreso.service.js';

const router = Router();

// POST /api/intentos/start
router.post('/start', async (req, res) => {
  const { usuarioId, indicadorId, recursoId } = req.body; // usa req.user._id si ya tienes auth
  if (!usuarioId || !indicadorId) return res.status(400).json({ message: 'Faltan datos' });
  const intento = await Intento.create({ usuarioId, indicadorId, recursoId, estado: 'en_progreso', startedAt: new Date() });
  await recalcularProgresoUsuarioIndicador(usuarioId, indicadorId);
  res.json(intento);
});

// POST /api/intentos/finish
router.post('/finish', async (req, res) => {
  const { usuarioId, indicadorId, recursoId, intentoId, puntuacion = 80, duracionSeg = 0 } = req.body;
  if (!usuarioId || !indicadorId) return res.status(400).json({ message: 'Faltan datos' });
  let intento;
  if (intentoId) {
    intento = await Intento.findByIdAndUpdate(intentoId, { estado: 'completado', puntuacion, duracionSeg, finishedAt: new Date() }, { new: true });
  } else {
    intento = await Intento.create({ usuarioId, indicadorId, recursoId, estado: 'completado', puntuacion, duracionSeg, startedAt: new Date(), finishedAt: new Date() });
  }
  await recalcularProgresoUsuarioIndicador(usuarioId, indicadorId);
  res.json(intento);
});

// POST /api/intentos/abandon
router.post('/abandon', async (req, res) => {
  const { usuarioId, indicadorId, recursoId, intentoId } = req.body;
  if (!usuarioId || !indicadorId) return res.status(400).json({ message: 'Faltan datos' });
  let intento;
  if (intentoId) {
    intento = await Intento.findByIdAndUpdate(intentoId, { estado: 'abandonado' }, { new: true });
  } else {
    intento = await Intento.create({ usuarioId, indicadorId, recursoId, estado: 'abandonado', startedAt: new Date() });
  }
  await recalcularProgresoUsuarioIndicador(usuarioId, indicadorId);
  res.json(intento);
});

// GET /api/intentos
router.get('/', async (req, res) => {
  const { usuarioId, indicadorId } = req.query;
  const q = {};
  if (usuarioId) q.usuarioId = usuarioId;
  if (indicadorId) q.indicadorId = indicadorId;
  const list = await Intento.find(q).sort({ createdAt: -1 }).lean();
  res.json(list);
});

export default router;

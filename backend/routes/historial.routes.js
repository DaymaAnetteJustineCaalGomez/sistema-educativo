import { Router } from 'express';
import Intento from '../models/Intento.js';

const router = Router();

// GET /api/historial/usuario/:usuarioId
router.get('/usuario/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;
  const intentos = await Intento.find({ usuarioId }).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ intentos });
});

export default router;

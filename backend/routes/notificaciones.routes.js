import { Router } from 'express';
import Notificacion from '../models/Notificacion.js';
import Progreso from '../models/ProgresoIndicador.js';

const router = Router();

// GET /api/notificaciones?usuarioId
router.get('/', async (req, res) => {
  const { usuarioId } = req.query; // usa req.user._id en producción
  const list = await Notificacion.find({ usuarioId }).sort({ createdAt: -1 }).lean();
  res.json(list);
});

// PATCH /api/notificaciones/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const n = await Notificacion.findByIdAndUpdate(id, { leida: true }, { new: true });
  res.json(n);
});

// POST /api/notificaciones/generar  (demo)
router.post('/generar', async (req, res) => {
  const { usuarioId } = req.body;
  const hoy = new Date();
  const progresos = await Progreso.find({ usuarioId }).lean();
  const crear = [];
  for (const p of progresos) {
    if (!p.ultimoIntentoAt) continue;
    const dias = Math.floor((hoy - new Date(p.ultimoIntentoAt)) / (1000*60*60*24));
    if (dias > 14) {
      crear.push({ usuarioId, tipo: 'repaso', mensaje: `Hace ${dias} días sin practicar este subtema. Te recomendamos un repaso.`, fecha: new Date() });
    }
  }
  if (crear.length) await Notificacion.insertMany(crear);
  res.json({ creadas: crear.length });
});

export default router;

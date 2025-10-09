// backend/routes/health.routes.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { authRequired, allowRoles } from '../middlewares/auth.middleware.js';

const router = Router();

const states = { 0:'disconnected', 1:'connected', 2:'connecting', 3:'disconnecting' };

// GET /health  (porque el router se monta en /health)
router.get('/', (_req, res) => {
  const s = mongoose.connection.readyState ?? 0;
  res.json({
    status: 'ok',
    dbState: s,
    dbStateText: states[s] || 'unknown',
    endpoints: [
      'GET /health',
      'GET /health/test-db (flag ENABLE_TEST_DB=true, no prod)',
      'GET /health/pings?limit=10',
      'DELETE /health/pings',
      'GET /health/db-stats',
      'GET /health/secure',
      'GET /health/secure-docente'
    ]
  });
});


// GET /health/test-db  (controlado por flag/entorno)
router.get('/test-db', async (_req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_TEST_DB !== 'true') {
    return res.status(403).json({ error: 'Deshabilitado' });
  }
  try {
    const Ping = mongoose.connection.collection('pings');
    const result = await Ping.insertOne({ at: new Date(), msg: 'hola-atlas' });
    res.json({ insertedId: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// LISTAR últimos pings (por defecto limit=10)
router.get('/pings', async (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_TEST_DB !== 'true') {
    return res.status(403).json({ error: 'Deshabilitado' });
  }
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const Ping = mongoose.connection.collection('pings');
    const items = await Ping.find({})
      .project({ msg: 1, at: 1 })
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();
    res.json({ limit, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// BORRAR todos los pings
router.delete('/pings', async (_req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_TEST_DB !== 'true') {
    return res.status(403).json({ error: 'Deshabilitado' });
  }
  try {
    const Ping = mongoose.connection.collection('pings');
    const r = await Ping.deleteMany({});
    res.json({ ok: true, deletedCount: r.deletedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// STATS de la base de datos
router.get('/db-stats', async (_req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_TEST_DB !== 'true') {
    return res.status(403).json({ error: 'Deshabilitado' });
  }
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const stats = await db.command({ dbStats: 1 });
    res.json({
      database: db.databaseName,
      collectionCount: collections.length,
      collections: collections.map(c => c.name),
      stats: {
        objects: stats.objects,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /health/secure  (token)
router.get('/secure', authRequired, (req, res) => {
  res.json({ ok: true, msg: 'Token OK', user: req.user });
});

// GET /health/secure-docente  (token + rol)
router.get('/secure-docente', authRequired, allowRoles('DOCENTE','ADMIN'), (req, res) => {
  res.json({ ok: true, msg: 'Solo DOCENTE/ADMIN', user: req.user });
});

export default router;

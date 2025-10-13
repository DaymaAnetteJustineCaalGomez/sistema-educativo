// backend/server.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar .env desde la carpeta backend (independiente del cwd)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

// -------- Seguridad / proxy --------
app.set('trust proxy', 1); // por si usas Nginx/Render más adelante
app.use(helmet());

// -------- Rate limit global --------
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
});
app.use(globalLimiter);

// -------- CORS --------
// Soporta múltiples orígenes separados por coma en .env
const originEnv = (process.env.CORS_ORIGIN || '').trim();
const originList = originEnv
  ? originEnv.split(',').map(s => s.trim()).filter(Boolean)
  : [];

const corsOptions = {
  origin: (reqOrigin, cb) => {
    // Permite Postman/same-origin
    if (!reqOrigin) return cb(null, true);
    // Sin lista => permitir todos (DEV)
    if (originList.length === 0) return cb(null, true);
    // comodín
    if (originList.includes('*')) return cb(null, true);
    // listado explícito
    if (originList.includes(reqOrigin)) return cb(null, true);
    return cb(new Error(`CORS bloqueado: ${reqOrigin} no está permitido`));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// -------- Body parser --------
app.use(express.json({ limit: '1mb' }));

// -------- Rutas --------
app.use('/api/health', healthRoutes); // GET /api/health
app.use('/api/auth', authRoutes);

// -------- 404 --------
app.use((req, res) => {
  res.status(404).json({ error: `No encontrado: ${req.method} ${req.originalUrl}` });
});

// -------- Manejador de errores --------
app.use((err, _req, res, _next) => {
  console.error('💥 Error:', err?.message || err);
  const code = err.status || 500;
  res.status(code).json({ error: err.message || 'Error interno del servidor' });
});

// -------- Puerto / arranque --------
const PORT = process.env.PORT || 5002;

(function sanityLogs() {
  console.log('MONGO_URI presente?', !!process.env.MONGO_URI);
  if (!process.env.JWT_SECRET) console.warn('⚠️ Falta JWT_SECRET en .env');
  if (!process.env.APP_BASE_URL) console.warn('⚠️ Falta APP_BASE_URL en .env (reset-password link)');
  console.log('CORS_ORIGIN =', originEnv || '(sin definir → todos permitidos en dev)');
})();

// -------- Start (esperando DB) --------
(async () => {
  try {
    await connectDB();

    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log('🔌 mongoose.readyState =', mongoose.connection.readyState, states[mongoose.connection.readyState]);

    app.listen(PORT, () => {
      console.log(`✅ Servidor en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ No se pudo iniciar:', err.message);
    process.exit(1);
  }
})();

// -------- Cierre limpio --------
process.on('SIGINT', async () => {
  console.log('\n⏳ Cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

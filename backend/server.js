// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { connectDB } from './db.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';

// 1) App
const app = express();

// Seguridad / límites
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// CORS (desde .env, por defecto *)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : '*';
app.use(cors({ origin: allowedOrigins }));

// Body parser
app.use(express.json());

// Rutas
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

console.log('MONGO_URI presente?', !!process.env.MONGO_URI);

// 2) Arranque esperando DB
(async () => {
  try {
    await connectDB();

    // Logs de estado para que veas "connected"
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

// 3) Cierre limpio
process.on('SIGINT', async () => {
  console.log('\n⏳ Cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

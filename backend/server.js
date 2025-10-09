import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js'; // 👈 importa rutas
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// 1) crea la app ANTES de usarla
const app = express();
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 })); // 300 req/15min/IP

// 2) middlewares
app.use(cors());
app.use(express.json());

// 3) rutas
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

console.log('MONGO_URI presente?', !!process.env.MONGO_URI);

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Servidor en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ No se pudo iniciar:', err.message);
    process.exit(1);
  }
}

start();


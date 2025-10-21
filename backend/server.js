// backend/server.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import cnbRoutes from "./routes/cnb.routes.js";
import recursosRoutes from "./routes/recursos.routes.js";
import progresoRoutes from "./routes/progreso.routes.js";
import recomendacionesRoutes from "./routes/recomendaciones.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import intentosRoutes from "./routes/intentos.routes.js";
import historialRoutes from "./routes/historial.routes.js";
import notificacionesRoutes from "./routes/notificaciones.routes.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
});
app.use(globalLimiter);

// CORS
const originEnv = (process.env.CORS_ORIGIN || "http://localhost:5173").trim();
const originList = originEnv ? originEnv.split(",").map(s => s.trim()).filter(Boolean) : [];
const corsOptionsDelegate = (reqOrigin, cb) => {
  if (!reqOrigin) return cb(null, true);
  if (originList.includes("*") || originList.includes(reqOrigin)) return cb(null, true);
  if (originList.length === 0 && reqOrigin.includes("localhost")) return cb(null, true);
  const err = new Error(`CORS bloqueado: ${reqOrigin}`);
  err.status = 403;
  return cb(err);
};
app.use(cors({ origin: corsOptionsDelegate, credentials: true }));
app.options("*", cors({ origin: corsOptionsDelegate, credentials: true }));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

app.use("/api/cnb", cnbRoutes);
app.use("/api/recursos", recursosRoutes);
app.use("/api/progreso", progresoRoutes);
app.use("/api/recomendaciones", recomendacionesRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use("/api/intentos", intentosRoutes);
app.use("/api/historial", historialRoutes);
app.use("/api/notificaciones", notificacionesRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: `No encontrado: ${req.method} ${req.originalUrl}` }));

// Errores
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const msg = err.message || "Error interno del servidor";
  console.error("💥 Error:", err?.stack || msg);
  res.status(status).json({ error: msg });
});

// Arranque
const PORT = process.env.PORT || 5002;
let server;
(async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`✅ API en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ No se pudo iniciar:", err.message);
    process.exit(1);
  }
})();

// Cierre
const shutdown = (signal) => () => {
  console.log(`🔻 Recibido ${signal}. Cerrando servidor...`);
  server?.close(() => {
    console.log("🔒 Servidor cerrado");
    process.exit(0);
  });
};
process.on("SIGINT", shutdown("SIGINT"));
process.on("SIGTERM", shutdown("SIGTERM"));

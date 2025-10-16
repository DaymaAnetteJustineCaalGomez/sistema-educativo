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
import mongoose from "mongoose";

import { connectDB } from "./config/db.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";        // 👈 NUEVO
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

const originEnv = (process.env.CORS_ORIGIN || "http://localhost:5173").trim();
const originList = originEnv ? originEnv.split(",").map(s => s.trim()).filter(Boolean) : [];
app.use(cors({
  origin: (reqOrigin, cb) => {
    if (!reqOrigin) return cb(null, true);
    if (originList.includes("*") || originList.includes(reqOrigin)) return cb(null, true);
    if (originList.length === 0 && reqOrigin.includes("localhost")) return cb(null, true);
    return cb(new Error(`CORS bloqueado: ${reqOrigin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "2mb" }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);                        // 👈 MONTA USERS

app.use("/api/cnb", cnbRoutes);
app.use("/api/recursos", recursosRoutes);
app.use("/api/progreso", progresoRoutes);
app.use("/api/recomendaciones", recomendacionesRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use("/api/intentos", intentosRoutes);
app.use("/api/historial", historialRoutes);
app.use("/api/notificaciones", notificacionesRoutes);

app.use((req, res) => res.status(404).json({ error: `No encontrado: ${req.method} ${req.originalUrl}` }));

app.use((err, _req, res, _next) => {
  console.error("💥 Error:", err?.stack || err?.message || err);
  res.status(err.status || 500).json({ error: err.message || "Error interno del servidor" });
});

const PORT = process.env.PORT || 5002;
(async () => {
  try {
    await connectDB();
    console.log(`✅ API en http://localhost:${PORT}`);
    app.listen(PORT);
  } catch (err) {
    console.error("❌ No se pudo iniciar:", err.message);
    process.exit(1);
  }
})();

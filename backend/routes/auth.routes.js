// backend/routes/auth.routes.js
import { Router } from "express";
import {
  requestRegisterCode,
  registerWithOtp,
  forgotPassword,
  resetPassword,
  login,
} from "../controllers/auth.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";
import { Usuario as UsuarioModel } from "../models/Usuario.js";

const router = Router();

/* ---------- POST /api/auth/login ---------- */
router.post("/login", login);

/* ---------- GET /api/auth/me ---------- */
router.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await UsuarioModel.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    const plain = typeof user.toObject === "function" ? user.toObject() : user;
    const id = plain?._id?.toString?.() || plain?.id || null;
    const role = String(plain?.rol || plain?.role || "ESTUDIANTE").toUpperCase();
    const grado = plain?.grado ?? null;
    res.json({
      user: {
        id,
        nombre: plain?.nombre,
        name: plain?.nombre,
        email: plain?.email,
        rol: role,
        role,
        grado,
        grade: grado,
        createdAt: plain?.createdAt,
        updatedAt: plain?.updatedAt,
      },
    });
  } catch (err) { next(err); }
});

/* ---------- OTP + Registro + Reset ---------- */
router.post("/request-register-code", requestRegisterCode);
router.post("/register", registerWithOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;

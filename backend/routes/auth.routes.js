// backend/routes/auth.routes.js
import { Router } from "express";
import Usuario from "../models/Usuario.js";
import { authRequired } from "../middlewares/auth.middleware.js";

import {
  requestRegisterCode,
  registerWithOtp,
  forgotPassword,
  resetPassword,
  login,
} from "../controllers/auth.controller.js";

const router = Router();

/* ---------- POST /api/auth/login ---------- */
router.post("/login", login);

/* ---------- GET /api/auth/me ---------- */
router.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await Usuario.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const payload = {
      id: user._id.toString(),
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      role: user.rol,
      grado: user.grado ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({ user: payload });
  } catch (err) { next(err); }
});

/* ---------- OTP + Registro + Reset ---------- */
router.post("/request-register-code", requestRegisterCode);
router.post("/register", registerWithOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;

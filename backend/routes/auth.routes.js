// backend/routes/auth.routes.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

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

/* ---------- GET /api/auth/me (placeholder) ---------- */
router.get("/me", async (_req, res) => {
  res.json({ ok: true });
});

/* ---------- OTP + Registro + Reset ---------- */
router.post("/request-register-code", requestRegisterCode);
router.post("/register", registerWithOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;

// backend/routes/auth.routes.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import { Usuario } from "../models/Usuario.js";

const router = Router();
const normEmail = (s) => (s || "").trim().toLowerCase();
const sign = (u) => jwt.sign({ id: u._id, rol: u.rol }, process.env.JWT_SECRET, { expiresIn: "7d" });

/* POST /api/auth/login */
router.post("/login", async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const password = (req.body.password || "").trim();
    if (!email || !password) return res.status(400).json({ error: "Faltan credenciales" });

    const user = await Usuario.findOne({ email }).select("+password +passwordHash +passwordChangedAt grado rol nombre email");
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = sign(user);
    return res.json({
      token,
      user: {
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol || "ESTUDIANTE",
        grado: user.grado ?? null,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

/* GET /api/auth/me */
router.get("/me", async (_req, res) => {
  res.json({ ok: true });
});

export default router;

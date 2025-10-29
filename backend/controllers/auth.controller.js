import crypto from "crypto";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";
import OTPCode from "../models/OTPCode.js";
import { sendEmail } from "../utils/sendEmail.js";
import { registerCodeTemplate, resetPasswordTemplate } from "../utils/emailTemplates.js";

// Helpers
const normEmail = (e = "") => String(e).trim().toLowerCase();
const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const defaultSecret = process.env.JWT_SECRET || "change_me";
const signToken = (user) => {
  const plain = typeof user?.toObject === "function" ? user.toObject() : user;
  const payload = {
    id: plain?._id?.toString?.() || plain?.id || plain?.uid,
    uid: plain?._id?.toString?.() || plain?.id || plain?.uid,
    role: plain?.rol || plain?.role,
    email: plain?.email,
  };
  const secret = defaultSecret;
  const expiresIn = process.env.JWT_EXPIRES || "1d";
  return jwt.sign(payload, secret, { expiresIn });
};

const normalizeGrade = (input) => {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input === "number") {
    return [1, 2, 3].includes(input) ? input : null;
  }
  const match = String(input).match(/\d/);
  if (!match) return null;
  const num = parseInt(match[0], 10);
  return [1, 2, 3].includes(num) ? num : null;
};

const formatUser = (user) => {
  if (!user) return null;
  const plain = typeof user.toObject === "function" ? user.toObject() : user;
  const id = plain?._id?.toString?.() || plain?.id || plain?.uid || null;
  const role = String(plain?.rol || plain?.role || "ESTUDIANTE").toUpperCase();
  const grade = normalizeGrade(plain?.grado ?? plain?.grade);
  const base = {
    id,
    nombre: plain?.nombre,
    name: plain?.nombre,
    email: plain?.email,
    rol: role,
    role,
    grado: grade,
    grade,
    createdAt: plain?.createdAt,
    updatedAt: plain?.updatedAt,
  };
  return base;
};

// ---------- LOGIN ----------
export const login = async (req, res, next) => {
  try {
    const email = normEmail(req.body.email);
    const password = String(req.body.password || "");
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    const user = await Usuario.findOne({ email })
      .select("+password +passwordHash +passwordChangedAt");
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

    const fresh = await Usuario.findById(user._id).lean();
    const token = signToken(fresh || user);
    return res.json({ token, user: formatUser(fresh || user) });
  } catch (err) { return next(err); }
};

// ---------- OTP (Docente/Admin) ----------
export const requestRegisterCode = async (req, res, next) => {
  try {
    const email = normEmail(req.body.email);
    const roleInput = req.body.role ?? req.body.rol; // acepta role o rol
    const role = String(roleInput || "").toUpperCase();
    if (!email || !["DOCENTE", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Email y rol válidos son requeridos" });
    }

    const exists = await Usuario.findOne({ email });
    if (exists) return res.status(409).json({ message: "Este correo ya está registrado" });

    // Cooldown 30s
    const last = await OTPCode.findOne({ email, role, used: false })
      .sort({ createdAt: -1 });
    if (last) {
      const diff = (Date.now() - last.createdAt.getTime()) / 1000;
      const cooldown = 30; // segundos
      if (diff < cooldown) {
        const wait = Math.ceil(cooldown - diff);
        return res.status(429).json({ message: `Espera ${wait}s para solicitar otro código` });
      }
    }

    // Invalidar códigos previos no usados
    await OTPCode.updateMany({ email, role, used: false }, { $set: { used: true } });

    const code = genCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await OTPCode.create({ email, role, code, expiresAt });

    await sendEmail({
      to: email,
      subject: "Código de registro — Sistema Educativo CNB",
      html: registerCodeTemplate(code),
      text: `Tu código de registro es: ${code} (expira en 10 minutos)`,
    });

    return res.json({ ok: true, message: "Código enviado" });
  } catch (err) { return next(err); }
};

// ---------- REGISTER (Estudiante sin OTP | Docente/Admin con OTP) ----------
export const registerWithOtp = async (req, res, next) => {
  try {
    // Acepta español o inglés
    const nombre = req.body.nombre ?? req.body.name;
    const email = normEmail(req.body.email);
    const password = req.body.password;
    const role = String((req.body.rol ?? req.body.role) || "").toUpperCase();
    const otp = req.body.otp ?? req.body.codigo ?? req.body.code;

    if (!nombre || !email || !password || !role) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    const exists = await Usuario.findOne({ email });
    if (exists) return res.status(409).json({ message: "Este correo ya está registrado" });

    // ESTUDIANTE: no requiere OTP (y ya NO guardamos 'grado' aquí)
    if (role === "ESTUDIANTE") {
      const grade = normalizeGrade(req.body.grado ?? req.body.grade);
      const user = await Usuario.create({
        nombre,
        email,
        password,          // se hashea en pre('save')
        rol: "ESTUDIANTE",
        grado: grade,
      });
      const fresh = await Usuario.findById(user._id).lean();
      const token = signToken(fresh || user);
      return res.status(201).json({ token, user: formatUser(fresh || user) });
    }

    // DOCENTE / ADMIN: requiere OTP
    if (!["DOCENTE", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Rol inválido" });
    }
    if (!otp) return res.status(400).json({ message: "Ingresa el código enviado a tu correo" });

    const record = await OTPCode.findOne({ email, role, used: false }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ message: "Código no encontrado. Solicítalo nuevamente." });
    if (record.attempts >= 5) return res.status(429).json({ message: "Demasiados intentos. Solicita un nuevo código." });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: "El código ha expirado. Solicita uno nuevo." });

    if (record.code !== String(otp).trim()) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Código incorrecto." });
    }

    record.used = true;
    await record.save();

    const user = await Usuario.create({
      nombre,
      email,
      password,   // se hashea en pre('save')
      rol: role,
    });

    const fresh = await Usuario.findById(user._id).lean();
    const token = signToken(fresh || user);
    return res.status(201).json({ token, user: formatUser(fresh || user) });
  } catch (err) { return next(err); }
};

// ---------- Forgot / Reset Password ----------
export const forgotPassword = async (req, res, next) => {
  try {
    const email = normEmail(req.body.email);
    const user = await Usuario.findOne({ email });

    if (!user) return res.json({ ok: true }); // uniforme

    const rawToken = user.createPasswordResetToken(); // método del modelo
    await user.save({ validateBeforeSave: false });

    const base = process.env.APP_BASE_URL || "http://localhost:5173";
    const resetUrl = `${base}/reset-password?token=${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Restablece tu contraseña",
        html: resetPasswordTemplate(resetUrl),
        text: `Usa este enlace para restablecer tu contraseña (expira en 15 minutos): ${resetUrl}`,
      });
      return res.json({ ok: true });
    } catch (e) {
      if (typeof user.clearPasswordReset === "function") user.clearPasswordReset();
      else { user.passwordResetToken = undefined; user.passwordResetExpires = undefined; }
      await user.save({ validateBeforeSave: false });

      e.status = 500; e.message = "No se pudo enviar el correo de restablecimiento";
      return next(e);
    }
  } catch (err) { return next(err); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password)
      return res.status(400).json({ message: "Token y nueva contraseña son requeridos" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await Usuario.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password +passwordHash");

    if (!user) return res.status(400).json({ message: "Token inválido o expirado" });

    // Deja que el hook pre('save') haga el hash
    user.password = password;

    if (typeof user.clearPasswordReset === "function") user.clearPasswordReset();
    else { user.passwordResetToken = undefined; user.passwordResetExpires = undefined; }

    await user.save({ validateBeforeSave: false });
    return res.json({ ok: true, message: "Contraseña actualizada" });
  } catch (err) { return next(err); }
};


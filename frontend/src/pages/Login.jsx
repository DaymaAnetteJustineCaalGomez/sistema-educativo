// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthAPI } from "../api";
import { useAuthStore } from "../store/auth";

export default function Login() {
  const navigate = useNavigate();
  const doLogin = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validación local — esto es lo que te estaba mostrando el toast
    if (!email.trim() || !password.trim()) {
      toast.error("Faltan credenciales");
      return;
    }

    setLoading(true);
    try {
      // Llamada real al backend
      const { token, user } = await AuthAPI.login({ email, password });

      if (!token || !user) {
        toast.error("Respuesta inválida del servidor");
        return;
      }

      // Guardar sesión
      doLogin(token, user);

      // Redirección por rol/estado
      const rol = (user.rol || user.role || "").toUpperCase();
      if (rol === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (rol === "DOCENTE") {
        navigate("/docente", { replace: true });
      } else {
        // Estudiante: si no tiene grado, primero elige grado
        const grado = user.grado ?? user.grade ?? null;
        if (!grado) navigate("/elige-grado", { replace: true });
        else navigate("/estudiante", { replace: true });
      }
    } catch (err) {
      // Mensaje del backend si existe
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al iniciar sesión";
      toast.error(msg);
      console.error("[LOGIN ERROR]", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-slate-50 via-slate-50 to-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-100"
      >
        <h1 className="text-2xl font-extrabold tracking-tight">
          Sistema Educativo • Iniciar sesión
        </h1>

        <label className="block mt-6 text-sm text-slate-600">Correo</label>
        <input
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 p-2.5"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block mt-4 text-sm text-slate-600">Contraseña</label>
        <input
          type="password"
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 p-2.5"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-slate-900 text-white py-3 font-semibold shadow hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="mt-4 text-center">
          <Link to="/forgot" className="text-sm text-slate-600 hover:text-slate-800">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </form>
    </div>
  );
}

// src/pages/ResetPassword.jsx
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { PasswordAPI } from "../api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // token del query string ?token=...
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token"), []);

  async function onSubmit(e) {
    e.preventDefault();
    if (!password) return toast.error("Escribe una nueva contraseña");
    if (!token) return toast.error("Enlace inválido o sin token");
    setLoading(true);
    try {
      await PasswordAPI.reset({ token, password });
      toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
      // redirige si quieres:
      // window.location.href = "/login";
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Nueva contraseña</h1>
        <label className="text-sm text-gray-600">Contraseña</label>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border p-2"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-gray-900 text-white py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar y entrar"}
        </button>
      </form>
    </div>
  );
}

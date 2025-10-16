// src/pages/ForgotPassword.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import { PasswordAPI } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!email) return toast.error("Escribe tu correo");
    setLoading(true);
    try {
      await PasswordAPI.requestReset(email);
      toast.success("Revisa tu correo para continuar");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo enviar el correo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Recuperar contraseña</h1>
        <label className="text-sm text-gray-600">Correo</label>
        <input
          type="email"
          className="mt-1 w-full rounded-lg border p-2"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-gray-900 text-white py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>
    </div>
  );
}

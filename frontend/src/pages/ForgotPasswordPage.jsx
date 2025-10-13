// src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error('Email inválido');
    }
    try {
      setLoading(true);
      await api.forgotPassword(email.trim());
      toast.success('Si el correo existe, enviamos un enlace para restablecer tu contraseña.');
    } catch (err) {
      toast.error(err.message || 'No se pudo enviar el enlace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>¿Olvidaste tu contraseña?</h2>
      <form onSubmit={submit} className="form">
        <label>Correo</label>
        <input
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />
        <button className="btn" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </button>
      </form>
      <p className="muted">Revisa tu bandeja de entrada y spam.</p>
    </section>
  );
}

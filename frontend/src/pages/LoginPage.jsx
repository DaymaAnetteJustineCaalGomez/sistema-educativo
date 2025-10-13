// src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, tokenStore } from '../api.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return toast.error('Email inválido');
    if (!password) return toast.error('Ingresa tu contraseña');

    try {
      setLoading(true);
      const res = await api.login(email.trim(), password);
      tokenStore.set(res.token);
      toast.success(`Bienvenido, ${res.user?.nombre || 'usuario'}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Iniciar sesión</h2>
      <form onSubmit={onSubmit} className="form">
        <label>Email</label>
        <input
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <label>Contraseña</label>
        <input
          type="password"
          placeholder="********"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button className="btn" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <div className="row">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </div>
      </form>
    </section>
  );
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// src/pages/ResetPasswordPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = useTokenFromQuery();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) toast.error('Token no encontrado en la URL');
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Falta el token');
    if (password.length < 8) return toast.error('Mínimo 8 caracteres');
    if (password !== confirm) return toast.error('Las contraseñas no coinciden');
    try {
      setLoading(true);
      await api.resetPassword(token, password, confirm);
      toast.success('Contraseña actualizada. Inicia sesión con la nueva.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Restablecer contraseña</h2>
      <form onSubmit={submit} className="form">
        <label>Nueva contraseña</label>
        <input
          type="password"
          placeholder="********"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />
        <label>Confirmar contraseña</label>
        <input
          type="password"
          placeholder="********"
          value={confirm}
          onChange={(e)=>setConfirm(e.target.value)}
        />
        <button className="btn" disabled={loading || !token}>
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </section>
  );
}

function useTokenFromQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get('token') || '', [search]);
}

// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, tokenStore } from '../api.js';

export default function DashboardPage() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    (async () => {
      try {
        const res = await api.me();
        setMe(res.user || res);
      } catch (err) {
        tokenStore.clear();
        toast.error('Sesión inválida. Inicia sesión de nuevo.');
        nav('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

  if (loading) return <p>Cargando…</p>;
  if (!me) return null;

  return (
    <section className="card">
      <h2>Dashboard</h2>
      <p><b>Nombre:</b> {me.nombre}</p>
      <p><b>Email:</b> {me.email}</p>
      <p><b>Rol:</b> {me.rol}</p>
      <div className="row">
        <button className="btn outline" onClick={() => { tokenStore.clear(); nav('/login'); }}>
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}

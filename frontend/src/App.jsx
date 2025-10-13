// src/App.jsx
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { tokenStore } from './api.js';

export default function App() {
  return (
    <>
      <nav className="nav">
        <div className="container">
          <Link to="/login" className="brand">Sistema Educativo</Link>
          <div className="spacer" />
          <AuthButtons />
        </div>
      </nav>

      <main className="container pad">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<h3>404 — Página no encontrada</h3>} />
        </Routes>
      </main>

      <Toaster position="top-right" />
    </>
  );
}

function AuthButtons() {
  const navigate = useNavigate();
  const isAuth = !!tokenStore.get();
  if (!isAuth) return null;
  return (
    <button
      className="btn outline"
      onClick={() => { tokenStore.clear(); navigate('/login'); }}
    >
      Cerrar sesión
    </button>
  );
}

// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

// Fallback de rol a ESTUDIANTE si el backend no lo envía
function getRole(user) {
  const r = (user?.rol || user?.role || "ESTUDIANTE");
  return String(r).toUpperCase();
}

export default function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuthStore();

  if (!token || !user) return <Navigate to="/login" replace />;

  const userRole = getRole(user);
  if (roles && !roles.map((r) => String(r).toUpperCase()).includes(userRole)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

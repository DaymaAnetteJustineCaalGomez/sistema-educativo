import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardEstudiante from "./pages/DashboardEstudiante";
import DashboardDocente from "./pages/DashboardDocente";
import DashboardAdmin from "./pages/DashboardAdmin";
import ChooseGrade from "./pages/ChooseGrade";
import StudentHistory from "./pages/StudentHistory";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  // el mail debe enlazar a: /reset-password?token=<TOKEN>
  { path: "/reset-password", element: <ResetPassword /> },
  {
    path: "/estudiante",
    element: (
      <ProtectedRoute roles={["ESTUDIANTE"]}>
        <DashboardEstudiante />
      </ProtectedRoute>
    ),
  },
  {
    path: "/historial",
    element: (
      <ProtectedRoute roles={["ESTUDIANTE"]}>
        <StudentHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: "/docente",
    element: (
      <ProtectedRoute roles={["DOCENTE","ADMIN"]}>
        <DashboardDocente />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute roles={["ADMIN"]}>
        <DashboardAdmin />
      </ProtectedRoute>
    ),
  },
  {
    path: "/elige-grado",
    element: (
      <ProtectedRoute roles={["ESTUDIANTE"]}>
        <ChooseGrade />
      </ProtectedRoute>
    ),
  },
]);

// src/api/index.js
import axios from "axios";
import { useAuthStore } from "../store/auth";

const baseURL = import.meta.env.VITE_API_URL; // ej: http://localhost:5002/api
const api = axios.create({ baseURL, withCredentials: true });

// Bearer token en cada request
api.interceptors.request.use((config) => {
  try {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // if (err?.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  }
);

/* ===================== AUTH ===================== */
export const AuthAPI = {
  login: async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    return data; // { token, user }
  },
  me: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },
};

/* ===================== CNB ====================== */
export const CNBAPI = {
  cursosBasicoPorGrado: async (grado) => {
    const { data } = await api.get(`/cnb/basico/${grado}/cursos`);
    return data;
  },
};

/* ================= PASSWORD RESET =============== */
export const PasswordAPI = {
  requestReset: async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data; // { ok: true }
  },
  reset: async ({ token, password }) => {
    const { data } = await api.post("/auth/reset-password", { token, password });
    return data; // { ok: true }
  },
};

/* ================ ANALYTICS ALUMNO ============== */
export const AnalyticsAPI = {
  resumen: async () => {
    try {
      const { data } = await api.get("/analytics/resumen");
      return {
        promedio: Number(data?.promedio ?? data?.avgScore ?? 0),
        completado: Number(data?.completado ?? data?.completionRate ?? 0),
      };
    } catch {
      return { promedio: 0, completado: 0 };
    }
  },
};

/* ================= PROGRESO ALUMNO ============== */
export const ProgresoAPI = {
  resumen: async () => {
    try {
      const { data } = await api.get("/progreso/resumen");
      return {
        tareasCompletadas: Number(data?.tareasCompletadas ?? data?.completed ?? 0),
        tareasTotales: Number(data?.tareasTotales ?? data?.total ?? 0),
        minutosEstudio: Number(data?.minutosEstudio ?? data?.minutes ?? 0),
      };
    } catch {
      return { tareasCompletadas: 0, tareasTotales: 0, minutosEstudio: 0 };
    }
  },
};

/* ================== HISTORIAL =================== */
export const HistorialAPI = {
  // últimos intentos
  ultimosIntentos: async (limit = 5) => {
    try {
      const { data } = await api.get("/historial/ultimos", { params: { limit } });
      return (Array.isArray(data) ? data : []).map((x, i) => ({
        id: x?._id ?? i,
        curso: x?.curso?.nombre ?? x?.curso ?? "Curso",
        puntaje: Number(x?.puntaje ?? x?.score ?? 0),
        estado: x?.estado ?? x?.status ?? "pendiente",
        fecha: x?.fecha ?? x?.createdAt ?? new Date().toISOString(),
        duracionMin: Number(x?.duracionMin ?? x?.minutes ?? 0),
      }));
    } catch {
      return [];
    }
  },
  // listado paginado (si lo tienes)
  listar: async ({ page = 1, limit = 20 } = {}) => {
    try {
      const { data } = await api.get("/historial", { params: { page, limit } });
      return data ?? { items: [], total: 0, page, limit };
    } catch {
      return { items: [], total: 0, page, limit };
    }
  },
};
// Alias retrocompatible para páginas que importan `HistoryAPI`
export const HistoryAPI = HistorialAPI;

/* ==================== DOCENTE ==================== */
export const DocenteAPI = {
  resumen: async () => {
    try {
      const { data } = await api.get("/docente/resumen");
      return {
        promedioGrupo: Number(data?.promedioGrupo ?? 0),
        estudiantesActivos: Number(data?.estudiantesActivos ?? 0),
        tareasCalificadas: Number(data?.tareasCalificadas ?? 0),
        coberturaCNB: Number(data?.coberturaCNB ?? 0),
      };
    } catch {
      return { promedioGrupo: 0, estudiantesActivos: 0, tareasCalificadas: 0, coberturaCNB: 0 };
    }
  },
  coberturaAreas: async () => {
    try {
      const { data } = await api.get("/docente/cobertura/areas");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  entregasRecientes: async (limit = 5) => {
    try {
      const { data } = await api.get("/docente/entregas/recientes", { params: { limit } });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};

/* ===================== ADMIN ===================== */
export const AdminAPI = {
  resumen: async () => {
    try {
      const { data } = await api.get("/admin/resumen");
      return {
        usuariosTotales: Number(data?.usuariosTotales ?? 0),
        instituciones: Number(data?.instituciones ?? 0),
        cursosCNB: Number(data?.cursosCNB ?? 0),
        tasaAbandono: Number(data?.tasaAbandono ?? 0),
      };
    } catch {
      return { usuariosTotales: 0, instituciones: 0, cursosCNB: 0, tasaAbandono: 0 };
    }
  },
  listarUsuarios: async (params = { page: 1, limit: 20 }) => {
    try {
      const { data } = await api.get("/admin/usuarios", { params });
      return data ?? { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  },
  listarInstituciones: async (params = { page: 1, limit: 20 }) => {
    try {
      const { data } = await api.get("/admin/instituciones", { params });
      return data ?? { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  },
};

// axios instance para uso directo si lo necesitas
export { api };

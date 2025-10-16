// src/api/historial.js
import { api } from "./index";

export const HistorialAPI = {
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
};

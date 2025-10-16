// src/api/analytics.js
import { api } from "./index";

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

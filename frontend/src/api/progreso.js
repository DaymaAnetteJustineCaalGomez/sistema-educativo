// src/api/progreso.js
import { api } from "./index";

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

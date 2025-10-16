// src/components/StatsRow.jsx
import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import { ProgresoAPI } from "../api/progreso";

function Card({ title, value, suffix = "", hint, colorFrom, colorTo }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur p-4 shadow-sm">
      <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-40"
           style={{ background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }} />
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">
        {value}{suffix}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default function StatsRow() {
  const [promedio, setPromedio] = useState(0);
  const [completado, setCompletado] = useState(0);
  const [tareas, setTareas] = useState({ tareasCompletadas: 0, tareasTotales: 0 });
  const [minutos, setMinutos] = useState(0);

  useEffect(() => {
    (async () => {
      const a = await AnalyticsAPI.resumen();
      setPromedio(Math.round(a.promedio));
      setCompletado(Math.round(a.completado));
      const p = await ProgresoAPI.resumen();
      setTareas({ tareasCompletadas: p.tareasCompletadas, tareasTotales: p.tareasTotales });
      setMinutos(p.minutosEstudio);
    })();
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        title="Promedio general"
        value={isFinite(promedio) ? promedio : 0}
        suffix=" pts"
        hint="Promedio de tus evaluaciones"
        colorFrom="#6366F1" colorTo="#8B5CF6"
      />
      <Card
        title="Progreso total"
        value={isFinite(completado) ? completado : 0}
        suffix="%"
        hint="Porcentaje de contenidos completados"
        colorFrom="#22C55E" colorTo="#14B8A6"
      />
      <Card
        title="Tareas completadas"
        value={`${tareas.tareasCompletadas}/${tareas.tareasTotales}`}
        hint="Actividades finalizadas"
        colorFrom="#F59E0B" colorTo="#F97316"
      />
      <Card
        title="Tiempo de estudio"
        value={Math.round(minutos)}
        suffix=" min"
        hint="Acumulado esta semana"
        colorFrom="#EC4899" colorTo="#EF4444"
      />
    </div>
  );
}

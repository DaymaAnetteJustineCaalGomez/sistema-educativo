// src/pages/DashboardDocente.jsx  (solo si necesitas)
import { useEffect, useState } from "react";
import { DocenteAPI } from "../api";
import Header from "../components/Header";

export default function DashboardDocente() {
  const [kpi, setKpi] = useState({
    promedioGrupo: 0,
    estudiantesActivos: 0,
    tareasCalificadas: 0,
    coberturaCNB: 0,
  });
  const [recientes, setRecientes] = useState([]);

  useEffect(() => {
    (async () => {
      setKpi(await DocenteAPI.resumen());
      setRecientes(await DocenteAPI.entregasRecientes(5));
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-sky-50 to-white">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-extrabold mb-6">Docente • Analíticas y Cobertura CNB</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="Promedio del grupo" value={`${Math.round(kpi.promedioGrupo)} pts`} />
          <Kpi title="Estudiantes activos" value={kpi.estudiantesActivos} />
          <Kpi title="Tareas calificadas" value={kpi.tareasCalificadas} />
          <Kpi title="Cobertura CNB" value={`${Math.round(kpi.coberturaCNB)}%`} />
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Entregas recientes</h2>
          {recientes.length === 0 ? (
            <div className="rounded-2xl border bg-white/70 backdrop-blur p-5 text-gray-600">
              Sin datos aún.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-white/70 backdrop-blur shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/60 text-gray-500">
                  <tr>
                    <th className="text-left p-3">Alumno</th>
                    <th className="text-left p-3">Curso</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-right p-3">Puntaje</th>
                    <th className="text-right p-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="p-3">{r.alumno ?? "—"}</td>
                      <td className="p-3">{r.curso ?? "—"}</td>
                      <td className="p-3">{r.estado ?? "—"}</td>
                      <td className="p-3 text-right">{Math.round(r.puntaje ?? 0)} pts</td>
                      <td className="p-3 text-right">
                        {r.fecha ? new Date(r.fecha).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Kpi({ title, value }) {
  return (
    <div className="rounded-2xl border bg-white/70 backdrop-blur p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

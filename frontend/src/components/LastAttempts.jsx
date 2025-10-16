import { useEffect, useState } from "react";
import { HistoryAPI } from "../api"; // alias de HistorialAPI

export default function LastAttempts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await HistoryAPI.ultimosIntentos(5);
      setRows(data);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-3">
        {/* Título cambiado */}
        <h2 className="text-xl font-semibold">Historial</h2>
        {/* texto del link también actualizado */}
        <a className="text-indigo-600 hover:text-indigo-800 text-sm" href="/historial">
          Ver historial
        </a>
      </div>

      <div className="rounded-2xl border bg-white/70 backdrop-blur">
        {loading ? (
          <div className="p-6 text-gray-600">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-gray-600">Aún no tienes historial.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50/60 text-gray-500">
              <tr>
                <th className="text-left p-3">Curso</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-right p-3">Puntaje</th>
                <th className="text-right p-3">Fecha</th>
                <th className="text-right p-3">Duración</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="p-3">{r.curso}</td>
                  <td className="p-3">{r.estado}</td>
                  <td className="p-3 text-right">{Math.round(r.puntaje)} pts</td>
                  <td className="p-3 text-right">
                    {r.fecha ? new Date(r.fecha).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3 text-right">{r.duracionMin ?? 0} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

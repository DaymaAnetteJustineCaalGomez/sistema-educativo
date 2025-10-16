import { useEffect, useState } from "react";
import { HistoryAPI } from "../api";
import Header from "../components/Header";

export default function StudentHistory() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const pages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    (async () => {
      const { items: data = [], total: t = 0 } =
        (await HistoryAPI.listar({ page, limit })) ?? {};
      setItems(data);
      setTotal(t);
    })();
  }, [page]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-sky-50 to-white">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-extrabold mb-6">Historial de intentos</h1>

        <div className="rounded-2xl border bg-white/70 backdrop-blur">
          {items.length === 0 ? (
            <div className="p-6 text-gray-600">Sin datos.</div>
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
                {items.map((r, i) => (
                  <tr key={r._id || r.id || i} className="border-t border-gray-100">
                    <td className="p-3">{r.curso?.nombre ?? r.curso ?? "—"}</td>
                    <td className="p-3">{r.estado ?? "—"}</td>
                    <td className="p-3 text-right">{Math.round(r.puntaje ?? 0)} pts</td>
                    <td className="p-3 text-right">
                      {r.fecha ? new Date(r.fecha).toLocaleString() : "—"}
                    </td>
                    <td className="p-3 text-right">{r.duracionMin ?? 0} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </main>
    </div>
  );
}

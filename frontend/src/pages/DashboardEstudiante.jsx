// src/pages/DashboardEstudiante.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/auth";
import { CNBAPI } from "../api";
import CourseCard from "../components/CourseCard";
import Header from "../components/Header";
import StatsRow from "../components/StatsRow";
import LastAttempts from "../components/LastAttempts";

export default function DashboardEstudiante() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const grado = user?.grado; // 1 | 2 | 3

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!token || !grado) { setLoading(false); return; }
      setLoading(true);
      try {
        const data = await CNBAPI.cursosBasicoPorGrado(grado);
        if (active) setCursos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[CNB] error", err);
        toast.error("No se pudieron cargar los cursos del CNB");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [token, grado]);

  return (
    <div className="min-h-screen relative">
      {/* fondo */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-sky-50 to-white" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-fuchsia-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-300/30 blur-3xl" />

      <Header />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Hero */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Mis cursos CNB • {grado ? `${grado}° Básico` : "Ciclo Básico"}
          </h1>
          <p className="text-gray-600 mt-1">
            Continúa aprendiendo con los contenidos oficiales del CNB.
          </p>
        </div>

        {/* KPIs */}
        <StatsRow />

        {/* Recomendaciones */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">Recomendado para ti</h2>
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur p-5 shadow-sm">
            <p className="text-gray-600">
              Aún no hay recomendaciones. Completa algunos subtemas para generarlas.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="my-8 h-0.5 w-full bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent rounded-full" />

        {/* Cursos del CNB */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Cursos del CNB</h2>
            <div className="h-1 w-28 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500" />
          </div>

          {loading && (
            <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur p-5 shadow-sm text-gray-600">
              Cargando cursos...
            </div>
          )}

          {!loading && cursos.length === 0 && (
            <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur p-5 shadow-sm text-gray-600">
              No hay cursos para tu grado. Verifica el endpoint <code>/cnb/basico/:grado/cursos</code>.
            </div>
          )}

          {cursos.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cursos.map((c) => (
                <CourseCard
                  key={c._id}
                  title={c.titulo || c.area}
                  competencias={c.competenciasCount ?? 0}
                  recursos={c.recursosCount ?? 0}
                  progreso={c.progreso ?? 0}
                  onClick={() => console.log("Abrir curso:", c)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="my-8 h-0.5 w-full bg-gradient-to-r from-transparent via-fuchsia-300/60 to-transparent rounded-full" />

        {/* Últimos intentos */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Últimos intentos</h2>
            <a href="/historial" className="text-indigo-700 text-sm font-medium hover:underline">
              Ver todo
            </a>
          </div>
          <div className="mt-3">
            <LastAttempts />
          </div>
        </section>
      </main>
    </div>
  );
}

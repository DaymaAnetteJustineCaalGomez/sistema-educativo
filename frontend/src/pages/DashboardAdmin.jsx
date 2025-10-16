import { useEffect, useState } from "react";
import Header from "../components/Header";
import { AdminAPI } from "../api";

export default function DashboardAdmin(){
  const [ov,setOv]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const d = await AdminAPI.overview();
        setOv(d);
      } finally { setLoading(false); }
    })();
  },[]);

  return (
    <>
      <Header title="Administrador • Visión Institucional" />
      <div className="max-w-6xl mx-auto p-6 grid gap-5">
        {loading ? (
          <div className="text-gray-600">Cargando...</div>
        ) : !ov ? (
          <div className="text-gray-600">Sin datos aún.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Usuarios" value={ov.usuarios ?? "—"} />
              <StatCard label="Tasa de abandono" value={`${ov.tasasAbandono ?? 0}%`} />
              <StatCard label="Cobertura CNB global" value={`${ov.coberturaGlobal ?? 0}%`} />
              <StatCard label="Uso de recursos" value={ov.usoRecursos ?? "—"} />
            </div>
          </>
        )}
      </div>
    </>
  );
}

function StatCard({label,value}){
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

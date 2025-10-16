import { useState } from "react";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import { AuthAPI } from "../api";
import { useAuthStore } from "../store/auth";
import { useNavigate } from "react-router-dom";

export default function ChooseGrade(){
  const { user, setUser } = useAuthStore();
  const [grado, setGrado] = useState(user?.grado ?? 1);
  const nav = useNavigate();

  async function guardar(){
    try {
      const { user: u } = await AuthAPI.updateMe({ grado });
      setUser(u);
      toast.success("Grado guardado");
      nav("/estudiante", { replace: true });
    } catch {
      toast.error("No se pudo guardar el grado");
    }
  }

  return (
    <>
      <Header title="Selecciona tu grado (Ciclo Básico)" />
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-gray-700 mb-4">Se traerán automáticamente los cursos del CNB.</p>
        <div className="flex gap-3">
          {[1,2,3].map(g=>(
            <button key={g}
              className={`px-5 py-3 rounded-2xl border ${grado===g?'bg-gray-900 text-white':'bg-white'}`}
              onClick={()=>setGrado(g)}>
              {g}° Básico
            </button>
          ))}
        </div>
        <button onClick={guardar}
          className="mt-6 px-5 py-3 rounded-2xl bg-gray-900 text-white">
          Guardar y continuar
        </button>
      </div>
    </>
  );
}

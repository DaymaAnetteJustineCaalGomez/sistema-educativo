// src/components/Header.jsx
import { useAuthStore } from "../store/auth";
import NotificationsBell from "./NotificationsBell";

export default function Header() {
  const { user, logout } = useAuthStore.getState();
  const role = String(user?.rol || user?.role || "ESTUDIANTE").toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/40 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white font-semibold shadow">
            SE
          </span>
          <h1 className="text-base font-semibold tracking-tight text-gray-800">
            Sistema Educativo
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <NotificationsBell />

          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-800">
            <span className="truncate max-w-[180px]">{user?.nombre || "Usuario"}</span>
            <span className="text-gray-400">•</span>
            <span className="font-semibold bg-gradient-to-r from-indigo-700 to-fuchsia-600 bg-clip-text text-transparent">
              {role}
            </span>
          </div>

          <button
            onClick={() => logout()}
            className="rounded-xl bg-gray-900 px-3 py-1.5 text-white text-sm font-medium shadow hover:opacity-90 active:scale-[.98] transition"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}

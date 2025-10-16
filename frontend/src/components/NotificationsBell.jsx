// src/components/NotificationsBell.jsx
import { useState } from "react";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  // Aquí podrías conectar tu endpoint de notificaciones
  const notifications = []; // de momento vacío

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 rounded-xl border bg-white hover:bg-gray-50 grid place-items-center"
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        {/* Ícono campana (SVG liviano) */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-red-600 px-1 text-[10px] leading-4 text-white text-center">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border bg-white shadow-xl p-2">
          <p className="px-2 py-1 text-sm text-gray-500">Sin notificaciones aún.</p>
        </div>
      )}
    </div>
  );
}

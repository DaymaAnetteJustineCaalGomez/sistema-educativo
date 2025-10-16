// src/components/CourseCard.jsx
function hueFromString(s = "") {
  // genera un tono consistente por título (0..360)
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export default function CourseCard({
  title,
  competencias = 0,
  recursos = 0,
  progreso = 0,
  onClick,
}) {
  const hue = hueFromString(title);
  const bar = `hsl(${hue} 90% 45%)`;
  const pillBg = `hsl(${hue} 100% 96%)`;
  const pillText = `hsl(${hue} 80% 25%)`;

  return (
    <article
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer"
    >
      {/* halo de color */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition"
        style={{ background: `hsl(${hue} 95% 85%)` }}
      />
      <div className="flex items-start gap-2">
        <div
          className="h-9 w-9 shrink-0 rounded-xl grid place-items-center shadow-inner"
          style={{ background: pillBg, color: pillText }}
          aria-hidden
        >
          {/* iconito */}
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
              fill="currentColor"
              d="M5 4h14a1 1 0 0 1 1 1v13.5a.5.5 0 0 1-.79.407L12 14.5l-7.21 4.407A.5.5 0 0 1 4 18.5V5a1 1 0 0 1 1-1Z"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-lg leading-snug text-gray-900">{title}</h3>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        {competencias} competencias • {recursos} recursos
      </p>

      {/* barra de progreso */}
      <div className="mt-3">
        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${Math.min(Math.max(progreso, 0), 100)}%`,
              background: bar,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{progreso}% completado</p>
      </div>

      {/* botón fantasma */}
      <div
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gray-800 group-hover:text-gray-900"
        style={{ color: pillText }}
      >
        Ver contenidos
        <svg className="h-4 w-4 translate-x-0 group-hover:translate-x-0.5 transition"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </div>
    </article>
  );
}

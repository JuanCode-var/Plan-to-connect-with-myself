import { Link } from "react-router-dom";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER } from "../NeuralCore/tokens";

const MILESTONES = [
  { d: 7, label: "Primera semana", desc: "El impulso viejo ya no manda solo." },
  { d: 21, label: "Sendero", desc: "El camino nuevo empieza a marcarse." },
  { d: 30, label: "Un mes", desc: "Un mes entero eligiéndote." },
  { d: 66, label: "Automático", desc: "El promedio en que un hábito se vuelve automático." },
  { d: 90, label: "Ciclo completo", desc: "Recableado de un ciclo entero." },
];

/**
 * "Circuito en recableado" — una tarjeta por contador de abstinencia
 * (días sin alcohol/apuestas, ver SPECIFIC_COUNTERS en
 * apps/api/src/routes/dashboard.ts). Sin botón "+1 día" del mockup: ese
 * era un atajo de la herramienta de diseño sin acción real detrás — acá el
 * único lugar real donde ese número sube es marcando el hábito en el
 * checklist, así que el CTA real es un enlace a Seguimiento, no un botón
 * que finja escribir en la base.
 */
export function RewireCard({
  name,
  color,
  rgb,
  days,
  reachedToday,
}: {
  name: string;
  color: string;
  rgb: string;
  days: number;
  reachedToday: boolean;
}) {
  const clamped = Math.min(90, days);
  const zero = clamped === 0;
  let last: (typeof MILESTONES)[number] | null = null;
  for (const m of MILESTONES) if (clamped >= m.d) last = m;
  const next = MILESTONES.find((m) => m.d > clamped) ?? null;
  const stage = zero ? "Hoy empieza el recableado" : last ? last.label : "Chispa";

  let sub: string;
  if (reachedToday && last) sub = `¡Hito de ${last.d} días: ${last.label}! ${last.desc}`;
  else if (zero) sub = "Sin culpa: cada día limpio es un impulso nuevo. El sendero se construye desde aquí.";
  else if (next) sub = `Faltan ${next.d - clamped} ${next.d - clamped === 1 ? "día" : "días"} para el hito "${next.label}".`;
  else sub = "Ciclo completo. Este circuito ya es tuyo.";

  return (
    <div
      style={{
        padding: "20px 22px",
        borderRadius: 20,
        background: `rgba(${rgb},0.05)`,
        border: `1px solid rgba(${rgb},${zero ? 0.25 : 0.4})`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
            CIRCUITO EN RECABLEADO
          </span>
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>{name}</span>
        </div>
        <Link
          to="/tracker#tracker-checklist"
          style={{
            height: 44,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            borderRadius: 12,
            fontFamily: NEURAL_FONT_BODY,
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
            color,
            border: `1px solid ${color}`,
            textDecoration: "none",
          }}
        >
          Ver en Seguimiento
        </Link>
      </div>

      <div className="flex items-baseline gap-2.5">
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 42, fontWeight: 700, lineHeight: 1, color: zero ? "#FFFFFF" : color }}>
          {zero ? "Día 0" : String(clamped)}
        </span>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 15, fontWeight: 600, color: "#E6E9F5" }}>{stage}</span>
      </div>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, lineHeight: 1.45, color: "#A9B1D6", minHeight: 38 }}>{sub}</span>

      <div className="relative" style={{ height: 34 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 4, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)" }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 4,
            height: 8,
            borderRadius: 4,
            width: `${(clamped / 90) * 100}%`,
            background: color,
            boxShadow: `0 0 10px ${color}`,
            transition: "width .6s ease",
          }}
        />
        {MILESTONES.map((m) => {
          const reached = clamped >= m.d;
          const left = (m.d / 90) * 100;
          return (
            <div key={m.d}>
              <div
                style={{
                  position: "absolute",
                  left: `calc(${left}% - 7px)`,
                  top: 1,
                  width: 14,
                  height: 14,
                  boxSizing: "border-box",
                  borderRadius: "50%",
                  background: reached ? color : "#0E1330",
                  border: `2px solid ${reached ? color : "rgba(255,255,255,0.3)"}`,
                  boxShadow: reached ? `0 0 10px ${color}` : "none",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  top: 19,
                  transform: m.d === 90 ? "translateX(-100%)" : "translateX(-50%)",
                  fontFamily: NEURAL_FONT_BODY,
                  fontSize: 11,
                  color: reached ? "#FFFFFF" : "#A9B1D6",
                  fontWeight: reached ? 600 : 400,
                }}
              >
                {m.d}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

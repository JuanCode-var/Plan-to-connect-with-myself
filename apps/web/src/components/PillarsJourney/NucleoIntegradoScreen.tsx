import { Link } from "react-router-dom";
import { NEURAL_CYAN, NEURAL_GOLD, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { PILLARS } from "./pillarsJourneyShared";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

/** "Núcleo integrado" (Paso 5) — pantalla final cuando los 3 pilares quedan sellados el mismo recorrido (mockup 18i). */
export function NucleoIntegradoScreen({
  strengthsUsed,
  strengthsTotal,
  valuesLived,
  valuesTotal,
  hasPurposeAction,
  nextReviewSuggestedAt,
  onRestart,
}: {
  strengthsUsed: number;
  strengthsTotal: number;
  valuesLived: number;
  valuesTotal: number;
  hasPurposeAction: boolean;
  nextReviewSuggestedAt: string | null;
  onRestart: () => void;
}) {
  return (
    <div className="mx-auto flex w-full flex-col gap-8 rounded-[28px] p-9 sm:flex-row sm:items-center" style={{ maxWidth: 880, background: "linear-gradient(160deg, rgba(253,230,138,0.08), rgba(7,11,31,0.6))", border: "1px solid rgba(253,230,138,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,.45)" }}>
      <svg width="220" height="200" viewBox="0 0 220 200" className="mx-auto shrink-0 sm:mx-0" aria-hidden>
        <defs>
          <radialGradient id="nucleo-glow" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor={NEURAL_GOLD} stopOpacity="0.7" />
            <stop offset="100%" stopColor={NEURAL_GOLD} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="110" cy="120" r="55" fill="url(#nucleo-glow)" />
        <path d="M110 25 L190 165 L30 165 Z" fill="none" stroke={NEURAL_GOLD} strokeWidth="2" opacity={0.8} />
        <circle cx="110" cy="120" r="5" fill={NEURAL_GOLD} />
        {([
          [110, 25, PILLARS[0].glyph, "Quién soy"],
          [30, 165, PILLARS[1].glyph, "Qué defiendo"],
          [190, 165, PILLARS[2].glyph, "Hacia dónde voy"],
        ] as const).map(([cx, cy, glyph, label]) => (
          <g key={label}>
            <circle cx={cx} cy={cy} r="18" fill="#070B1F" stroke={NEURAL_GOLD} strokeWidth="2" />
            <text x={cx} y={cy + 6} textAnchor="middle" fontSize="15" fill={NEURAL_GOLD}>
              {glyph}
            </text>
            <text x={cx} y={cy + (cy < 100 ? -28 : 36)} textAnchor="middle" fontSize="11" fill={NEURAL_TEXT_SECONDARY} style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {label}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_GOLD, letterSpacing: "1.5px" }}>
            Núcleo integrado
          </span>
          <h2 className="m-0 text-2xl font-bold sm:text-3xl" style={{ color: NEURAL_TEXT }}>
            Tus tres pilares están alineados.
          </h2>
          <p className="m-0 text-base" style={{ color: NEURAL_TEXT_SECONDARY, lineHeight: 1.6, maxWidth: 480 }}>
            Quién eres, qué defiendes y hacia dónde vas apuntan hoy en la misma dirección.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "rgba(255,255,255,0.08)", color: NEURAL_TEXT }}>
            <span style={{ color: NEURAL_GOLD }}>{strengthsUsed}/{strengthsTotal}</span> fortalezas usadas
          </span>
          <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "rgba(255,255,255,0.08)", color: NEURAL_TEXT }}>
            <span style={{ color: NEURAL_GOLD }}>{valuesLived}/{valuesTotal}</span> valores vividos
          </span>
          <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "rgba(255,255,255,0.08)", color: NEURAL_TEXT }}>
            <span style={{ color: NEURAL_GOLD }}>{hasPurposeAction ? 1 : 0}/1</span> acción de propósito
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/identidad" className="rounded-xl px-5 py-3 text-sm font-bold" style={{ background: NEURAL_CYAN, color: "#070B1F" }}>
            Volver a Mi identidad
          </Link>
          <button type="button" onClick={onRestart} className="rounded-xl border px-5 py-3 text-sm font-bold" style={{ borderColor: "rgba(34,211,238,.35)", color: NEURAL_CYAN }}>
            Recorrer de nuevo
          </button>
        </div>

        {nextReviewSuggestedAt && (
          <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Próximo recorrido sugerido: {formatDate(nextReviewSuggestedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

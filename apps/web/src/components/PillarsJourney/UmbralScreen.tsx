import { useEffect } from "react";
import { NEURAL_CYAN, NEURAL_GOLD, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { HoldButton } from "./HoldButton";
import type { PillarMeta } from "./pillarsJourneyShared";

/** "Umbral" (Paso 4) — pausa de confirmación entre pilares, con animación de sello al completar (mockups 18d/18e). */
export function UmbralScreen({
  from,
  to,
  sealed,
  sealPhrase,
  onCross,
  onAdjust,
  onAdvance,
}: {
  from: PillarMeta;
  to: PillarMeta | null;
  sealed: boolean;
  sealPhrase: string;
  onCross: () => void;
  onAdjust: () => void;
  onAdvance: () => void;
}) {
  useEffect(() => {
    if (!sealed) return;
    const t = setTimeout(onAdvance, 1500);
    return () => clearTimeout(t);
  }, [sealed, onAdvance]);

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-7 rounded-[28px] p-9 text-center" style={{ maxWidth: 880, background: "linear-gradient(160deg, rgba(34,211,238,0.06), rgba(7,11,31,0.6))", border: "1px solid rgba(34,211,238,0.2)", boxShadow: "0 24px 60px rgba(0,0,0,.45)" }}>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_TEXT_SECONDARY, letterSpacing: "1.5px" }}>
          Umbral
        </span>
        <h2 className="m-0 text-2xl font-bold" style={{ color: NEURAL_TEXT }}>
          {from.name} {to ? `→ ${to.name}` : "→ Núcleo integrado"}
        </h2>
      </div>

      <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
        <defs>
          <linearGradient id="umbral-gate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sealed ? NEURAL_GOLD : "#C4B5FD"} />
            <stop offset="100%" stopColor={NEURAL_CYAN} />
          </linearGradient>
        </defs>
        <path d="M20 120 L20 55 Q20 15 70 15 Q120 15 120 55 L120 120" fill="none" stroke="url(#umbral-gate)" strokeWidth="3" opacity={0.6} />
        <line x1="70" y1="30" x2="70" y2="105" stroke={sealed ? NEURAL_GOLD : NEURAL_CYAN} strokeWidth="4" strokeLinecap="round" />
        {to && (
          <text x="70" y="72" textAnchor="middle" fontSize="20" fill={sealed ? NEURAL_GOLD : NEURAL_CYAN}>
            {to.glyph}
          </text>
        )}
      </svg>

      {sealed ? (
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold" style={{ background: NEURAL_GOLD, color: "#070B1F" }}>
            ✓
          </span>
          <span className="text-xl font-bold" style={{ color: NEURAL_GOLD }}>
            {from.name} sellado
          </span>
          <p className="m-0 font-reading text-base italic" style={{ color: NEURAL_TEXT }}>
            {sealPhrase}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="m-0 text-lg" style={{ color: NEURAL_TEXT }}>
            Antes de cruzar: ¿te reconoces en lo que acabas de leer?
          </p>
          <HoldButton size={96} onComplete={onCross} />
          <span className="text-sm font-bold" style={{ color: NEURAL_TEXT }}>
            Sí, este soy yo · mantén para cruzar
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={onAdjust} className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: "rgba(34,211,238,.35)", color: NEURAL_CYAN }}>
              Quiero ajustar algo
            </button>
            <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Cruzar sella este pilar por hoy.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

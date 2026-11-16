import { NEURAL_FONT_BODY, NEURAL_LAVENDER } from "../NeuralCore/tokens";
import { nextResonanceThreshold, resonanceStateFor } from "./resonanceTokens";

/**
 * "Próximo disparo" — cuántos impulsos faltan para el siguiente estado de
 * RESONANCE_STATES. Si el ciclo ya está en Pleno (100%), no hay "próximo":
 * se muestra un cierre distinto en vez de forzar un umbral que no existe.
 */
export function NextTriggerCard({ percentGeneral, completado, pendiente }: { percentGeneral: number; completado: number; pendiente: number }) {
  const next = nextResonanceThreshold(percentGeneral);
  const current = resonanceStateFor(percentGeneral);
  const denom = completado + pendiente;

  if (!next) {
    return (
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 14,
          background: "rgba(253,230,138,0.08)",
          border: "1px solid rgba(253,230,138,0.40)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", color: "#FDE68A" }}>
          NÚCLEO PLENO
        </span>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, lineHeight: 1.4, color: "#FFFFFF" }}>
          Tu ciclo ya resuena al máximo — nivel Pleno alcanzado.
        </span>
      </div>
    );
  }

  const toNext = Math.max(0, Math.ceil((next.minPercent / 100) * denom) - completado);
  const bandProgress =
    next.minPercent > current.minPercent
      ? Math.max(0, Math.min(100, ((percentGeneral - current.minPercent) / (next.minPercent - current.minPercent)) * 100))
      : 100;

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        background: "rgba(167,139,250,0.07)",
        border: "1px solid rgba(167,139,250,0.40)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
        PRÓXIMO DISPARO · {next.label.toUpperCase()}
      </span>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, lineHeight: 1.4, color: "#FFFFFF" }}>
        Faltan <strong style={{ color: NEURAL_LAVENDER }}>{toNext} impulsos</strong> para que tu ciclo entre en {next.label}.
      </span>
      <div style={{ position: "relative", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: 6,
            width: `${bandProgress}%`,
            borderRadius: 3,
            background: "linear-gradient(90deg, #22D3EE, #A78BFA)",
            transition: "width .5s ease",
          }}
        />
      </div>
    </div>
  );
}

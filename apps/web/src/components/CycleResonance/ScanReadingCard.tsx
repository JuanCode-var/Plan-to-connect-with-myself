import { Link } from "react-router-dom";
import { BRAIN_AREA_COLOR } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_LAVENDER, NEURAL_TEXT_SOFT } from "../NeuralCore/tokens";
import type { ResonanceArea } from "./useCycleResonance";

/**
 * "Lectura del escaneo" — texto generado a partir de `byArea` real (nunca
 * fijo): región más alta, más baja, y áreas sin hábitos todavía, con un CTA
 * real a /habits?area={key} (mismo filtro ya construido para "Reactivar" en
 * Mi Mapa Neuronal — reutilizado, no inventado) para la PRIMERA área vacía.
 */
export function ScanReadingCard({ byArea }: { byArea: ResonanceArea[] }) {
  const withData = byArea.filter((a) => a.percent !== null) as Array<ResonanceArea & { percent: number }>;
  const missing = byArea.filter((a) => a.percent === null);

  const highest = withData.length > 0 ? withData.reduce((best, a) => (a.percent > best.percent ? a : best)) : null;
  const lowestCandidates = withData.filter((a) => a.area !== highest?.area);
  const lowest = lowestCandidates.length > 0 ? lowestCandidates.reduce((worst, a) => (a.percent < worst.percent ? a : worst)) : null;

  const missingNames = missing.map((a) => a.label);
  const missingSentence =
    missingNames.length === 0
      ? null
      : missingNames.length === 1
        ? `${missingNames[0]} todavía no tiene circuitos.`
        : `${missingNames.slice(0, -1).join(", ")} y ${missingNames[missingNames.length - 1]} todavía no tienen circuitos.`;

  const ctaArea = missing[0];

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
        LECTURA DEL ESCANEO
      </span>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, lineHeight: 1.5, color: NEURAL_TEXT_SOFT }}>
        {highest ? (
          <>
            Tu región más encendida es{" "}
            <strong style={{ color: BRAIN_AREA_COLOR[highest.area] }}>
              {highest.label} ({highest.percent}%)
            </strong>
            .{" "}
          </>
        ) : (
          "Todavía no hay suficientes hábitos cumplidos este ciclo para leer tu escaneo. "
        )}
        {lowest && (
          <>
            La más débil es{" "}
            <strong style={{ color: BRAIN_AREA_COLOR[lowest.area] }}>
              {lowest.label} ({lowest.percent}%)
            </strong>
            {missingSentence ? ", y " : "."}
          </>
        )}
        {missingSentence}
      </span>
      {ctaArea && (
        <Link to={`/habits?area=${ctaArea.area}`} style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          Crear mi primer hábito {ctaArea.label.toLowerCase()} →
        </Link>
      )}
    </div>
  );
}

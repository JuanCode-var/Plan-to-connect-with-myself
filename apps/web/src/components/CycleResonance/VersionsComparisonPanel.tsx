import { BRAIN_AREAS, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB } from "../NeuralCore/brainTokens";
import { NEURAL_CARD_BG, NEURAL_VIOLET_CARD_BORDER, NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import type { ResonanceArea } from "./useCycleResonance";
import { identityGrowthArea } from "./versionesLogic";

/**
 * "Lo que cambió de vN-1 a vN" (sección 5 del pedido). Sin ciclo anterior
 * real con qué comparar, se muestra como "Línea base" (sin barra tenue ni
 * delta inventado) en vez de fingir una comparación que no existe.
 */
export function VersionsComparisonPanel({
  current,
  previous,
  currentLabel,
  previousLabel,
  daysUntilClose,
}: {
  current: ResonanceArea[];
  previous: ResonanceArea[] | null;
  currentLabel: string;
  previousLabel: string | null;
  daysUntilClose: number;
}) {
  const percentOf = (areas: ResonanceArea[], area: (typeof BRAIN_AREAS)[number]) => areas.find((a) => a.area === area)?.percent ?? null;

  const growthArea = previous ? identityGrowthArea(current, previous) : null;
  const strongestArea = current.reduce<(typeof BRAIN_AREAS)[number] | null>((best, a) => {
    if (a.percent === null) return best;
    if (!best) return a.area;
    return a.percent > (percentOf(current, best) ?? -1) ? a.area : best;
  }, null);

  const title = previous ? `LO QUE CAMBIÓ DE ${previousLabel} A ${currentLabel}` : "LÍNEA BASE · TU PRIMERA VERSIÓN REGISTRADA";
  const legend = previous ? `barra tenue = ${previousLabel} · barra brillante = ${currentLabel}` : "así arranca tu historia medida";

  let note: string;
  if (!previous) {
    note = `Al cerrar el ciclo (en ${daysUntilClose} días) vas a ver acá cuánto cambió cada región entre ${currentLabel} y la siguiente versión.`;
  } else if (!growthArea) {
    note = "Todavía no hay hábitos registrados para comparar entre estas dos versiones.";
  } else {
    const delta = Math.round((percentOf(current, growthArea) ?? 0) - (percentOf(previous, growthArea) ?? 0));
    const deltaText = delta >= 0 ? `+${delta}` : String(delta);
    const suffix = growthArea === strongestArea ? "y ya es tu área más fuerte." : "sin ser la más fuerte todavía: está despertando.";
    note = `${BRAIN_AREA_LABEL[growthArea]} fue la región que más creció (${deltaText}) ${suffix}`;
  }

  return (
    <div
      className="flex h-full flex-col gap-1.5 rounded-[20px] p-5"
      style={{ background: NEURAL_CARD_BG, border: `1px solid ${NEURAL_VIOLET_CARD_BORDER}` }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER, fontFamily: NEURAL_FONT_BODY }}>{title}</span>
        <span style={{ fontSize: 12, color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY }}>{legend}</span>
      </div>

      {BRAIN_AREAS.map((area) => {
        const now = percentOf(current, area);
        const prev = previous ? percentOf(previous, area) : null;
        const delta = previous && now !== null ? Math.round(now - (prev ?? 0)) : null;
        const color = BRAIN_AREA_COLOR[area];
        const rgb = BRAIN_AREA_RGB[area];
        return (
          <div key={area} className="flex items-center gap-3" style={{ height: 26 }}>
            <span style={{ width: 96, flexShrink: 0, fontSize: 13, fontWeight: 600, color: "#FFFFFF", fontFamily: NEURAL_FONT_BODY }}>
              {BRAIN_AREA_LABEL[area]}
            </span>
            <div className="relative flex-grow" style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)" }}>
              {previous && (
                <div
                  style={{ position: "absolute", left: 0, top: 0, height: 10, borderRadius: 5, width: `${(prev ?? 0) * 1}%`, background: `rgba(${rgb},0.28)` }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 2,
                  height: 6,
                  borderRadius: 3,
                  width: `${now ?? 0}%`,
                  background: color,
                  boxShadow: `0 0 8px ${color}`,
                  transition: "width .6s ease",
                }}
              />
            </div>
            <span style={{ width: 44, textAlign: "right", fontFamily: NEURAL_FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>
              {now !== null ? `${now}%` : "—"}
            </span>
            <span style={{ width: 48, textAlign: "right", fontSize: 12, fontWeight: 700, color: now === null ? NEURAL_TEXT_SECONDARY : "#34D399" }}>
              {!previous ? "" : delta === null ? "" : prev === null ? "nueva" : delta > 0 ? `+${delta}` : String(delta)}
            </span>
          </div>
        );
      })}

      <span style={{ fontSize: 13, color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY }}>{note}</span>
    </div>
  );
}

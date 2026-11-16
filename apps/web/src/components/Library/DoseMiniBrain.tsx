import { useId } from "react";
import { BRAIN_LOBE_PATH, BRAIN_STEM_PATH, INSULA_ELLIPSE } from "../NeuralCore/brainPaths";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, type BrainArea } from "../NeuralCore/brainTokens";

const LOBE_AREAS = BRAIN_AREAS.filter((a): a is Exclude<BrainArea, "esp"> => a !== "esp");

/**
 * "ESTA DOSIS ALIMENTA" (Fase 2, columna derecha) — mismas 7 formas que el
 * Cerebro Neural completo (brainPaths.ts: tallo + 5 lóbulos + ínsula), no
 * solo la región de esta dosis — antes se dibujaba nada más que el tallo
 * (las demás regiones ni se trazaban), perdiendo la silueta del cerebro
 * entero. Las regiones que no son el área de la dosis quedan tenues (solo
 * contorno + relleno muy débil, "apagadas" pero visibles); la región activa
 * se enciende con `fill-opacity` entre .18 y .85 según el avance (paso
 * actual / 5) y un brillo que crece con ella.
 */
export function DoseMiniBrain({ area, progress }: { area: BrainArea; progress: number }) {
  const uid = useId();
  const glowId = `dose-brain-glow-${uid}`;
  const clamped = Math.max(0, Math.min(1, progress));
  const activeOpacity = 0.18 + 0.67 * clamped;
  const activeColor = BRAIN_AREA_COLOR[area];

  function restingFillOpacity(a: BrainArea): number {
    return a === "eco" ? 0.06 : 0.1;
  }

  return (
    <svg viewBox="0 0 600 480" width={250} height={200} role="img" aria-label="Cerebro, región encendida según el avance de la dosis">
      <defs>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={3 + 10 * clamped} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Tallo/cerebelo: no pertenece a ninguna área, siempre en reposo neutro. */}
      <path d={BRAIN_STEM_PATH} fill="#1A1F3D" stroke="rgba(255,255,255,0.4)" strokeWidth={3} aria-hidden="true" />

      {LOBE_AREAS.map((a) => {
        const color = BRAIN_AREA_COLOR[a];
        if (a === area) {
          return (
            <path
              key={a}
              d={BRAIN_LOBE_PATH[a]}
              fill={color}
              fillOpacity={activeOpacity}
              stroke={color}
              strokeWidth={5}
              filter={`url(#${glowId})`}
            />
          );
        }
        return (
          <path
            key={a}
            d={BRAIN_LOBE_PATH[a]}
            fill={color}
            fillOpacity={restingFillOpacity(a)}
            stroke={color}
            strokeOpacity={0.4}
            strokeWidth={3}
          />
        );
      })}

      {area === "esp" ? (
        <ellipse
          cx={INSULA_ELLIPSE.cx}
          cy={INSULA_ELLIPSE.cy}
          rx={INSULA_ELLIPSE.rx}
          ry={INSULA_ELLIPSE.ry}
          fill={activeColor}
          fillOpacity={activeOpacity}
          stroke={activeColor}
          strokeWidth={5}
          strokeDasharray="5 4"
          filter={`url(#${glowId})`}
        />
      ) : (
        <ellipse
          cx={INSULA_ELLIPSE.cx}
          cy={INSULA_ELLIPSE.cy}
          rx={INSULA_ELLIPSE.rx}
          ry={INSULA_ELLIPSE.ry}
          fill={BRAIN_AREA_COLOR.esp}
          fillOpacity={restingFillOpacity("esp")}
          stroke={BRAIN_AREA_COLOR.esp}
          strokeOpacity={0.4}
          strokeWidth={3}
          strokeDasharray="5 4"
        />
      )}
    </svg>
  );
}

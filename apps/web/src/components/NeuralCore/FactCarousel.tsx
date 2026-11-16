import { useState } from "react";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, BRAIN_FACT, BRAIN_REGION_LABEL, type BrainArea } from "./brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY, NEURAL_TEXT_SOFT, scale } from "./tokens";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M12.5 4 7 10l5.5 6" : "M7.5 4 13 10l-5.5 6";
  return (
    <svg width={14} height={14} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="9" width="11" height="8" rx="1.8" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

/**
 * "Dato real" con historial (pedido explícito): un área queda "descubierta"
 * la primera vez que recibe un impulso (dato real — impulsosDeVida[area] >
 * 0, ver useBrainData.ts), no al azar. El carrusel navega entre las
 * descubiertas; las que faltan se muestran bloqueadas — más que un adorno,
 * es motivación real para diversificar hábitos entre las 6 áreas. Salta
 * sola al área recién alimentada (`focusArea`) pero la navegación manual
 * queda libre entre saltos — "ajustar estado durante el render" (patrón
 * recomendado por React para sincronizar con un prop que cambia) en vez de
 * un efecto, para no disparar una segunda pasada de render innecesaria.
 */
export function FactCarousel({ discoveredAreas, focusArea }: { discoveredAreas: BrainArea[]; focusArea: BrainArea }) {
  const [current, setCurrent] = useState<BrainArea>(focusArea);
  const [prevFocusArea, setPrevFocusArea] = useState(focusArea);
  if (focusArea !== prevFocusArea) {
    setPrevFocusArea(focusArea);
    setCurrent(focusArea);
  }

  const isDiscovered = discoveredAreas.includes(current);
  const currentIndex = BRAIN_AREAS.indexOf(current);

  function step(delta: 1 | -1) {
    const next = (currentIndex + delta + BRAIN_AREAS.length) % BRAIN_AREAS.length;
    setCurrent(BRAIN_AREAS[next]);
  }

  const color = BRAIN_AREA_COLOR[current];
  const fact = BRAIN_FACT[current];

  return (
    <div
      style={{
        padding: `${scale(22)}px ${scale(24)}px`,
        borderRadius: scale(20),
        background: `linear-gradient(160deg, rgba(124,92,255,.22), rgba(34,211,238,.08))`,
        border: `1.5px solid ${isDiscovered ? color : "rgba(167,139,250,.3)"}`,
        boxShadow: isDiscovered ? `0 0 ${scale(28)}px ${color}33` : undefined,
        transition: "border-color .3s ease-out, box-shadow .3s ease-out",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          style={{
            fontFamily: NEURAL_FONT_BODY,
            fontSize: scale(13),
            fontWeight: 700,
            letterSpacing: "1.5px",
            color: NEURAL_LAVENDER,
            textTransform: "uppercase",
          }}
        >
          Dato real{isDiscovered ? ` · ${BRAIN_REGION_LABEL[current]}` : ""}
        </span>
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: scale(13), fontWeight: 700, color: NEURAL_TEXT_SECONDARY }}>
          {discoveredAreas.length}/{BRAIN_AREAS.length} descubiertos
        </span>
      </div>

      {isDiscovered ? (
        <>
          <p className="m-0" style={{ marginTop: scale(12), fontFamily: NEURAL_FONT_BODY, fontSize: scale(16), lineHeight: 1.55, color: NEURAL_TEXT_SOFT }}>
            {fact.text}
          </p>
          <p className="m-0" style={{ marginTop: scale(8), fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), color: NEURAL_TEXT_SECONDARY }}>
            Fuente: {fact.source}
          </p>
        </>
      ) : (
        <div className="flex items-center gap-3" style={{ marginTop: scale(14) }}>
          <span style={{ color: NEURAL_TEXT_SECONDARY }}>
            <LockIcon />
          </span>
          <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(14), color: NEURAL_TEXT_SECONDARY }}>
            Completa un hábito de <strong style={{ color: NEURAL_TEXT_SOFT }}>{BRAIN_REGION_LABEL[current]}</strong> para desbloquear este dato.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between" style={{ marginTop: scale(16) }}>
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Dato anterior"
          className="flex items-center justify-center rounded-full"
          style={{ width: scale(28), height: scale(28), color: NEURAL_TEXT_SECONDARY, background: "rgba(255,255,255,.06)" }}
        >
          <ArrowIcon direction="left" />
        </button>

        <div className="flex items-center" style={{ gap: scale(8) }}>
          {BRAIN_AREAS.map((a) => {
            const discovered = discoveredAreas.includes(a);
            const isCurrent = a === current;
            return (
              <button
                key={a}
                type="button"
                onClick={() => setCurrent(a)}
                aria-label={discovered ? `Ver dato de ${BRAIN_REGION_LABEL[a]}` : `${BRAIN_REGION_LABEL[a]} todavía bloqueado`}
                style={{
                  width: scale(isCurrent ? 20 : 8),
                  height: scale(8),
                  borderRadius: scale(4),
                  background: discovered ? BRAIN_AREA_COLOR[a] : "rgba(255,255,255,.18)",
                  opacity: isCurrent ? 1 : 0.55,
                  transition: "width .25s ease-out, opacity .25s ease-out",
                }}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Siguiente dato"
          className="flex items-center justify-center rounded-full"
          style={{ width: scale(28), height: scale(28), color: NEURAL_TEXT_SECONDARY, background: "rgba(255,255,255,.06)" }}
        >
          <ArrowIcon direction="right" />
        </button>
      </div>
    </div>
  );
}

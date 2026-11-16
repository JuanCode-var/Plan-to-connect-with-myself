import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ConstellationBrain } from "../components/NeuralCore/ConstellationBrain";
import { LifetimeStatsColumn } from "../components/NeuralCore/LifetimeStatsColumn";
import { MyelinationColumn } from "../components/NeuralCore/MyelinationColumn";
import { PruningCard } from "../components/NeuralCore/PruningCard";
import { ThirtyDayStrip } from "../components/NeuralCore/ThirtyDayStrip";
import {
  NEURAL_CARD_BG,
  NEURAL_VIOLET_CARD_BORDER,
  NEURAL_CARD_SHADOW,
  NEURAL_FONT_BODY,
  NEURAL_FONT_DISPLAY,
  NEURAL_TEXT_SECONDARY,
  scale,
} from "../components/NeuralCore/tokens";
import { useNeuralMapData } from "../components/NeuralCore/useNeuralMapData";

/**
 * "Mi mapa neuronal" (paso 3) — a la que lleva "Ver mi mapa neuronal →" del
 * Cerebro Interactivo (/tracker). Reutiliza las formas/colores de
 * brainPaths.ts/brainTokens.ts (nada duplicado) y lee lo que el motor de
 * impulsos del Cerebro Interactivo ya persiste (useBrainImpulseEngine.ts +
 * brainHistory.ts) — esta pantalla no corre impulsos, solo los muestra.
 */
export function NeuralMap() {
  const {
    impulsosDeVida,
    totalImpulsosDeVida,
    areaStats,
    brightnessByArea,
    attenuating,
    justReactivatedArea,
    days,
    nucleoPlenoDays,
    activeDays,
    isLoading,
    isError,
  } = useNeuralMapData();

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ color: "var(--text)" }}>
      <div className="mx-auto max-w-[1360px]">
        <section
          className="panel-card-in"
          style={{
            background: NEURAL_CARD_BG,
            border: `1px solid ${NEURAL_VIOLET_CARD_BORDER}`,
            borderRadius: scale(24),
            boxShadow: NEURAL_CARD_SHADOW,
            padding: `${scale(30)}px ${scale(40)}px`,
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: scale(34), fontWeight: 700, color: "#ffffff", margin: 0 }}>
                Mi mapa neuronal
              </h1>
              <p className="m-0" style={{ marginTop: scale(6), fontFamily: NEURAL_FONT_BODY, fontSize: scale(15), color: NEURAL_TEXT_SECONDARY }}>
                Cada punto es una conexión que construiste. Lo que repites, se fortalece.
              </p>
              {isLoading && (
                <p className="m-0" style={{ marginTop: scale(6), fontFamily: NEURAL_FONT_BODY, fontSize: scale(13), color: NEURAL_TEXT_SECONDARY }}>
                  Cargando tu progreso…
                </p>
              )}
              {isError && (
                <p className="m-0" style={{ marginTop: scale(6), fontFamily: NEURAL_FONT_BODY, fontSize: scale(13), color: "#FB5C8C" }}>
                  No se pudo cargar tu progreso del servidor — mostrando la última versión guardada en este dispositivo.
                </p>
              )}
            </div>
            <Link
              to="/tracker"
              style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(14), fontWeight: 600, color: "#22D3EE", whiteSpace: "nowrap" }}
            >
              ← Volver a hoy
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row" style={{ marginTop: scale(40), gap: scale(20) }}>
            <div
              className="flex w-full flex-col lg:order-1 lg:w-[var(--map-side-col-w)] lg:shrink-0"
              style={{ gap: scale(20), ["--map-side-col-w" as string]: `${scale(320)}px` } as CSSProperties}
            >
              <LifetimeStatsColumn totalImpulsosDeVida={totalImpulsosDeVida} nucleoPlenoDays={nucleoPlenoDays} activeDays={activeDays} />
              <PruningCard attenuating={attenuating} justReactivatedArea={justReactivatedArea} />
            </div>

            <div
              className="relative order-first flex justify-center lg:order-2 lg:w-[var(--map-center-col-w)] lg:shrink-0"
              style={{ ["--map-center-col-w" as string]: `${scale(600)}px` } as CSSProperties}
            >
              <div
                className="pointer-events-none absolute"
                aria-hidden="true"
                style={{
                  width: scale(540),
                  height: scale(540),
                  borderRadius: "50%",
                  left: "50%",
                  top: "50%",
                  marginLeft: -scale(540) / 2,
                  marginTop: -scale(540) / 2,
                  background: "radial-gradient(circle, rgba(124,92,255,.18), transparent 70%)",
                  zIndex: -1,
                }}
              />
              <ConstellationBrain impulsosDeVida={impulsosDeVida} brightness={brightnessByArea} totalImpulsos={totalImpulsosDeVida} />
            </div>

            <div className="w-full lg:order-3 lg:w-[var(--map-side-col-w)] lg:shrink-0" style={{ ["--map-side-col-w" as string]: `${scale(320)}px` } as CSSProperties}>
              <MyelinationColumn areaStats={areaStats} />
            </div>
          </div>

          <div style={{ marginTop: scale(32) }}>
            <ThirtyDayStrip days={days} />
          </div>
        </section>
      </div>
    </div>
  );
}

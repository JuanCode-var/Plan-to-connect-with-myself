import { useEffect, useRef } from "react";
import type { CycleLogs } from "../../api/tracking";
import { AreaRow } from "./AreaRow";
import { BrainImpulseLayer } from "./BrainImpulseLayer";
import { BrainSVG } from "./BrainSVG";
import { BrainSynapses } from "./BrainSynapses";
import {
  BRAIN_HEIGHT,
  BRAIN_OFFSET_Y,
  BRAIN_WIDTH,
  CARD_HEIGHT,
  CARD_PADDING,
  CARD_WIDTH,
  GAP_HEADER_BRAIN,
  GAP_ROWS_FACT,
  HEADER_HEIGHT,
  ROW_GAP,
  ROW_HEIGHT,
  ROW_LABEL_HEIGHT,
  ROW_LEFT_X,
  rowCenterY,
} from "./brainLayout";
import { BRAIN_AREAS, CORE_STATES } from "./brainTokens";
import { CoreAura } from "./CoreAura";
import { CoreStateBar } from "./CoreStateBar";
import { FactCarousel } from "./FactCarousel";
import { LastEventCard } from "./LastEventCard";
import { NEURAL_CARD_BG, NEURAL_VIOLET_CARD_BORDER, NEURAL_CARD_SHADOW, NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY, scale } from "./tokens";
import { useBrainData } from "./useBrainData";

const ROWS_BLOCK_WIDTH = CARD_WIDTH - 2 * CARD_PADDING - ROW_LEFT_X;
const ROWS_END_Y = ROW_LABEL_HEIGHT + BRAIN_AREAS.length * (ROW_HEIGHT + ROW_GAP);

/**
 * "Cerebro Interactivo" — paso 2: evoluciona el Núcleo Neural (anillo + 3
 * tarjetas de prioridad) hacia un cerebro de 6 regiones (anillo → cerebro,
 * tarjetas de prioridad → 6 filas de área). El sistema de impulsos
 * (3/2/1 por prioridad) se mantiene igual; lo nuevo es que el ÁREA del
 * hábito (`habit.category`, ver useBrainData.ts) decide a qué región
 * viajan. No reemplaza NeuralCoreWidget.tsx (paso 1) en disco — ver nota de
 * entrega — solo en Tracker.tsx.
 *
 * Layout absoluto (no flujo flex) a propósito: las curvas de sinapsis
 * (BrainSynapses/BrainImpulseLayer) necesitan coordenadas exactas hacia
 * cada fila de área y cada centroide del cerebro — ver brainLayout.ts,
 * fuente única de esta geometría, para que la curva SIEMPRE llegue al
 * punto correcto sin medir el DOM en tiempo real.
 */
export function CerebroWidget({ data }: { data: CycleLogs }) {
  const {
    displayedAreaPoints,
    impulsosDeVida,
    impulses,
    flashes,
    synapseActive,
    lastEvent,
    lastFedArea,
    discoveredAreas,
    totalImpulsosHoy,
    maximoHoy,
    doneHabitsCount,
    percent,
    coreState,
    triggerTick,
  } = useBrainData(data);

  const flashingAreas = new Set(flashes.map((f) => f.area));
  const stateMeta = CORE_STATES.find((s) => s.key === coreState.key)!;

  // "Que cada vez que se chequea un hábito me suba al lóbulo frontal para
  // ver cómo llegan los impulsos" (pedido explícito): el widget entero se
  // trae a la vista apenas arranca una secuencia de marcado nueva — no en
  // el montaje inicial (triggerTick arranca en 0 y solo sube con un
  // disparo real).
  const sectionRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (triggerTick === 0) return;
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [triggerTick]);

  return (
    <section
      ref={sectionRef}
      aria-label="Cerebro Interactivo — progreso de hoy"
      className="panel-card-in relative"
      style={{
        background: NEURAL_CARD_BG,
        border: `1px solid ${NEURAL_VIOLET_CARD_BORDER}`,
        borderRadius: scale(24),
        padding: scale(CARD_PADDING),
        boxShadow: NEURAL_CARD_SHADOW,
      }}
    >
      {/* Versión desktop (≥1024px): layout absoluto siguiendo brainLayout.ts. */}
      <div
        className="relative mx-auto hidden lg:block"
        style={{ width: scale(CARD_WIDTH - 2 * CARD_PADDING), height: scale(CARD_HEIGHT - 2 * CARD_PADDING) }}
      >
        <BrainSynapses active={synapseActive} />

        {/* Encabezado: impulsos/máximo + badge de estado + subtítulo + barra. */}
        <div className="absolute" style={{ left: 0, top: 0, width: scale(BRAIN_WIDTH), height: scale(HEADER_HEIGHT) }}>
          <div className="flex items-baseline gap-3">
            <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: scale(52), fontWeight: 700, color: "#ffffff" }}>
              {totalImpulsosHoy}/{maximoHoy}
            </span>
            <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(16), color: NEURAL_TEXT_SECONDARY }}>
              impulsos hoy
            </span>
            <span
              style={{
                fontFamily: NEURAL_FONT_BODY,
                fontSize: scale(12),
                fontWeight: 600,
                color: stateMeta.color,
                background: `${stateMeta.color}22`,
                border: `1px solid ${stateMeta.color}55`,
                borderRadius: scale(999),
                padding: `${scale(3)}px ${scale(10)}px`,
              }}
            >
              {stateMeta.label}
            </span>
          </div>
          <p className="m-0" style={{ marginTop: scale(6), fontFamily: NEURAL_FONT_BODY, fontSize: scale(14), color: NEURAL_TEXT_SECONDARY }}>
            {doneHabitsCount} hábito{doneHabitsCount === 1 ? "" : "s"} completado{doneHabitsCount === 1 ? "" : "s"} · {stateMeta.description}
          </p>
          <CoreStateBar percent={percent} maximoHoy={maximoHoy} />
        </div>

        {/* Cerebro + aura. */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: 0, top: scale(BRAIN_OFFSET_Y), width: scale(BRAIN_WIDTH), height: scale(BRAIN_HEIGHT) }}
        >
          <CoreAura state={coreState.key} />
          <BrainSVG
            displayedAreaPoints={displayedAreaPoints}
            impulsosDeVida={impulsosDeVida}
            flashingAreas={flashingAreas}
            totalImpulsosHoy={totalImpulsosHoy}
            coreStateLabel={stateMeta.label}
          />
        </div>

        {/* Último evento + nota del mapa simplificado. */}
        <div
          className="absolute flex flex-col"
          style={{
            left: 0,
            top: scale(BRAIN_OFFSET_Y + BRAIN_HEIGHT + GAP_HEADER_BRAIN),
            width: scale(BRAIN_WIDTH),
            gap: scale(10),
          }}
        >
          <LastEventCard message={lastEvent.message} />
          <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(11), color: NEURAL_TEXT_SECONDARY, lineHeight: 1.4 }}>
            Mapa simplificado: el cerebro trabaja en redes; cada área se asocia con la región donde su efecto está mejor estudiado.
          </p>
        </div>

        {/* Etiqueta de la columna de filas. */}
        <div
          className="absolute flex items-center justify-between"
          style={{ left: scale(ROW_LEFT_X), top: 0, width: scale(ROWS_BLOCK_WIDTH), height: scale(ROW_LABEL_HEIGHT) }}
        >
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), fontWeight: 600, letterSpacing: "1px", color: NEURAL_LAVENDER }}>
            Área → región que se fortalece · etapa de mielina
          </span>
        </div>

        {/* 6 filas de área. */}
        {BRAIN_AREAS.map((area, index) => (
          <div
            key={area}
            className="absolute"
            style={{
              left: scale(ROW_LEFT_X),
              top: scale(rowCenterY(index) - ROW_HEIGHT / 2),
              width: scale(ROWS_BLOCK_WIDTH),
            }}
          >
            <AreaRow
              area={area}
              impulsosHoy={displayedAreaPoints[area]}
              impulsosDeVida={impulsosDeVida[area]}
              active={synapseActive[area]}
            />
          </div>
        ))}

        {/* Dato real — separada de la última fila de área (antes quedaban pegadas). */}
        <div
          className="absolute"
          style={{ left: scale(ROW_LEFT_X), top: scale(ROWS_END_Y + GAP_ROWS_FACT), width: scale(ROWS_BLOCK_WIDTH) }}
        >
          <FactCarousel discoveredAreas={discoveredAreas} focusArea={lastFedArea} />
        </div>

        <BrainImpulseLayer impulses={impulses} />
      </div>

      {/* Pantallas angostas: apilado simple, sin sinapsis (sección 3: "en
          móvil ... las filas debajo y sin sinapsis"). El cerebro sigue
          reflejando `displayedAreaPoints` igual. */}
      <div className="flex flex-col lg:hidden" style={{ gap: scale(16) }}>
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: scale(40), fontWeight: 700, color: "#ffffff" }}>
              {totalImpulsosHoy}/{maximoHoy}
            </span>
            <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(14), color: NEURAL_TEXT_SECONDARY }}>
              impulsos hoy
            </span>
            <span
              style={{
                fontFamily: NEURAL_FONT_BODY,
                fontSize: scale(11),
                fontWeight: 600,
                color: stateMeta.color,
                background: `${stateMeta.color}22`,
                border: `1px solid ${stateMeta.color}55`,
                borderRadius: scale(999),
                padding: `${scale(3)}px ${scale(10)}px`,
              }}
            >
              {stateMeta.label}
            </span>
          </div>
          <p className="m-0" style={{ marginTop: scale(4), fontFamily: NEURAL_FONT_BODY, fontSize: scale(13), color: NEURAL_TEXT_SECONDARY }}>
            {doneHabitsCount} hábito{doneHabitsCount === 1 ? "" : "s"} completado{doneHabitsCount === 1 ? "" : "s"} · {stateMeta.description}
          </p>
          <CoreStateBar percent={percent} maximoHoy={maximoHoy} />
        </div>

        <div className="relative mx-auto flex items-center justify-center" style={{ width: scale(BRAIN_WIDTH), height: scale(BRAIN_HEIGHT) }}>
          <CoreAura state={coreState.key} />
          <BrainSVG
            displayedAreaPoints={displayedAreaPoints}
            impulsosDeVida={impulsosDeVida}
            flashingAreas={flashingAreas}
            totalImpulsosHoy={totalImpulsosHoy}
            coreStateLabel={stateMeta.label}
          />
        </div>

        <div className="flex flex-col" style={{ gap: scale(10) }}>
          {BRAIN_AREAS.map((area) => (
            <AreaRow
              key={area}
              area={area}
              impulsosHoy={displayedAreaPoints[area]}
              impulsosDeVida={impulsosDeVida[area]}
              active={synapseActive[area]}
            />
          ))}
        </div>

        <LastEventCard message={lastEvent.message} />
        <FactCarousel discoveredAreas={discoveredAreas} focusArea={lastFedArea} />
      </div>
    </section>
  );
}

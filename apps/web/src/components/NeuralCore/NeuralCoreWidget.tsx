import type { CSSProperties } from "react";
import type { CycleLogs } from "../../api/tracking";
import { ImpulseLayer } from "./ImpulseLayer";
import { InsightCard } from "./InsightCard";
import { NeuralOrb } from "./NeuralOrb";
import { NeuralSynapses } from "./NeuralSynapses";
import { PriorityCard } from "./PriorityCard";
import { WeekActivityCard } from "./WeekActivityCard";
import {
  NEURAL_CARD_BG,
  NEURAL_VIOLET_CARD_BORDER,
  NEURAL_CARD_SHADOW,
  NEURAL_FONT_BODY,
  NEURAL_FONT_DISPLAY,
  NEURAL_TEXT_SECONDARY,
  scale,
} from "./tokens";
import { useNeuralCoreData } from "./useNeuralCoreData";

/**
 * "Núcleo Neural" — reemplaza a TodayProgress.tsx (anillo + 3 barras +
 * "Vas bien — quedan X") como el widget de progreso diario de /tracker. No
 * repinta el fondo de PÁGINA del mockup de referencia (#070B1F + resplandores):
 * ya vive dentro de Tracker.tsx, que comparte el fondo neuronal animado de
 * toda la app — repetirlo acá duplicaría/competiría con ese fondo. Es la
 * tarjeta (sección 1 "Tarjeta (vidrio)" del pedido) lo que se implementa,
 * reescalada con `NEURAL_SCALE` (ver tokens.ts) — las medidas 1:1 del pedido
 * se sentían "exageradas" integradas como una tarjeta más de /tracker
 * (pedido explícito del usuario, con captura).
 */
export function NeuralCoreWidget({ data, checklistAnchor }: { data: CycleLogs; checklistAnchor: string }) {
  const {
    orderedHabits,
    isLit,
    impulses,
    flashes,
    synapseActive,
    totalToday,
    doneToday,
    priorityStats,
    altaPendingCount,
    weekBars,
  } = useNeuralCoreData(data);

  return (
    <section
      aria-label="Núcleo Neural — progreso de hoy"
      className="panel-card-in flex flex-col lg:flex-row lg:items-stretch"
      style={{
        background: NEURAL_CARD_BG,
        border: `1px solid ${NEURAL_VIOLET_CARD_BORDER}`,
        borderRadius: scale(24),
        padding: scale(36),
        boxShadow: NEURAL_CARD_SHADOW,
        gap: scale(32),
      }}
    >
      {/* Orbe + sinapsis + impulsos — versión desktop (≥1024px, "lg"): las
          3 columnas descritas en la sección 2 del pedido, con la capa de
          impulsos superpuesta sobre ambas. */}
      <div
        className="relative mx-auto hidden shrink-0 lg:mx-0 lg:block"
        style={{ width: scale(380), height: scale(398) }}
      >
        <div className="flex h-full">
          <div className="flex shrink-0 items-center justify-center" style={{ width: scale(290), height: scale(398) }}>
            <NeuralOrb habits={orderedHabits} isLit={isLit} doneCount={doneToday} total={totalToday} />
          </div>
          <div className="flex shrink-0 items-center" style={{ width: scale(90), height: scale(398) }}>
            <NeuralSynapses active={synapseActive} />
          </div>
        </div>
        <ImpulseLayer impulses={impulses} flashes={flashes} />
      </div>

      {/* Pantallas angostas: solo el orbe, centrado arriba, sin sinapsis ni
          capa de impulsos (sección 2: "se ocultan las sinapsis" — el
          anillo sigue reflejando `lit` igual). */}
      <div className="mx-auto flex justify-center lg:hidden">
        <NeuralOrb habits={orderedHabits} isLit={isLit} doneCount={doneToday} total={totalToday} />
      </div>

      <div
        className="flex w-full flex-col lg:w-[var(--neural-priority-col-w)] lg:shrink-0"
        style={{ gap: scale(14), ["--neural-priority-col-w" as string]: `${scale(470)}px` } as CSSProperties}
      >
        <div className="flex items-baseline gap-3" style={{ height: scale(72) }}>
          <span
            style={{
              fontFamily: NEURAL_FONT_DISPLAY,
              fontSize: scale(56),
              fontWeight: 700,
              letterSpacing: "-1px",
              color: "#ffffff",
            }}
          >
            {doneToday}/{totalToday}
          </span>
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(18), color: NEURAL_TEXT_SECONDARY }}>
            hábitos completados
          </span>
        </div>
        {priorityStats.map((s) => (
          <PriorityCard key={s.level} level={s.level} done={s.done} total={s.total} />
        ))}
      </div>

      <div className="flex w-full flex-col lg:w-auto lg:flex-1" style={{ gap: scale(16) }}>
        <InsightCard
          totalToday={totalToday}
          doneToday={doneToday}
          altaPendingCount={altaPendingCount}
          onViewPending={checklistAnchor}
        />
        <WeekActivityCard bars={weekBars} />
      </div>
    </section>
  );
}

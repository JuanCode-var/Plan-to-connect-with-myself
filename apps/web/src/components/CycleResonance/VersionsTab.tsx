import { useMemo, useState } from "react";
import { useNextCycleFocus, useSetNextCycleFocus } from "../../api/profile";
import { AREA_OF_CATEGORY, BRAIN_AREAS, BRAIN_AREA_LABEL, CATEGORY_OF_AREA, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { VersionCard } from "./VersionCard";
import { VersionsComparisonPanel } from "./VersionsComparisonPanel";
import { VersionsDesignPanel } from "./VersionsDesignPanel";
import { resonanceStateFor } from "./resonanceTokens";
import type { ResonanceArea } from "./useCycleResonance";
import type { useCycleResonance } from "./useCycleResonance";
import { FUTURE_IDENTITY_CLAUSE } from "./versionesTokens";
import { futureAreaPercents, identityGrowthArea, overallDelta, projectedClose } from "./versionesLogic";

type Resonance = ReturnType<typeof useCycleResonance>;

const MAX_PAST_CARDS = 3;

function Arrow({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex flex-shrink-0 flex-col items-center gap-0.5" style={{ width: 40, paddingTop: 165 }}>
      <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 13, fontWeight: 700, color, minHeight: 18 }}>{label}</span>
      <svg aria-hidden="true" width="32" height="16" viewBox="0 0 32 16">
        <path d="M2 8 L28 8 M21 2 L28 8 L21 14" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/**
 * "Versiones de ti" (reemplaza "Comparación entre ciclos") — puerto de
 * Versiones.dc.html SIN su modo "Con historial de ejemplo" (pedido
 * explícito: en producción no existe, solo datos reales). Hasta 3 ciclos
 * pasados reales (tarjeta fantasma si un ciclo existe pero no tiene un solo
 * HabitLog), el ciclo actual con cierre proyectado, y una tarjeta "EN
 * DISEÑO" que de verdad guarda la intención elegida (useSetNextCycleFocus)
 * para mostrarla al empezar el siguiente ciclo (ver el aviso en
 * Dashboard.tsx).
 */
export function VersionsTab({ resonance }: { resonance: Resonance }) {
  const nextFocusQuery = useNextCycleFocus();
  const setNextFocus = useSetNextCycleFocus();
  const [focusAreaOverride, setFocusAreaOverride] = useState<BrainArea | null>(null);

  const defaultFocusArea = useMemo<BrainArea>(() => {
    const withHabits = resonance.byArea.filter((a): a is ResonanceArea & { percent: number } => a.percent !== null);
    if (withHabits.length === 0) return BRAIN_AREAS[0];
    return withHabits.reduce((min, a) => (a.percent < min.percent ? a : min)).area;
  }, [resonance.byArea]);

  // Si el usuario ya tocó un botón esta sesión (`focusAreaOverride`), eso
  // manda. Si no, pero ya había una intención guardada PARA ESTE MISMO ciclo
  // (recargó la página, o volvió más tarde), se respeta en vez de pisarla
  // con el default. Derivado en el render, sin useEffect: la fuente de
  // verdad (la query) ya dispara su propio re-render cuando llega.
  const savedFocusArea =
    nextFocusQuery.data?.area && nextFocusQuery.data.setInCycleId === resonance.cycle?.id ? AREA_OF_CATEGORY[nextFocusQuery.data.area] : null;
  const focusArea = focusAreaOverride ?? savedFocusArea ?? defaultFocusArea;

  function handleFocusArea(area: BrainArea) {
    setFocusAreaOverride(area);
    if (resonance.cycle) {
      setNextFocus.mutate({ area: CATEGORY_OF_AREA[area], cycleId: resonance.cycle.id });
    }
  }

  const pastCards = useMemo(
    () => (resonance.cycleNumber ? resonance.pastCycles.filter((c) => c.cycleNumber < resonance.cycleNumber!).slice(-MAX_PAST_CARDS) : []),
    [resonance.pastCycles, resonance.cycleNumber],
  );

  const last14Avg = useMemo(() => {
    const recent = resonance.byDay.slice(-14);
    if (recent.length === 0) return 0;
    return (recent.reduce((sum, d) => sum + d.completionRate, 0) / recent.length) * 100;
  }, [resonance.byDay]);

  const projectedClosePercent =
    resonance.currentDay > 0 && resonance.currentDay < resonance.totalDays
      ? projectedClose(resonance.percentGeneral, resonance.currentDay, last14Avg, resonance.totalDays)
      : null;

  const currentIdentityArea = identityGrowthArea(resonance.byArea, pastCards.length && pastCards[pastCards.length - 1].hasData ? pastCards[pastCards.length - 1].byArea : null);

  const nextCycleNumber = (resonance.cycleNumber ?? 0) + 1;
  const daysUntilNextStart = Math.max(0, resonance.totalDays - resonance.currentDay);

  // Tarjetas + deltas de la fila (sección 1/3 del pedido): cada entrada ya
  // trae su propio % general (null para fantasma/futuro) para que la flecha
  // entre ella y la siguiente se calcule sola, sin repetir la lógica por tipo.
  type Card = { key: string; percentGeneral: number | null; node: React.ReactNode };

  const cards: Card[] = pastCards.map((c, i) => {
    const previousAreas = i > 0 ? (pastCards[i - 1].hasData ? pastCards[i - 1].byArea : null) : null;
    if (!c.hasData) {
      return { key: c.id, percentGeneral: null, node: <VersionCard variant="ghost" cycleNumber={c.cycleNumber} /> };
    }
    const percent = Math.round(c.completionRate * 100);
    return {
      key: c.id,
      percentGeneral: percent,
      node: (
        <VersionCard
          variant="real"
          cycleNumber={c.cycleNumber}
          totalDays={c.totalDays}
          stateLabel={resonanceStateFor(percent).label}
          percentByArea={areaRecord(c.byArea)}
          percent={percent}
          identityArea={identityGrowthArea(c.byArea, previousAreas)}
        />
      ),
    };
  });

  cards.push({
    key: "current",
    percentGeneral: resonance.percentGeneral,
    node: (
      <VersionCard
        variant="current"
        cycleNumber={resonance.cycleNumber ?? nextCycleNumber - 1}
        currentDay={resonance.currentDay}
        totalDays={resonance.totalDays}
        stateLabel={resonanceStateFor(resonance.percentGeneral).label}
        percentByArea={areaRecord(resonance.byArea)}
        percent={resonance.percentGeneral}
        identityArea={currentIdentityArea}
        projectedClosePercent={projectedClosePercent}
      />
    ),
  });

  cards.push({
    key: "future",
    percentGeneral: null,
    node: (
      <VersionCard
        variant="future"
        cycleNumber={nextCycleNumber}
        percentByArea={futureAreaPercents(resonance.byArea, focusArea)}
        focusArea={focusArea}
        focusAreaLabel={BRAIN_AREA_LABEL[focusArea]}
        futureIdentitySentence={`Próxima identidad: "Ya eres alguien que ${FUTURE_IDENTITY_CLAUSE[focusArea]}."`}
        daysUntilStart={daysUntilNextStart}
      />
    ),
  });

  const lastRealCard = pastCards.length ? pastCards[pastCards.length - 1] : null;
  const previousForComparison = lastRealCard && lastRealCard.hasData ? lastRealCard.byArea : null;

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6">
      <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, lineHeight: 1.6, color: NEURAL_TEXT_SECONDARY, maxWidth: 720 }}>
        Cada ciclo es una versión de tu cerebro. Aquí ves en quién te estás convirtiendo.
      </p>

      <div className="overflow-x-auto pb-1">
        <div className="flex items-start" style={{ width: "max-content" }}>
          {cards.map((card, i) => (
            <div key={card.key} className="flex items-start">
              {card.node}
              {i < cards.length - 1 &&
                (i === cards.length - 2 ? (
                  <Arrow label="?" color="#C4B5FD" />
                ) : (
                  <Arrow
                    label={formatDelta(overallDelta(cards[i + 1].percentGeneral, card.percentGeneral))}
                    color={overallDelta(cards[i + 1].percentGeneral, card.percentGeneral) !== null ? "#34D399" : "rgba(255,255,255,0.25)"}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="w-full min-w-0 lg:basis-[820px] lg:shrink lg:grow-0">
          <VersionsComparisonPanel
            current={resonance.byArea}
            previous={previousForComparison}
            currentLabel={`V${resonance.cycleNumber ?? "—"}`}
            previousLabel={lastRealCard ? `V${lastRealCard.cycleNumber}` : null}
            daysUntilClose={daysUntilNextStart}
          />
        </div>
        <div className="w-full min-w-0 lg:basis-[520px] lg:shrink lg:grow-0">
          <VersionsDesignPanel current={resonance.byArea} focusArea={focusArea} onFocusArea={handleFocusArea} nextCycleNumber={nextCycleNumber} />
        </div>
      </div>
    </div>
  );
}

function areaRecord(areas: ResonanceArea[]): Record<BrainArea, number | null> {
  const result = {} as Record<BrainArea, number | null>;
  for (const a of areas) result[a.area] = a.percent;
  return result;
}

function formatDelta(delta: number | null): string {
  if (delta === null) return "";
  return delta > 0 ? `+${delta}` : String(delta);
}

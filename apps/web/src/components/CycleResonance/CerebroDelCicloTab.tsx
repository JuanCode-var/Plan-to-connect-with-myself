import { useMemo, useState } from "react";
import { useWordCommitments } from "../../api/word";
import { useAuth } from "../../lib/useAuth";
import { matchesExistingCounter } from "../../lib/commitmentArea";
import { todayISO } from "../../lib/date";
import { firstName } from "../../lib/greeting";
import { motivationalHeadline } from "../../lib/motivationalHeadline";
import { calculateWordProgress, isCommitmentActive } from "../../lib/wordProgress";
import { AREA_OF_CATEGORY } from "../NeuralCore/brainTokens";
import { NEURAL_CARD_BG, NEURAL_VIOLET_CARD_BORDER, NEURAL_CARD_SHADOW, NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { AreaBalanceHexagon } from "./AreaBalanceHexagon";
import { ConsolidadoCard, type TopHabit } from "./ConsolidadoCard";
import { blendCommitmentsIntoAreas } from "./commitmentAreaBlend";
import { CommitmentRewireCard } from "./CommitmentRewireCard";
import { CycleLoadRing } from "./CycleLoadRing";
import { HolographicBrain } from "./HolographicBrain";
import { NextTriggerCard } from "./NextTriggerCard";
import { RewireCard } from "./RewireCard";
import { ScanReadingCard } from "./ScanReadingCard";
import { StreakChipRow } from "./StreakChipRow";
import { habitStrengthFor } from "./resonanceTokens";
import type { useCycleResonance } from "./useCycleResonance";

// Colores propios de estos 2 contadores puntuales (no mapean a ninguna de
// las 6 áreas de BRAIN_AREA_COLOR — "sin alcohol"/"sin apuestas" no son un
// área de vida, son métricas de abstinencia aparte) — mismos 2 colores que
// ya elegía el mockup para distinguir visualmente una tarjeta de la otra.
const ALCOHOL_COLOR = { hex: "#22D3EE", rgb: "34,211,238" };
const BETTING_COLOR = { hex: "#A78BFA", rgb: "167,139,250" };

// Mismos nombres EXACTOS que SPECIFIC_COUNTERS en
// apps/api/src/routes/dashboard.ts — duplicado a propósito (mismo criterio
// que el backend ya documenta: frágil a renombres, pero es el único
// vínculo real entre "el contador noAlcoholDays" y "qué hábito lo generó"
// que existe hoy). Solo se usa para la celebración de hito — si el nombre
// cambia, la celebración deja de dispararse, nunca rompe el conteo en sí
// (ese siempre viene del backend).
const ALCOHOL_HABIT_NAME = "Cero alcohol";
const BETTING_HABIT_NAME = "Cero apuestas";
const MILESTONE_DAYS = new Set([7, 21, 30, 66, 90]);

function NumberStat({ swatch, value, label, color }: { swatch: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      {swatch}
      <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 24, fontWeight: 700, color }}>{value}</span>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: "#E6E9F5" }}>{label}</span>
    </div>
  );
}

type Resonance = ReturnType<typeof useCycleResonance>;

/**
 * "Cerebro del ciclo" — vista por defecto de Resonancia del ciclo. Puerto
 * de Resonancia.dc.html: su geometría/animaciones se portan tal cual (ver
 * brainGeometry.ts, CycleLoadRing.tsx), pero TODOS los datos fijos del
 * mockup (80%/87%/90%/59%/53%/0% por área, "478 impulsos", "Juanma", etc.)
 * se reemplazan acá por lo que entrega useCycleResonance (paso 0).
 */
export function CerebroDelCicloTab({ resonance }: { resonance: Resonance }) {
  const { user } = useAuth();
  const [scanGeneration, setScanGeneration] = useState(0);
  const { data: commitments } = useWordCommitments();

  // Un compromiso "activo" (no vencido) cuenta para el % de su área —
  // pedido explícito: "Económica no debe aparecer vacía si hay un
  // compromiso de ahorro activo" — ver commitmentAreaBlend.ts. Uno vencido
  // queda siempre clavado en 100% de plazo transcurrido (ver
  // calculateWordProgress), así que inflaría el área sin decir nada real.
  const activeCommitments = useMemo(() => (commitments ?? []).filter(isCommitmentActive), [commitments]);

  const byAreaWithCommitments = useMemo(() => {
    const contributions = activeCommitments
      .filter((c) => c.area !== null)
      .map((c) => ({ area: AREA_OF_CATEGORY[c.area!], percent: calculateWordProgress(c.startDate, c.targetDate).percent }));
    return blendCommitmentsIntoAreas(resonance.byArea, contributions);
  }, [resonance.byArea, activeCommitments]);

  // Un compromiso que describe lo mismo que un contador de abstinencia ya
  // existente (alcohol/apuestas) reemplaza a su RewireCard — nunca los dos a
  // la vez para la misma cosa (pedido explícito).
  const matchedCounters = useMemo(() => {
    const matched = new Set<"alcohol" | "apuestas">();
    for (const c of activeCommitments) {
      const m = matchesExistingCounter(c.title, c.text);
      if (m) matched.add(m);
    }
    return matched;
  }, [activeCommitments]);

  const topHabit: TopHabit | null = useMemo(() => {
    if (resonance.byHabit.length === 0) return null;
    const doneCountOf = (habitId: string) => resonance.habitLogs.filter((l) => l.habitId === habitId && l.status === "DONE").length;
    let best = resonance.byHabit[0];
    let bestDone = doneCountOf(best.id);
    for (const h of resonance.byHabit.slice(1)) {
      const done = doneCountOf(h.id);
      if (h.percent > best.percent || (h.percent === best.percent && done > bestDone)) {
        best = h;
        bestDone = done;
      }
    }
    if (best.percent === 0) return null;
    return { name: best.name, area: best.area, percent: best.percent, strength: habitStrengthFor(best.percent) };
  }, [resonance.byHabit, resonance.habitLogs]);

  const prevCyclePercent = useMemo(() => {
    if (resonance.cycleNumber === null) return null;
    const prev = resonance.pastCycles.find((c) => c.cycleNumber === resonance.cycleNumber! - 1);
    return prev ? Math.round(prev.completionRate * 100) : null;
  }, [resonance.cycleNumber, resonance.pastCycles]);

  function reachedMilestoneToday(habitName: string, counterValue: number): boolean {
    if (!MILESTONE_DAYS.has(counterValue)) return false;
    const habit = resonance.byHabit.find((h) => h.name === habitName);
    if (!habit) return false;
    return resonance.statusOf(habit.id, todayISO()) === "DONE";
  }

  const counters = resonance.counters;

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        {/* Tarjeta A — ancho IDEAL 900px (cerebro 520 + hexágono 300 +
            separación + padding), pero `lg:shrink` + `lg:min-w-0` dejan que
            se achique en conjunto con Tarjeta B si el viewport es más
            angosto que ambas juntas — nunca desborda la página. El cerebro
            (canvas fluido, ver HolographicBrain.tsx) y el hexágono (SVG con
            viewBox fijo, ver AreaBalanceHexagon.tsx) escalan con ella en
            vez de quedar fijos y romper el layout. */}
        <div
          className="w-full min-w-0 rounded-[24px] p-7 lg:basis-[900px] lg:shrink lg:grow-0"
          style={{ background: NEURAL_CARD_BG, border: `1px solid ${NEURAL_VIOLET_CARD_BORDER}`, boxShadow: NEURAL_CARD_SHADOW }}
        >
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="w-full min-w-0 lg:flex-[1.7]">
              <HolographicBrain
                byArea={byAreaWithCommitments}
                cycleNumber={resonance.cycleNumber}
                scanGeneration={scanGeneration}
                onReplay={() => setScanGeneration((g) => g + 1)}
              />
            </div>
            <div className="w-full min-w-0 lg:flex-1">
              <AreaBalanceHexagon byArea={byAreaWithCommitments} />
            </div>
          </div>
          <div className="mt-7">
            <ScanReadingCard byArea={byAreaWithCommitments} />
          </div>
        </div>

        {/* Tarjeta B — mismo criterio: ancho IDEAL 440px, se achica junto a
            Tarjeta A en vez de forzar un mínimo rígido. */}
        <div
          className="flex w-full min-w-0 flex-col gap-5 rounded-[24px] p-7 lg:basis-[440px] lg:shrink lg:grow-0"
          style={{
            background: "linear-gradient(170deg, rgba(34,211,238,0.07), rgba(255,255,255,0.03) 45%)",
            border: "1px solid rgba(34,211,238,0.28)",
            boxShadow: NEURAL_CARD_SHADOW,
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22D3EE", boxShadow: "0 0 10px #22D3EE" }} />
            <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
              RESONANCIA DEL CICLO {resonance.cycleNumber ?? "—"} · ESCANEO COMPLETO
            </span>
          </div>

          <p className="m-0" style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 21, fontWeight: 700, lineHeight: 1.35, color: "#FFFFFF" }}>
            {/* Frase motivacional real — ver CycleLoadRing.tsx para la fórmula tal cual Dashboard.tsx (motivationalHeadline), no una copia nueva. */}
            {motivationalHeadline(resonance.percentGeneral / 100, resonance.completado, user ? firstName(user.name) : undefined)}
          </p>

          <div className="flex justify-center py-2">
            <CycleLoadRing
              percentGeneral={resonance.percentGeneral}
              completado={resonance.completado}
              pendiente={resonance.pendiente}
              noAplica={resonance.noAplica}
              cycleNumber={resonance.cycleNumber}
              prevCyclePercent={prevCyclePercent}
              scanGeneration={scanGeneration}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <NumberStat
              value={resonance.completado}
              label="impulsos enviados"
              color="#22D3EE"
              swatch={<span style={{ width: 14, height: 6, borderRadius: 3, background: "#22D3EE", boxShadow: "0 0 6px #22D3EE" }} />}
            />
            <NumberStat
              value={resonance.pendiente}
              label="carga disponible"
              color="#C4B5FD"
              swatch={<span style={{ width: 14, height: 6, borderRadius: 3, background: "repeating-linear-gradient(90deg, #A78BFA 0 2px, transparent 2px 5px)" }} />}
            />
            <NumberStat
              value={resonance.noAplica}
              label="en reposo"
              color="#A9B1D6"
              swatch={<span style={{ width: 14, height: 2, borderRadius: 1, background: "#A9B1D6" }} />}
            />
          </div>

          <NextTriggerCard percentGeneral={resonance.percentGeneral} completado={resonance.completado} pendiente={resonance.pendiente} />
        </div>
      </div>

      <div id="recableado" className="flex flex-col gap-4 scroll-mt-6">
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
          CIRCUITOS EN RECABLEADO
        </span>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ConsolidadoCard habit={topHabit} />
          {counters && !matchedCounters.has("alcohol") && (
            <RewireCard
              name="Días sin alcohol"
              color={ALCOHOL_COLOR.hex}
              rgb={ALCOHOL_COLOR.rgb}
              days={counters.noAlcoholDays}
              reachedToday={reachedMilestoneToday(ALCOHOL_HABIT_NAME, counters.noAlcoholDays)}
            />
          )}
          {counters && !matchedCounters.has("apuestas") && (
            <RewireCard
              name="Días sin apuestas"
              color={BETTING_COLOR.hex}
              rgb={BETTING_COLOR.rgb}
              days={counters.noBettingDays}
              reachedToday={reachedMilestoneToday(BETTING_HABIT_NAME, counters.noBettingDays)}
            />
          )}
          {activeCommitments.map((c) => (
            <CommitmentRewireCard key={c.id} commitment={c} />
          ))}
        </div>
      </div>

      {counters && (
        <StreakChipRow trainingDays={counters.trainingDays} studyDays={counters.studyDays} emotionalLogDays={counters.emotionalLogDays} />
      )}

      {!counters && <p style={{ color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>Cargando resonancia del ciclo…</p>}
    </div>
  );
}

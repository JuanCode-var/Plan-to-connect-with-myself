import { useState } from "react";
import { useCycles } from "../api/tracking";
import { useDeleteGoal, useGoalIdeas, useGoals, useRegisterGoalProgress, type Goal, type GoalIdea } from "../api/goals";
import { CyclePillSelector } from "../components/CyclePillSelector";
import { GoalWizard } from "../components/GoalWizard";
import { GoalCard } from "../components/GoalCard";
import { GoalEditModal } from "../components/GoalEditModal";
import { SectionIntro } from "../components/SectionIntro";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL } from "../components/NeuralCore/brainTokens";
import { cycleDayProgress, formatShortDate } from "../lib/goalCycle";
import { todayISO } from "../lib/date";
import {
  NEURAL_CYAN,
  NEURAL_CYAN_SOFT,
  NEURAL_BG,
  NEURAL_CARD_BORDER,
  NEURAL_LAVENDER,
  NEURAL_TEXT,
  NEURAL_TEXT_SECONDARY,
} from "../components/NeuralCore/tokens";

const MAX_GOALS = 3;

const EMPTY_SLOT_COPY = {
  first: { title: "Crea tu primera meta", subtitle: "Una sola meta clara vale más que tres difusas." },
  other: (slotNumber: number) => ({ title: `Meta ${slotNumber} · opcional`, subtitle: "Menos metas, más foco." }),
};

const IDEA_ORIGIN_LABEL: Record<GoalIdea["kind"], (idea: GoalIdea) => string> = {
  woop: () => "De tu plan WOOP",
  word: (idea) => `De Mi palabra · cierra el ${idea.closesOn ? formatShortDate(idea.closesOn) : ""}`,
  microaction: (idea) =>
    idea.area ? `De tus micro acciones · ${BRAIN_AREA_LABEL[AREA_OF_CATEGORY[idea.area]]}` : "De tus micro acciones",
};

function EmptySlot({ slotIndex, highlighted, onOpen }: { slotIndex: number; highlighted: boolean; onOpen: () => void }) {
  const copy = slotIndex === 0 ? EMPTY_SLOT_COPY.first : EMPTY_SLOT_COPY.other(slotIndex + 1);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center transition-opacity"
      style={{
        borderColor: highlighted ? "rgba(34,211,238,.4)" : "rgba(255,255,255,.14)",
        background: highlighted ? "rgba(34,211,238,.05)" : "transparent",
        opacity: highlighted ? 1 : 0.6,
      }}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-full border text-xl"
        style={{ borderColor: "rgba(34,211,238,.45)", color: NEURAL_CYAN }}
      >
        +
      </span>
      <span className="text-base font-bold" style={{ color: NEURAL_TEXT }}>
        {copy.title}
      </span>
      <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
        {copy.subtitle}
      </span>
    </button>
  );
}

function IdeaChip({ idea, onUse }: { idea: GoalIdea; onUse: () => void }) {
  const dotColor = idea.area ? BRAIN_AREA_COLOR[AREA_OF_CATEGORY[idea.area]] : NEURAL_LAVENDER;
  return (
    <button
      type="button"
      onClick={onUse}
      className="flex min-w-0 flex-1 items-start gap-2.5 rounded-xl border p-3.5 text-left sm:flex-none sm:basis-72"
      style={{ borderColor: NEURAL_CARD_BORDER, background: "rgba(255,255,255,.03)" }}
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: dotColor }} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-bold" style={{ color: NEURAL_TEXT }}>
          {idea.title}
        </span>
        <span className="truncate text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
          {IDEA_ORIGIN_LABEL[idea.kind](idea)}
        </span>
      </span>
    </button>
  );
}

/**
 * "Metas del ciclo" (mockups 15-15f): de las 5 fases de Brian Tracy con
 * checklist de pasos a un modelo simple de contador — hasta 3 metas por
 * ciclo, cada una "algo que puedas contar" (objetivo + unidad). La rejilla
 * de 3 espacios reemplaza el tablero mosaico de antes: acá el número de
 * metas está limitado a propósito, así que tiene más sentido mostrar los 3
 * lugares posibles (llenos o vacíos) que una lista de largo variable.
 */
export function Metas() {
  const { data: cycles, isLoading: cyclesLoading, isError: cyclesError } = useCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(undefined);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardPrefill, setWizardPrefill] = useState<{ title: string; area: Goal["area"] } | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const selectedCycleStillExists = !!selectedCycleId && !!cycles?.some((c) => c.id === selectedCycleId);
  const defaultCycleId =
    cycles && cycles.length > 0 ? (cycles.find((c) => c.isActive) ?? cycles[cycles.length - 1]).id : undefined;
  const effectiveCycleId = selectedCycleStillExists ? selectedCycleId : defaultCycleId;
  const effectiveCycle = cycles?.find((c) => c.id === effectiveCycleId);

  const { data: goals, isLoading: goalsLoading, isError: goalsError } = useGoals(effectiveCycleId);
  const { data: ideas } = useGoalIdeas(effectiveCycleId);
  const registerProgress = useRegisterGoalProgress(effectiveCycleId);
  const deleteGoal = useDeleteGoal(effectiveCycleId);

  const goalList = goals ?? [];
  const atLimit = goalList.length >= MAX_GOALS;

  function openWizard(prefill?: { title: string; area: Goal["area"] }) {
    setWizardPrefill(prefill ?? null);
    setShowWizard(true);
  }

  const usableIdeas = atLimit
    ? []
    : (ideas ?? [])
        .filter((idea) => !goalList.some((g) => g.title === idea.title))
        .slice(0, MAX_GOALS - goalList.length);

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ background: NEURAL_BG, color: NEURAL_TEXT }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: NEURAL_TEXT }}>
              Metas del ciclo
            </h1>
            <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Hasta 3 metas por ciclo. Tus hábitos son el camino; la meta, el destino.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {cycles && cycles.length > 0 && effectiveCycleId && (
              <CyclePillSelector cycles={cycles} selectedCycleId={effectiveCycleId} onChange={setSelectedCycleId} />
            )}
            <button
              type="button"
              onClick={() => openWizard()}
              disabled={!effectiveCycleId || atLimit || showWizard}
              className="rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
              style={{ background: atLimit ? "rgba(255,255,255,.08)" : NEURAL_CYAN, color: atLimit ? NEURAL_TEXT_SECONDARY : "#070B1F" }}
            >
              + Nueva meta
            </button>
          </div>
        </div>

        <SectionIntro
          id="metas"
          purpose="Hasta 3 metas por ciclo — cada una algo que puedas contar, con objetivo, unidad y fecha."
          steps={[
            "Elige qué quieres lograr este ciclo y a qué área pertenece.",
            "Decide cómo lo vas a medir: un número y una unidad.",
            "Registra tu avance con +1 cada vez que des un paso real.",
          ]}
          benefit="Metas simples y contables, no una lista larga de deseos."
          colors={{
            bg: "rgba(255,255,255,0.04)",
            border: NEURAL_CARD_BORDER,
            text: NEURAL_TEXT,
            textMuted: NEURAL_TEXT_SECONDARY,
            accent: NEURAL_CYAN,
            accentSoft: NEURAL_CYAN_SOFT,
          }}
        />

        {cyclesLoading && <p style={{ color: NEURAL_TEXT_SECONDARY }}>Cargando ciclos…</p>}
        {cyclesError && <p className="text-red-500">No se pudieron cargar los ciclos.</p>}
        {!cyclesLoading && cycles && cycles.length === 0 && (
          <p style={{ color: NEURAL_TEXT_SECONDARY }}>Todavía no hay ciclos — crea uno en Seguimiento primero.</p>
        )}

        {effectiveCycle && (
          <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {(() => {
              const { dayNumber, daysTotal, daysRemaining } = cycleDayProgress(
                effectiveCycle.startDate,
                effectiveCycle.endDate,
                todayISO(),
              );
              return (
                <>
                  <span className="shrink-0">
                    Día {dayNumber} de {daysTotal}
                  </span>
                  <div className="h-1 min-w-[120px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.1)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.round((dayNumber / daysTotal) * 100)}%`, background: NEURAL_CYAN }}
                    />
                  </div>
                  <span className="shrink-0">{daysRemaining} días restantes</span>
                </>
              );
            })()}
          </div>
        )}

        {effectiveCycleId && goalsLoading && <p style={{ color: NEURAL_TEXT_SECONDARY }}>Cargando metas…</p>}
        {goalsError && <p className="text-red-500">No se pudieron cargar las metas.</p>}

        {showWizard && effectiveCycleId && effectiveCycle ? (
          <GoalWizard
            cycleId={effectiveCycleId}
            cycleStartDate={effectiveCycle.startDate}
            cycleEndDate={effectiveCycle.endDate}
            initialTitle={wizardPrefill?.title}
            initialArea={wizardPrefill?.area ?? undefined}
            onCreated={() => setShowWizard(false)}
            onCancel={() => setShowWizard(false)}
          />
        ) : (
          effectiveCycleId && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: MAX_GOALS }, (_, i) => {
                  const goal = goalList[i];
                  if (goal) {
                    return (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        registeringProgress={registerProgress.isPending}
                        onRegisterProgress={(delta) => registerProgress.mutate({ id: goal.id, delta })}
                        onEdit={() => setEditingGoal(goal)}
                        onDelete={() => deleteGoal.mutate(goal.id)}
                      />
                    );
                  }
                  const isFirstEmpty = i === goalList.length;
                  return (
                    <EmptySlot key={`empty-${i}`} slotIndex={i} highlighted={isFirstEmpty} onOpen={() => openWizard()} />
                  );
                })}
              </div>

              {usableIdeas.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: NEURAL_LAVENDER }}>
                    Ideas a partir de lo que ya haces
                  </span>
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                    {usableIdeas.map((idea) => (
                      <IdeaChip key={idea.key} idea={idea} onUse={() => openWizard({ title: idea.title, area: idea.area })} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>

      {editingGoal && effectiveCycle && (
        <GoalEditModal
          goal={editingGoal}
          cycleId={effectiveCycle.id}
          cycleStartDate={effectiveCycle.startDate}
          cycleEndDate={effectiveCycle.endDate}
          onClose={() => setEditingGoal(null)}
        />
      )}
    </div>
  );
}

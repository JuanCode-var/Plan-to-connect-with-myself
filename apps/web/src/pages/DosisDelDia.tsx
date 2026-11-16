import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDoses, useDoseProgress, useCompleteDose, useUnlockDoseReward, parseDoseActions, parseDoseOptions } from "../api/doses";
import { useLibrary, useUnlockedQuotes } from "../api/library";
import { useCycles } from "../api/tracking";
import { addDaysISO, todayISO } from "../lib/date";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB } from "../components/NeuralCore/brainTokens";
import { NEURAL_BG, NEURAL_CYAN, NEURAL_GLOW_CYAN_STRONG, NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_TEXT_SECONDARY } from "../components/NeuralCore/tokens";
import { useCycleResonance } from "../components/CycleResonance/useCycleResonance";
import { DoseCompleted } from "../components/Library/DoseCompleted";
import { DoseMiniBrain } from "../components/Library/DoseMiniBrain";
import { DoseQuoteCollectionGrid } from "../components/Library/DoseQuoteCollectionGrid";
import { DoseReasonsCard } from "../components/Library/DoseReasonsCard";
import { computeDoseStreak, selectDailyDose, weekStreakDays, resolveHookText } from "../components/Library/doseSelector";
import { DoseStepAdivina } from "../components/Library/DoseStepAdivina";
import { DoseStepGancho } from "../components/Library/DoseStepGancho";
import { DoseStepHoyLoPruebo } from "../components/Library/DoseStepHoyLoPruebo";
import { DoseStepPruebalo } from "../components/Library/DoseStepPruebalo";
import { DoseStepRecompensa } from "../components/Library/DoseStepRecompensa";
import { DoseStreakRow } from "../components/Library/DoseStreakRow";
import { useSendDoseImpulse } from "../components/Library/useSendDoseImpulse";

const STEP_COUNT = 5;

export function DosisDelDia() {
  const { id } = useParams<{ id: string }>();
  const { data: doses } = useDoses();
  const { data: doseProgressList } = useDoseProgress();
  const { data: cycles } = useCycles();
  const effectiveCycleId = cycles?.find((c) => c.isActive)?.id ?? cycles?.[cycles.length - 1]?.id;
  const resonance = useCycleResonance(effectiveCycleId);
  const { data: entries } = useLibrary();
  const { data: unlocked } = useUnlockedQuotes();
  const unlockReward = useUnlockDoseReward();
  const completeDose = useCompleteDose();
  const { sendImpulse } = useSendDoseImpulse();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [stepDone, setStepDone] = useState<Record<number, boolean>>({});
  const [justCompletedText, setJustCompletedText] = useState<string | null | undefined>(undefined);
  const [replaying, setReplaying] = useState(false);

  const dose = doses?.find((d) => d.id === id);
  const area = dose ? AREA_OF_CATEGORY[dose.area] : null;
  const today = todayISO();

  const completedToday = (doseProgressList ?? []).some((p) => p.doseId === id && p.date === today);
  const quotesSorted = useMemo(() => (entries ?? []).filter((e) => e.section === "FRASE").sort((a, b) => a.id.localeCompare(b.id)), [entries]);
  const unlockedIds = useMemo(() => new Set((unlocked ?? []).map((u) => u.entryId)), [unlocked]);
  const streakDates = useMemo(() => (doseProgressList ?? []).map((p) => p.date), [doseProgressList]);
  const streak = computeDoseStreak(streakDates, today);

  const yesterdayHabit = useMemo(() => {
    if (!area) return null;
    const yesterday = addDaysISO(today, -1);
    const habit = resonance.byHabit.find((h) => h.area === area && h.priority === "ALTA" && resonance.statusOf(h.id, yesterday) === "PENDING");
    return habit ? { id: habit.id, name: habit.name } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, resonance.byHabit]);

  const areaPercent = area ? (resonance.byArea.find((a) => a.area === area)?.percent ?? null) : null;
  const sourceTitle = dose?.sourceEntry?.title ?? dose?.sourceSchool?.name ?? null;

  const nextPreviewText = useMemo(() => {
    if (!doses || !dose) return null;
    const completedIds = new Set([...(doseProgressList ?? []).map((p) => p.doseId), dose.id]);
    const byAreaPercent = Object.fromEntries(resonance.byArea.map((a) => [a.area, a.percent]));
    const selection = selectDailyDose({ byAreaPercent, doses: doses.map((d) => ({ id: d.id, area: AREA_OF_CATEGORY[d.area] })), completedDoseIds: completedIds });
    if (!selection) return null;
    const pct = resonance.byArea.find((a) => a.area === selection.area)?.percent;
    return `Mañana: una dosis de ${BRAIN_AREA_LABEL[selection.area]}${pct !== null && pct !== undefined ? `, porque va en ${pct} % este ciclo` : ""}.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doses, dose, doseProgressList, resonance.byArea]);

  if (!doses || !dose || !area || resonance.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center" style={{ background: "#070B1F" }}>
        <p style={{ color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>Cargando tu dosis…</p>
      </div>
    );
  }

  const color = BRAIN_AREA_COLOR[area];
  const rgb = BRAIN_AREA_RGB[area];
  const showCompleted = (completedToday && !replaying) || justCompletedText !== undefined;

  function markDone(n: number) {
    setStepDone((s) => ({ ...s, [n]: true }));
  }

  function handleChoose(actionIndex: number) {
    completeDose.mutate(
      { doseId: dose!.id, actionIndex, date: today },
      {
        onSuccess: (result) => {
          sendImpulse(area!);
          setJustCompletedText(result.microAction.text);
        },
        onError: () => setJustCompletedText(null),
      },
    );
  }

  return (
    <div
      className="min-h-full px-4 py-8 sm:px-8"
      style={{ background: "#070B1F" }}
    >
      <div className="mx-auto flex max-w-[1360px] flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Columna izquierda — en móvil va 2da (después de la tarjeta central), en desktop va 1era */}
        <div className={`order-2 flex w-full flex-col gap-5 lg:order-1 lg:w-[380px] lg:flex-shrink-0 ${showCompleted ? "" : "hidden lg:flex"}`}>
          <Link to="/library" className="text-sm font-semibold" style={{ color: "#22D3EE" }}>
            ← Biblioteca
          </Link>
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: "#C4B5FD" }}>TU DOSIS DEL DÍA</span>
            <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 32, fontWeight: 700, color: "#FFFFFF" }}>{dose.title}</span>
            <div className="mt-1 flex items-center gap-2">
              <span style={{ fontSize: 12, fontWeight: 700, color: "#070B1F", padding: "4px 10px", borderRadius: 999, background: color }}>
                {BRAIN_AREA_LABEL[area]}
              </span>
              <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>2 min · 5 pasos</span>
            </div>
          </div>

          <DoseReasonsCard area={area} areaPercent={areaPercent} yesterdayHabit={yesterdayHabit} sourceTitle={sourceTitle} />
          <DoseStreakRow days={weekStreakDays(streakDates, today)} />
        </div>

        {/* Historia central — en móvil va 1era (es lo accionable), en desktop va en el medio */}
        <div className="order-1 mx-auto w-full lg:order-2" style={{ maxWidth: 420 }}>
          {showCompleted ? (
            <div
              className="rounded-[32px] p-8"
              style={{ background: "#0B1030", border: `1px solid rgba(${rgb},0.35)`, boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}
            >
              <DoseCompleted
                area={area}
                microActionText={justCompletedText ?? null}
                streak={streak}
                unlockedCount={unlockedIds.size}
                totalQuotes={quotesSorted.length}
                nextPreviewText={nextPreviewText}
                onReplay={() => {
                  setReplaying(true);
                  setJustCompletedText(undefined);
                  setStep(1);
                  setStepDone({});
                }}
              />
            </div>
          ) : (
            <div
              className="flex flex-col gap-6 rounded-[32px] p-7"
              style={{
                background: `radial-gradient(260px 160px at 50% 0%, rgba(${rgb},0.16), transparent 70%), radial-gradient(260px 200px at 50% 100%, rgba(124,92,255,0.14), transparent 70%), #0B1030`,
                border: `1px solid rgba(${rgb},0.35)`,
                boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
                minHeight: 520,
              }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex gap-1.5">
                  {Array.from({ length: STEP_COUNT }, (_, i) => (
                    <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? NEURAL_CYAN : "rgba(255,255,255,0.12)" }} />
                  ))}
                </div>
                <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>Paso {step} de {STEP_COUNT}</span>
              </div>

              <div key={step} style={{ animation: "dose-step-in .35s ease" }}>
                {step === 1 && (
                  <DoseStepGancho
                    hookText={resolveHookText(dose.hookTemplate, yesterdayHabit)}
                    question={dose.hookQuestion}
                    options={parseDoseOptions(dose)}
                    answer={dose.hookAnswer}
                    area={area}
                    onComplete={() => markDone(1)}
                  />
                )}
                {step === 2 && (
                  <DoseStepAdivina
                    question={dose.guessQuestion}
                    min={dose.guessMin}
                    max={dose.guessMax}
                    step={dose.guessStep}
                    realValue={dose.guessRealValue}
                    explanation={dose.guessExplanation}
                    area={area}
                    onComplete={() => markDone(2)}
                  />
                )}
                {step === 3 && (
                  <DoseStepPruebalo instruction={dose.holdInstruction} completionText={dose.holdCompletionText} area={area} onComplete={() => markDone(3)} />
                )}
                {step === 4 && (
                  <DoseStepRecompensa
                    quoteContent={dose.rewardEntry.content}
                    quoteAuthor={dose.rewardEntry.author}
                    unlockedCount={unlockedIds.size}
                    totalQuotes={quotesSorted.length}
                    onReveal={() => unlockReward.mutate(dose.id)}
                    onComplete={() => markDone(4)}
                  />
                )}
                {step === 5 && <DoseStepHoyLoPruebo actions={parseDoseActions(dose)} area={area} onChoose={handleChoose} />}
              </div>

              {step < 5 && (
                <div className="mt-auto flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s > 1 ? ((s - 1) as typeof s) : s))}
                    disabled={step === 1}
                    className="text-sm font-semibold disabled:opacity-0"
                    style={{ color: NEURAL_TEXT_SECONDARY }}
                  >
                    ← Atrás
                  </button>
                  <button
                    type="button"
                    disabled={!stepDone[step]}
                    onClick={() => setStep((s) => Math.min(STEP_COUNT, s + 1) as typeof s)}
                    style={{
                      height: 48,
                      padding: "0 22px",
                      borderRadius: 14,
                      fontFamily: NEURAL_FONT_BODY,
                      fontSize: 14,
                      fontWeight: 700,
                      color: stepDone[step] ? NEURAL_BG : NEURAL_TEXT_SECONDARY,
                      background: stepDone[step] ? NEURAL_CYAN : "rgba(255,255,255,0.06)",
                      boxShadow: stepDone[step] ? `0 0 16px ${NEURAL_GLOW_CYAN_STRONG}` : "none",
                    }}
                  >
                    {stepDone[step] ? "Siguiente →" : "Completa el paso"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna derecha — última tanto en móvil como en desktop */}
        <div className={`order-3 flex w-full flex-col gap-6 lg:w-[380px] lg:flex-shrink-0 ${showCompleted ? "" : "hidden lg:flex"}`}>
          <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: "#C4B5FD" }}>ESTA DOSIS ALIMENTA</span>
            <DoseMiniBrain area={area} progress={showCompleted ? 1 : step / STEP_COUNT} />
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>{BRAIN_AREA_LABEL[area]}</span>
              <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: color }}>{areaPercent ?? 0} %</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
              <div style={{ width: `${areaPercent ?? 0}%`, height: 6, borderRadius: 3, background: color, transition: "width .6s ease" }} />
            </div>
          </div>

          <DoseQuoteCollectionGrid
            quoteIds={quotesSorted.map((q) => q.id)}
            unlockedIds={unlockedIds}
            justUnlockedId={step >= 4 || showCompleted ? dose.rewardEntry.id : null}
          />
        </div>
      </div>
    </div>
  );
}

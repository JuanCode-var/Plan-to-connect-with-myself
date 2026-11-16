import { useEffect, useState } from "react";
import { useCompass } from "../api/compass";
import { useCreateWoopPlan } from "../api/microActions";
import type { HabitCategory } from "../domain";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, CATEGORY_OF_AREA } from "./NeuralCore/brainTokens";
import { NEURAL_BG, NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

type Step = "wish" | "outcome" | "obstacle" | "plan";
const STEPS: Step[] = ["wish", "outcome", "obstacle", "plan"];

const STEP_LABELS: Record<Step, string> = {
  wish: "W · Deseo",
  outcome: "O · Resultado",
  obstacle: "O · Obstáculo",
  plan: "P · Plan",
};
const STEP_QUESTIONS: Record<Step, string> = {
  wish: "¿Qué quieres conseguir?",
  outcome: "¿Qué cambiaría en tu vida si lo consiguieras?",
  obstacle: "¿Qué te lo impide?",
  plan: "¿Qué harás cuando aparezca el obstáculo?",
};
const SUMMARY_QUESTIONS: Record<Step, string> = {
  ...STEP_QUESTIONS,
  outcome: "¿Qué cambiaría en tu vida?",
};

const WEEKDAY_FULL_LABELS = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];

const QUICK_IDEAS = ["versión de 2 minutos", "preparar todo la noche antes", "avisarle a alguien"];

function stepIndex(step: Step): number {
  return STEPS.indexOf(step);
}

/**
 * Asistente WOOP (Wish/Outcome/Obstacle/Plan) de 4 pasos. Mismo patrón de
 * máquina de estados por pasos que CompassOnboarding.tsx (un `Step` por vez,
 * un bloque de render y de footer por paso) en vez de un wizard genérico
 * nuevo. Se abre desde 3 lugares (botón de "Plan WOOP" vacío, los 3 botones
 * de "Patrones detectados", y acá mismo ofrece tomar una frase de Mi
 * Identidad como Deseo) — todos pasan props de prellenado opcionales, nunca
 * estado compartido.
 */
export function WoopFlow({
  onClose,
  initialTitle,
  initialDesire,
  initialObstacle,
  sourceInsightType,
  sourceInsightSummary,
}: {
  onClose: () => void;
  initialTitle?: string;
  initialDesire?: string;
  initialObstacle?: string;
  sourceInsightType?: string;
  sourceInsightSummary?: string;
}) {
  const [step, setStep] = useState<Step>("wish");
  const [desire, setDesire] = useState(initialDesire ?? "");
  const [area, setArea] = useState<HabitCategory | null>(null);
  const [desireIdentityId, setDesireIdentityId] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [obstacle, setObstacle] = useState(initialObstacle ?? "");
  const [planIf, setPlanIf] = useState("");
  const [planThen, setPlanThen] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderWeekday, setReminderWeekday] = useState(1);
  const [reminderTime, setReminderTime] = useState("06:00");

  const { data: compass } = useCompass();
  const createWoopPlan = useCreateWoopPlan();

  // Mismo criterio que el resto de los modales de la app (ApplyLearningModal,
  // LearningForm): Escape cierra.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const idx = stepIndex(step);
  const answeredSteps = STEPS.slice(0, idx);

  function answerFor(s: Step): string {
    if (s === "wish") return desire;
    if (s === "outcome") return result;
    return obstacle;
  }

  function canAdvance(): boolean {
    if (step === "wish") return desire.trim().length > 0 && area !== null;
    if (step === "outcome") return result.trim().length > 0;
    if (step === "obstacle") return obstacle.trim().length > 0;
    return planIf.trim().length > 0 && planThen.trim().length > 0;
  }

  function goNext() {
    if (!canAdvance()) return;
    if (step !== "plan") {
      setStep(STEPS[idx + 1]);
      return;
    }
    createWoopPlan.mutate(
      {
        title: initialTitle ?? null,
        desire: desire.trim(),
        area,
        result: result.trim(),
        obstacle: obstacle.trim(),
        planIf: planIf.trim(),
        planThen: planThen.trim(),
        identityId: desireIdentityId,
        sourceInsightType: sourceInsightType ?? null,
        sourceInsightSummary: sourceInsightSummary ?? null,
        reminderWeekday: reminderEnabled ? reminderWeekday : null,
        reminderTime: reminderEnabled ? reminderTime : null,
      },
      { onSuccess: onClose },
    );
  }

  function goBack() {
    if (idx === 0) return;
    setStep(STEPS[idx - 1]);
  }

  const selectedIdentity = compass?.identities.find((i) => i.id === desireIdentityId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,5,9,0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="woop-titulo"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[960px] flex-col gap-[26px] overflow-y-auto rounded-[24px] border p-8 sm:p-10"
        style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: NEURAL_LAVENDER }}>
              Salir de un bloqueo · Método WOOP
            </span>
            <h1 id="woop-titulo" className="m-0 text-[28px] font-extrabold" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              Arma tu plan en 4 pasos
            </h1>
            {sourceInsightSummary && (
              <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Abierto desde Patrones: {sourceInsightSummary}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm font-bold" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Paso {idx + 1} de 4
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-9 w-9 items-center justify-center rounded-full border text-lg leading-none"
              style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT_SECONDARY }}
            >
              ×
            </button>
          </div>
        </div>

        <ol aria-label="Pasos" className="m-0 grid list-none grid-cols-4 gap-2 p-0">
          {STEPS.map((s, i) => {
            const state = i < idx ? "done" : i === idx ? "current" : "upcoming";
            const barColor = state === "current" ? NEURAL_CYAN : state === "done" ? "rgba(34,211,238,.4)" : "rgba(255,255,255,.08)";
            const labelColor = state === "upcoming" ? "rgba(169,177,214,.6)" : NEURAL_TEXT_SECONDARY;
            return (
              <li key={s} className="flex flex-col gap-2">
                <span className="h-1.5 rounded-full" style={{ background: barColor }} />
                <span className="text-[13px]" style={{ color: state === "current" ? NEURAL_CYAN : labelColor, fontWeight: state === "current" ? 800 : 700 }}>
                  {STEP_LABELS[s]}
                </span>
              </li>
            );
          })}
        </ol>

        {answeredSteps.length > 0 && (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {answeredSteps.map((s) => (
              <div key={s} className="flex flex-col gap-1.5 rounded-2xl border p-4" style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER }}>
                <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  {SUMMARY_QUESTIONS[s]}
                </span>
                <span className="text-[15px] font-semibold">{answerFor(s)}</span>
                {s === "wish" && selectedIdentity && (
                  <span className="text-xs" style={{ color: NEURAL_CYAN }}>
                    Desde Mi Identidad: &ldquo;{selectedIdentity.statement}&rdquo;
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {step !== "plan" ? (
          <section className="flex flex-1 flex-col gap-4 rounded-[20px] border p-7" style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER }}>
            <h2 className="m-0 text-xl font-extrabold">{STEP_QUESTIONS[step]}</h2>
            <textarea
              rows={3}
              autoFocus
              value={step === "wish" ? desire : step === "outcome" ? result : obstacle}
              onChange={(e) => {
                if (step === "wish") {
                  setDesire(e.target.value);
                  setDesireIdentityId(null);
                } else if (step === "outcome") {
                  setResult(e.target.value);
                } else {
                  setObstacle(e.target.value);
                }
              }}
              className="resize-none rounded-2xl border p-3.5 text-base leading-relaxed font-reading"
              style={{ background: NEURAL_BG, borderColor: "rgba(34,211,238,.35)", color: NEURAL_TEXT, fontFamily: "'Lora', Georgia, serif" }}
            />
            {step === "wish" && (
              <div className="flex flex-col gap-2">
                <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  ¿A qué área pertenece?
                </span>
                <div className="flex flex-wrap gap-2">
                  {BRAIN_AREAS.map((brainArea) => {
                    const category = CATEGORY_OF_AREA[brainArea];
                    const color = BRAIN_AREA_COLOR[brainArea];
                    const selected = area === category;
                    return (
                      <button
                        key={brainArea}
                        type="button"
                        onClick={() => setArea(category)}
                        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                        style={{
                          borderColor: selected ? color : NEURAL_CARD_BORDER,
                          background: selected ? `${color}1F` : "transparent",
                          color: selected ? color : NEURAL_TEXT_SECONDARY,
                        }}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                        {BRAIN_AREA_LABEL[brainArea]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {step === "wish" && compass && compass.identities.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  O toma una frase de Mi Identidad como Deseo:
                </span>
                <div className="flex flex-wrap gap-2">
                  {compass.identities.map((identity) => (
                    <button
                      key={identity.id}
                      type="button"
                      onClick={() => {
                        setDesire(identity.statement);
                        setDesireIdentityId(identity.id);
                      }}
                      className="rounded-full border px-3 py-1.5 text-xs"
                      style={{
                        borderColor: desireIdentityId === identity.id ? NEURAL_CYAN : NEURAL_CARD_BORDER,
                        background: desireIdentityId === identity.id ? "rgba(34,211,238,.12)" : NEURAL_CARD_BG,
                        color: desireIdentityId === identity.id ? NEURAL_CYAN : NEURAL_TEXT_SECONDARY,
                      }}
                    >
                      {identity.statement}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : (
          <section
            aria-label="Paso Plan"
            className="flex flex-1 flex-col gap-[18px] rounded-[20px] border p-7"
            style={{ background: NEURAL_CARD_BG, borderColor: "rgba(34,211,238,.3)" }}
          >
            <h2 className="m-0 text-[22px] font-extrabold">P · {STEP_QUESTIONS.plan}</h2>
            <div className="grid items-center gap-3.5" style={{ gridTemplateColumns: "90px minmax(0, 1fr)" }}>
              <label htmlFor="woop-si" className="text-xl font-extrabold" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Si…
              </label>
              <input
                id="woop-si"
                value={planIf}
                onChange={(e) => setPlanIf(e.target.value)}
                className="h-14 rounded-2xl border px-4 text-[17px]"
                style={{ background: NEURAL_BG, borderColor: "rgba(34,211,238,.35)", color: NEURAL_TEXT }}
              />
              <label htmlFor="woop-entonces" className="text-xl font-extrabold" style={{ color: NEURAL_CYAN }}>
                entonces…
              </label>
              <input
                id="woop-entonces"
                value={planThen}
                onChange={(e) => setPlanThen(e.target.value)}
                className="h-14 rounded-2xl border px-4 text-[17px]"
                style={{ background: NEURAL_BG, borderColor: "rgba(34,211,238,.35)", color: NEURAL_TEXT }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px]" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Ideas rápidas:
              </span>
              {QUICK_IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setPlanThen((prev) => (prev.trim() ? `${prev.trim()}, ${idea}` : idea))}
                  className="h-9 rounded-full border px-3 text-[13px]"
                  style={{ borderColor: NEURAL_CARD_BORDER, background: NEURAL_CARD_BG, color: NEURAL_TEXT_SECONDARY }}
                >
                  {idea}
                </button>
              ))}
            </div>
            <label className="flex min-h-11 items-center gap-3 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="h-5 w-5"
                style={{ accentColor: NEURAL_CYAN }}
              />
              Recordarme este plan
              {reminderEnabled && (
                <>
                  los
                  <select
                    value={reminderWeekday}
                    onChange={(e) => setReminderWeekday(Number(e.target.value))}
                    className="rounded-lg border px-2 py-1 text-sm"
                    style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                  >
                    {WEEKDAY_FULL_LABELS.map((label, day) => (
                      <option key={day} value={day}>
                        {label}
                      </option>
                    ))}
                  </select>
                  a las
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="rounded-lg border px-2 py-1 text-sm"
                    style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                  />
                </>
              )}
            </label>
          </section>
        )}

        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={idx === 0}
            className="h-12 rounded-xl border px-[22px] text-sm font-bold disabled:opacity-40"
            style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT_SECONDARY, background: "transparent" }}
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canAdvance() || createWoopPlan.isPending}
            className="h-12 rounded-xl px-[26px] text-sm font-extrabold disabled:opacity-50"
            style={{ background: NEURAL_CYAN, color: "#070B1F" }}
          >
            {step === "plan" ? (createWoopPlan.isPending ? "Guardando…" : "Guardar mi plan") : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}

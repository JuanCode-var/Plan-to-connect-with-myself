import { useEffect, useState } from "react";
import { useCreateJournalEntry } from "../api/journal";
import { useSendDoseImpulse } from "./Library/useSendDoseImpulse";
import { EMOTIONS, EMOTION_COLORS, type Emotion } from "../domain";
import { JournalDatePicker } from "./JournalDatePicker";
import { NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY, NEURAL_BG } from "./NeuralCore/tokens";
import { todayISO } from "../lib/date";

type Step = "emocion" | "ocurrio" | "cuerpo" | "impulso" | "decision" | "aprendi";
const STEPS: Step[] = ["emocion", "ocurrio", "cuerpo", "impulso", "decision", "aprendi"];

const QUESTIONS: Record<Step, string> = {
  emocion: "¿Qué estás sintiendo?",
  ocurrio: "¿Qué ocurrió?",
  cuerpo: "¿Qué sentiste y dónde lo notaste en el cuerpo?",
  impulso: "¿Qué impulso apareció?",
  decision: "¿Qué decisión tomaste?",
  aprendi: "¿Qué aprendiste?",
};
const PLACEHOLDERS: Partial<Record<Step, string>> = {
  ocurrio: "Solo los hechos, como si lo contara una cámara.",
  cuerpo: "Pecho apretado, calor en la cara, nudo en el estómago…",
  impulso: "Lo que tu cerebro quería hacer en automático…",
  decision: "Lo que hiciste de verdad, aunque no haya sido perfecto…",
  aprendi: "Una frase que tu yo de mañana necesite leer…",
};
const NEURO_TEXT: Record<Step, string> = {
  emocion: "Ponerle nombre a lo que sientes ya ayuda a regularlo: los estudios lo llaman etiquetado afectivo.",
  ocurrio: "Separar los hechos de la interpretación le quita fuerza a la historia que tu mente le agrega.",
  cuerpo: "Las emociones empiezan en el cuerpo. Notarlas a tiempo te da segundos para elegir qué hacer.",
  impulso: "El impulso es el camino viejo. Verlo con claridad es lo que te permite no seguirlo.",
  decision: "El espacio entre el impulso y la decisión es donde entrenas tu autocontrol.",
  aprendi: "Cerrar con un aprendizaje convierte un mal momento en experiencia útil.",
};

function stepIndex(s: Step): number {
  return STEPS.indexOf(s);
}

function NeuroTip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl p-3.5" style={{ background: "rgba(196,181,253,.08)", border: "1px solid rgba(196,181,253,.2)" }}>
      <span className="shrink-0 text-xs font-bold tracking-[0.08em]" style={{ color: NEURAL_LAVENDER }}>
        🧠 NEURO
      </span>
      <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY, lineHeight: 1.5 }}>
        {text}
      </p>
    </div>
  );
}

type SavedEntry = { impulse: string; decision: string; learning: string };

/**
 * "Registro emocional" (mockups 17/17b/17c): 6 pasos guiados, uno por
 * pantalla, en vez del formulario largo de siempre — mismo patrón de máquina
 * de estados por paso que GoalWizard.tsx/WoopFlow.tsx. Sin tarjeta propia:
 * el borde/fondo de 3px vienen del wrapper compartido en Journal.tsx (misma
 * tarjeta para las 4 pestañas, solo cambia de color) — `onEmotionChange` le
 * avisa a ese wrapper qué color usar apenas se elige una emoción, para que
 * la tarjeta "sienta" la emoción puntual en vez de quedarse en el rosa fijo
 * de la pestaña.
 */
export function EmotionWizard({ onEmotionChange }: { onEmotionChange?: (color: string | null) => void }) {
  const [step, setStep] = useState<Step>("emocion");
  const [date, setDate] = useState(todayISO());
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [situation, setSituation] = useState("");
  const [feeling, setFeeling] = useState("");
  const [impulse, setImpulse] = useState("");
  const [decision, setDecision] = useState("");
  const [learning, setLearning] = useState("");
  const [saved, setSaved] = useState<SavedEntry | null>(null);

  const createEntry = useCreateJournalEntry();
  const { sendImpulse } = useSendDoseImpulse();

  useEffect(() => {
    onEmotionChange?.(emotion ? EMOTION_COLORS[emotion] : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion]);

  const idx = stepIndex(step);

  function canAdvance(): boolean {
    if (step === "emocion") return emotion !== null;
    if (step === "ocurrio") return situation.trim().length > 0;
    if (step === "cuerpo") return feeling.trim().length > 0;
    if (step === "impulso") return impulse.trim().length > 0;
    if (step === "decision") return decision.trim().length > 0;
    return learning.trim().length > 0;
  }

  function goBack() {
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  function goNext() {
    if (!canAdvance()) return;
    if (step !== "aprendi") {
      setStep(STEPS[idx + 1]);
      return;
    }
    createEntry.mutate(
      {
        date,
        emotion: emotion!,
        intensity,
        situation: situation.trim(),
        feeling: feeling.trim(),
        impulse: impulse.trim(),
        decision: decision.trim(),
        learning: learning.trim(),
      },
      {
        onSuccess: () => {
          sendImpulse("emo");
          setSaved({ impulse: impulse.trim(), decision: decision.trim(), learning: learning.trim() });
        },
      },
    );
  }

  function reset() {
    setStep("emocion");
    setDate(todayISO());
    setEmotion(null);
    setIntensity(5);
    setSituation("");
    setFeeling("");
    setImpulse("");
    setDecision("");
    setLearning("");
    setSaved(null);
  }

  if (saved) {
    return (
      <div className="micro-view-in flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <span
            className="goal-achieved-in flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold"
            style={{ background: NEURAL_GOLD, color: "#3A2E05" }}
          >
            ✓
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-display m-0 text-xl font-bold" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
              Registro guardado
            </h2>
            <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Le pusiste nombre a lo que sentiste. Ese ya es el primer paso para regularlo.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl border border-dashed p-4" style={{ borderColor: "rgba(255,255,255,.18)" }}>
            <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: NEURAL_TEXT_SECONDARY }}>
              El impulso
            </span>
            <span className="text-sm" style={{ color: NEURAL_TEXT }}>
              {saved.impulse}
            </span>
          </div>
          <span className="hidden items-center justify-center text-xl sm:flex" style={{ color: NEURAL_CYAN }} aria-hidden>
            →
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl border p-4" style={{ borderColor: "rgba(34,211,238,.35)", background: "rgba(34,211,238,.06)" }}>
            <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: NEURAL_CYAN }}>
              Tu decisión
            </span>
            <span className="text-sm" style={{ color: NEURAL_TEXT }}>
              {saved.decision}
            </span>
          </div>
        </div>

        <div className="rounded-xl border-l-2 p-4" style={{ borderColor: NEURAL_GOLD, background: "rgba(255,255,255,.03)" }}>
          <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: NEURAL_GOLD }}>
            Lo que aprendiste
          </span>
          <p className="font-reading m-0 mt-1 text-base italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.5 }}>
            {saved.learning}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            <span className="h-2 w-2 rounded-full" style={{ background: "#FB5C8C" }} aria-hidden />
            Suma un impulso a tu región Emocional
          </span>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border px-4 py-2 text-sm font-bold"
            style={{ borderColor: "rgba(34,211,238,.45)", color: NEURAL_CYAN }}
          >
            Nuevo registro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: NEURAL_LAVENDER }}>
          Registro emocional · Paso {idx + 1} de 6
        </span>
        <JournalDatePicker date={date} onChange={setDate} />
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className="h-1.5 rounded-full transition-colors duration-300"
            style={{ background: i <= idx ? NEURAL_CYAN : "rgba(255,255,255,.1)" }}
          />
        ))}
      </div>

      <div key={step} className="micro-view-in flex flex-col gap-4">
        {step !== "emocion" && emotion && (
          <span
            className="w-fit rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: `${EMOTION_COLORS[emotion]}22`, color: EMOTION_COLORS[emotion] }}
          >
            {emotion} · {intensity}/10
          </span>
        )}

        <h2 className="font-display m-0 text-2xl font-bold sm:text-[28px]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
          {QUESTIONS[step]}
        </h2>

        {step === "emocion" ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {EMOTIONS.map((em) => {
                const color = EMOTION_COLORS[em];
                const selected = emotion === em;
                return (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmotion(em)}
                    className="flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-semibold"
                    style={{
                      borderColor: selected ? color : "rgba(255,255,255,.12)",
                      background: selected ? `${color}1F` : "rgba(255,255,255,.03)",
                      color: selected ? color : NEURAL_TEXT,
                      boxShadow: selected ? `0 0 14px ${color}55` : undefined,
                    }}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                    {em}
                  </button>
                );
              })}
            </div>

            {emotion && (
              <div className="micro-view-in flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                    ¿Con qué intensidad?
                  </span>
                  <span className="font-display text-sm font-bold" style={{ color: NEURAL_TEXT }}>
                    {intensity}/10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-[#22D3EE]"
                />
                <div className="flex justify-between text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  <span>Apenas la noto</span>
                  <span>Me desborda</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <textarea
            autoFocus
            rows={5}
            value={step === "ocurrio" ? situation : step === "cuerpo" ? feeling : step === "impulso" ? impulse : step === "decision" ? decision : learning}
            onChange={(e) => {
              const v = e.target.value;
              if (step === "ocurrio") setSituation(v);
              else if (step === "cuerpo") setFeeling(v);
              else if (step === "impulso") setImpulse(v);
              else if (step === "decision") setDecision(v);
              else setLearning(v);
            }}
            placeholder={PLACEHOLDERS[step]}
            className="font-reading resize-none rounded-xl border p-4 text-lg leading-relaxed"
            style={{ background: NEURAL_BG, borderColor: "rgba(34,211,238,.35)", color: NEURAL_TEXT, fontFamily: "'Lora', Georgia, serif" }}
          />
        )}

        <NeuroTip text={NEURO_TEXT[step]} />
      </div>

      <div className="flex items-center justify-between gap-3">
        {idx > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="rounded-xl border px-5 py-2.5 text-sm font-bold"
            style={{ borderColor: "rgba(34,211,238,.45)", color: NEURAL_CYAN }}
          >
            ← Atrás
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={!canAdvance() || createEntry.isPending}
          onClick={goNext}
          className="rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40"
          style={{ background: NEURAL_CYAN, color: "#070B1F" }}
        >
          {step === "emocion"
            ? emotion
              ? "Siguiente →"
              : "Elige una emoción"
            : step === "aprendi"
              ? createEntry.isPending
                ? "Guardando…"
                : "Guardar registro"
              : "Siguiente →"}
        </button>
      </div>

      {createEntry.isError && (
        <p className="text-sm" style={{ color: "#F87171" }}>
          No se pudo guardar el registro.
        </p>
      )}
    </div>
  );
}

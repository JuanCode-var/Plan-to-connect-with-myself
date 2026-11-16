import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL } from "./NeuralCore/brainTokens";
import { NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import type { MonthClosure } from "../lib/wordMonths";
import { daysUntil } from "../lib/wordMonths";
import { todayISO } from "../lib/date";

export type SealFeedback = { type: "sealed"; title: string; monthsWeight: number } | { type: "honest"; title: string };

function formatDayMonth(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("es-AR", { day: "numeric", month: "short" }).replace(/\.(?=\s|$)/, "");
}

function FeedbackPanel({ feedback, onStartRenew }: { feedback: SealFeedback; onStartRenew: () => void }) {
  if (feedback.type === "sealed") {
    return (
      <div className="flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: "rgba(253,230,138,.4)", background: "rgba(253,230,138,.06)" }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold" style={{ background: NEURAL_GOLD, color: "#070B1F" }}>
          ✓
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-bold" style={{ color: NEURAL_GOLD }}>
            Sello ganado · {feedback.title}
          </span>
          <span className="text-sm" style={{ color: NEURAL_TEXT }}>
            Tu palabra ahora pesa {feedback.monthsWeight} {feedback.monthsWeight === 1 ? "mes" : "meses"}.
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
      <p className="m-0 text-sm" style={{ color: NEURAL_TEXT, lineHeight: 1.5 }}>
        Gracias por ser honesto: eso también es tener palabra. Este mes no se sella, pero tus sellos anteriores siguen intactos. ¿Lo firmas de nuevo por 1 mes?
      </p>
      <button type="button" onClick={onStartRenew} className="self-start text-sm font-semibold" style={{ color: NEURAL_CYAN }}>
        Firmar de nuevo por 1 mes →
      </button>
    </div>
  );
}

function QuestionPanel({ closure, onAnswer, answering }: { closure: MonthClosure; onAnswer: (sealed: boolean) => void; answering: boolean }) {
  const { commitment, month } = closure;
  const area = commitment.area ? AREA_OF_CATEGORY[commitment.area] : null;
  const color = area ? BRAIN_AREA_COLOR[area] : "#64748B";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: NEURAL_LAVENDER, textTransform: "uppercase" }}>
          Cierre de mes · pendiente
        </span>
        {area && (
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `${color}22`, color }}>
            {BRAIN_AREA_LABEL[area]}
          </span>
        )}
      </div>
      <p className="m-0 font-reading text-lg leading-snug" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT }}>
        Tu {commitment.title} terminó el {formatDayMonth(month.endDate)}. Un mes completo. ¿Honraste tu palabra?
      </p>
      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={answering}
          onClick={() => onAnswer(true)}
          className="rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60"
          style={{ background: NEURAL_CYAN, color: "#070B1F" }}
        >
          Sí, la honré
        </button>
        <button
          type="button"
          disabled={answering}
          onClick={() => onAnswer(false)}
          className="rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-60"
          style={{ borderColor: "rgba(34,211,238,.45)", color: NEURAL_CYAN }}
        >
          No del todo
        </button>
      </div>
    </div>
  );
}

/** "Cierre de mes" (mockups 12b/12c) — preguntas de cierre pendientes, una por una, más los próximos cierres. */
export function WordMonthClosureCard({
  pendingClosures,
  upcomingClosures,
  onAnswer,
  answering,
  feedback,
  onStartRenew,
}: {
  pendingClosures: MonthClosure[];
  upcomingClosures: MonthClosure[];
  onAnswer: (commitmentId: string, monthIndex: number, sealed: boolean) => void;
  answering: boolean;
  feedback: SealFeedback | null;
  onStartRenew: () => void;
}) {
  const current = pendingClosures[0] ?? null;
  const today = todayISO();

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {feedback && <FeedbackPanel feedback={feedback} onStartRenew={onStartRenew} />}

      {current && !feedback && <QuestionPanel closure={current} answering={answering} onAnswer={(sealed) => onAnswer(current.commitment.id, current.month.monthIndex, sealed)} />}

      {(current || upcomingClosures.length > 0) && <div className="border-t" style={{ borderStyle: "dashed", borderColor: "rgba(255,255,255,0.12)" }} />}

      {upcomingClosures.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: NEURAL_LAVENDER, textTransform: "uppercase" }}>
            Próximos cierres
          </span>
          {upcomingClosures.map(({ commitment, month }) => {
            const area = commitment.area ? AREA_OF_CATEGORY[commitment.area] : null;
            const color = area ? BRAIN_AREA_COLOR[area] : "#64748B";
            const days = daysUntil(month.endDate, today);
            return (
              <div key={`${commitment.id}-${month.monthIndex}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                  <span className="truncate" style={{ color: NEURAL_TEXT }}>
                    {commitment.title} · mes {month.monthIndex}
                  </span>
                </span>
                <span className="shrink-0" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  {formatDayMonth(month.endDate)} · en {days} {days === 1 ? "día" : "días"}
                </span>
              </div>
            );
          })}
          <p className="m-0 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Sin marcas diarias: solo cierras cada mes. Si caes, puedes reportarlo cuando quieras.
          </p>
        </div>
      )}

      {!current && !feedback && upcomingClosures.length === 0 && (
        <p className="m-0 text-sm italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Todavía no tienes compromisos en curso.
        </p>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useCompleteMicroActionWithReflection,
  useLearningApplicationsWeekSummary,
  useLearnings,
  useMicroActions,
  useToggleMicroAction,
  type MicroAction,
} from "../../api/microActions";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR } from "../NeuralCore/brainTokens";
import { NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { todayISO } from "../../lib/date";

const WEEKDAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];

function originLabel(action: MicroAction): string {
  if (action.learning) return `de "${action.learning.title}"`;
  if (action.origin === "PROPOSITO") return "de tu Propósito";
  return "";
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const complete = total > 0 && done === total;
  return (
    <span
      className="flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${NEURAL_CYAN} ${pct * 360}deg, rgba(255,255,255,0.08) ${pct * 360}deg)`,
        boxShadow: complete ? `0 0 28px rgba(34,211,238,.55)` : undefined,
        transition: "box-shadow .4s ease",
      }}
      role="img"
      aria-label={`${done} de ${total} pasos de hoy`}
    >
      <span className="flex h-[78px] w-[78px] items-center justify-center rounded-full" style={{ background: "#0B0F28" }}>
        <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 28, fontWeight: 700, color: NEURAL_TEXT }}>
          {done}
          <span style={{ fontSize: 16, color: NEURAL_TEXT_SECONDARY }}>/{total}</span>
        </span>
      </span>
    </span>
  );
}

function progressPhrase(done: number, total: number): string {
  if (total === 0) return "";
  if (done === 0) return `${total === 1 ? "Un paso pequeño" : `${total === 2 ? "Dos" : total} pasos pequeños`}. Empieza por el más fácil.`;
  if (done === total) return `Hecho. ${total === 2 ? "Dos" : total} pasos pequeños, una conexión más fuerte.`;
  const remaining = total - done;
  return `${done === 1 ? "Uno" : done} hecho${done === 1 ? "" : "s"}. Falta ${remaining === 1 ? "uno pequeño" : `${remaining} pequeños`}.`;
}

function ReflectionCapture({ action, onDone }: { action: MicroAction; onDone: () => void }) {
  const [text, setText] = useState("");
  const [savedLevel, setSavedLevel] = useState<string | null>(null);
  const complete = useCompleteMicroActionWithReflection();
  const skip = useToggleMicroAction();

  function handleSave() {
    if (!text.trim()) return;
    complete.mutate(
      { id: action.id, text: text.trim() },
      { onSuccess: () => setSavedLevel("saved") },
    );
  }

  if (savedLevel) {
    return (
      <p className="m-0 mt-2 text-sm font-semibold" style={{ color: NEURAL_GOLD }}>
        ✓ Guardado en &ldquo;Cómo lo apliqué&rdquo; · tu conexión se fortaleció
      </p>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <p className="m-0 text-sm italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_LAVENDER }}>
        ¿Qué aprendiste al hacerlo? Una línea basta.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          autoFocus
          className="min-w-0 flex-1 rounded-xl p-2.5 text-sm"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.16)", color: NEURAL_TEXT }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Lo que aprendiste al hacerlo"
        />
        <button
          type="button"
          disabled={complete.isPending || !text.trim()}
          onClick={handleSave}
          className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60"
          style={{ background: NEURAL_CYAN, color: "#070B1F" }}
        >
          Guardar
        </button>
        <button
          type="button"
          disabled={skip.isPending}
          onClick={() => {
            skip.mutate({ id: action.id, completed: true }, { onSuccess: onDone });
          }}
          className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold"
          style={{ color: NEURAL_TEXT_SECONDARY }}
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}

function ActionRow({ action }: { action: MicroAction }) {
  const [reflecting, setReflecting] = useState(false);
  const toggle = useToggleMicroAction();
  const area = action.learning ? AREA_OF_CATEGORY[action.learning.area] : null;
  const dotColor = area ? BRAIN_AREA_COLOR[area] : NEURAL_LAVENDER.toString();

  function handleToggle() {
    if (action.completed) {
      toggle.mutate({ id: action.id, completed: false });
      return;
    }
    if (action.learning) {
      setReflecting(true);
      return;
    }
    toggle.mutate({ id: action.id, completed: true });
  }

  return (
    <div className="rounded-xl px-2 py-3">
      <div className="flex items-start gap-3.5">
        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={action.completed}
          aria-label={action.completed ? "Marcar como no hecha" : "Marcar como hecha"}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold"
          style={
            action.completed
              ? { background: NEURAL_CYAN, borderColor: NEURAL_CYAN, color: "#070B1F", boxShadow: "0 0 10px rgba(34,211,238,.6)" }
              : { background: "transparent", borderColor: NEURAL_CYAN, color: "transparent" }
          }
        >
          ✓
        </button>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold" style={{ color: NEURAL_TEXT }}>
            {action.text}
          </p>
          {originLabel(action) && (
            <p className="m-0 mt-1 flex items-center gap-1.5 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} aria-hidden />
              {originLabel(action)}
            </p>
          )}
          {reflecting && !action.completed && <ReflectionCapture action={action} onDone={() => setReflecting(false)} />}
        </div>
      </div>
    </div>
  );
}

function WeekStrip() {
  const { data: summary } = useLearningApplicationsWeekSummary();
  if (!summary) return null;

  const today = todayISO();
  const maxCount = Math.max(1, ...Object.values(summary.byDay));

  return (
    <div className="flex flex-wrap items-center gap-6 rounded-2xl px-5 py-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
          Esta semana
        </span>
        <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 22, fontWeight: 700, color: NEURAL_TEXT }}>
          {summary.total} <span style={{ fontSize: 13, fontWeight: 600, color: NEURAL_TEXT_SECONDARY }}>aplicaciones</span>
        </span>
      </div>
      <div className="flex flex-1 items-center justify-between gap-2">
        {Object.entries(summary.byDay).map(([dateISO, count], i) => {
          const isFuture = dateISO > today;
          const isToday = dateISO === today;
          const intensity = count === 0 ? 0 : Math.min(1, 0.35 + 0.65 * (count / maxCount));
          return (
            <div key={dateISO} className="flex flex-col items-center gap-1.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                style={
                  isFuture
                    ? { border: "1px dashed rgba(255,255,255,0.18)", color: NEURAL_TEXT_SECONDARY }
                    : {
                        background: count > 0 ? `rgba(34,211,238,${intensity})` : "rgba(255,255,255,0.06)",
                        color: count > 0 ? "#070B1F" : NEURAL_TEXT_SECONDARY,
                        boxShadow: isToday ? "0 0 0 2px #FFFFFF" : undefined,
                      }
                }
              >
                {isFuture ? "" : count}
              </span>
              <span className="text-[11px]" style={{ color: NEURAL_TEXT_SECONDARY }}>
                {WEEKDAY_LETTERS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StrongestConnectionCta() {
  const { data: learnings } = useLearnings();
  const strongest = (learnings ?? []).filter((l) => l.applicationsCount > 0).sort((a, b) => b.applicationsCount - a.applicationsCount)[0];
  if (!strongest) return null;

  const title = strongest.title.length > 40 ? `${strongest.title.slice(0, 40)}…` : strongest.title;

  return (
    <Link
      to={`/microacciones?vista=aprendizajes&learning=${strongest.id}&tab=aplicaciones`}
      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-5 py-3.5 text-sm"
      style={{ border: "1px dashed rgba(34,211,238,.45)", color: NEURAL_TEXT }}
    >
      <span>
        Tu conexión más fuerte: &ldquo;{title}&rdquo; · {strongest.applicationsCount} aplicaciones
      </span>
      <span className="font-bold" style={{ color: NEURAL_CYAN }}>
        Ver →
      </span>
    </Link>
  );
}

/** "Hoy" (mockups 14/14b) — pasos pequeños del día, con la reflexión capturada en el momento (reemplaza la vieja "Revisión del día"). */
export function TodayView() {
  const { data: actions, isLoading } = useMicroActions();

  const items = actions ?? [];
  const done = items.filter((a) => a.completed).length;
  const total = items.length;

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <div className="flex flex-col gap-5 rounded-[24px] p-7" style={{ background: "linear-gradient(160deg, rgba(34,211,238,0.08), rgba(11,15,40,0.4))", border: "1px solid rgba(34,211,238,.22)" }}>
        {total === 0 ? (
          !isLoading && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
                Tus pasos pequeños de hoy
              </span>
              <p className="m-0 font-reading text-lg italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT }}>
                Hoy no tienes pasos programados.{" "}
                <Link to="/microacciones?vista=aprendizajes" style={{ color: NEURAL_CYAN }}>
                  Elige uno de tus aprendizajes →
                </Link>
              </p>
            </div>
          )
        ) : (
          <>
            <div className="flex items-center gap-4">
              <ProgressRing done={done} total={total} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
                  Tus pasos pequeños de hoy
                </span>
                <p className="m-0 font-reading text-xl italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT }}>
                  {progressPhrase(done, total)}
                </p>
              </div>
            </div>

            <div className="flex flex-col divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {items.map((action) => (
                <div key={action.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="first:border-t-0">
                  <ActionRow action={action} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <WeekStrip />
      <StrongestConnectionCta />
    </div>
  );
}

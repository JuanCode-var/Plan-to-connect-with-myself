import { useState } from "react";
import { useReportWoopResult, useWoopPlans, type WoopPlan } from "../../api/microActions";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR } from "../NeuralCore/brainTokens";
import { NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { HABIT_CATEGORY_LABELS, type HabitCategory } from "../../domain";
import { todayISO } from "../../lib/date";
import { cleanPlanIf, splitPlanThen } from "../../lib/woopPlanText";
import { WoopFlow } from "../WoopFlow";

type Step = "wish" | "outcome" | "obstacle" | "plan";
const STEPS: Step[] = ["wish", "outcome", "obstacle", "plan"];
const STEP_LETTER: Record<Step, string> = { wish: "W", outcome: "O", obstacle: "O", plan: "P" };
const STEP_NAME: Record<Step, string> = { wish: "Deseo", outcome: "Resultado", obstacle: "Obstáculo", plan: "Plan" };

const LABEL_TO_CATEGORY: Record<string, HabitCategory> = Object.fromEntries(
  Object.entries(HABIT_CATEGORY_LABELS).map(([cat, label]) => [label, cat as HabitCategory]),
);
const AREA_LABEL_PATTERN = Object.values(HABIT_CATEGORY_LABELS).join("|");

function summarize(text: string, max = 32): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max).trim()}…` : oneLine;
}

type ResultSection = { label: string; color: string; text: string };

/** Si el RESULTADO tiene líneas "Económico: ...", "Mental: ...", etc., las separa en bloques de 2 columnas + la frase de cierre "Lo más importante: ..." aparte. Si no, `null` (se muestra el texto completo tal cual). */
function parseResult(text: string): { intro: string; sections: ResultSection[]; closing: string | null } | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const sectionRe = new RegExp(`^(${AREA_LABEL_PATTERN}):\\s*(.*)$`);
  const sectionLines = lines.filter((l) => sectionRe.test(l));
  if (sectionLines.length === 0) return null;

  const introLines: string[] = [];
  const sections: ResultSection[] = [];
  let closing: string | null = null;

  for (const line of lines) {
    const sectionMatch = line.match(sectionRe);
    if (sectionMatch) {
      const category = LABEL_TO_CATEGORY[sectionMatch[1]];
      sections.push({ label: sectionMatch[1], color: BRAIN_AREA_COLOR[AREA_OF_CATEGORY[category]], text: sectionMatch[2] });
      continue;
    }
    const closingMatch = line.match(/^lo más importante:\s*(.*)$/i);
    if (closingMatch) {
      closing = closingMatch[1];
      continue;
    }
    if (sections.length === 0) introLines.push(line);
  }

  return { intro: introLines.join(" "), sections, closing };
}

function Stepper({ step, onSelect, plan }: { step: Step; onSelect: (s: Step) => void; plan: WoopPlan }) {
  const summaries: Record<Step, string> = {
    wish: summarize(plan.desire),
    outcome: summarize(plan.result),
    obstacle: summarize(plan.obstacle),
    plan: summarize(`${cleanPlanIf(plan.planIf)} → ${splitPlanThen(plan.planThen).main}`),
  };

  return (
    <div className="flex gap-3 overflow-x-auto lg:w-[280px] lg:flex-col lg:gap-0 lg:overflow-visible">
      {STEPS.map((s, i) => {
        const active = s === step;
        return (
          <div key={s} className="relative flex shrink-0 gap-3 lg:pb-7">
            {i < STEPS.length - 1 && <span className="absolute top-10 bottom-0 left-5 hidden w-px lg:block" style={{ background: "rgba(255,255,255,0.1)" }} aria-hidden />}
            <button
              type="button"
              onClick={() => onSelect(s)}
              className="flex items-start gap-3 rounded-2xl p-2.5 text-left"
              style={active ? { background: "rgba(34,211,238,.08)", border: "1px solid rgba(34,211,238,.35)" } : { border: "1px solid transparent" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold"
                style={active ? { background: NEURAL_CYAN, color: "#070B1F" } : { background: "rgba(255,255,255,0.06)", color: NEURAL_TEXT }}
              >
                {STEP_LETTER[s]}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1px" }}>
                  {STEP_NAME[s]}
                </span>
                <span className="truncate text-sm" style={{ color: NEURAL_TEXT_SECONDARY, maxWidth: 180 }}>
                  {summaries[s]}
                </span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function StepPanel({ step, plan }: { step: Step; plan: WoopPlan }) {
  if (step === "wish") {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
          Lo que deseo
        </span>
        <p className="m-0 font-reading text-2xl" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.4 }}>
          {plan.desire}
        </p>
        <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Concreto, con fecha y alcanzable con esfuerzo.
        </p>
      </div>
    );
  }

  if (step === "outcome") {
    const parsed = parseResult(plan.result);
    return (
      <div className="flex flex-col gap-4">
        {parsed ? (
          <>
            {parsed.intro && (
              <p className="m-0 font-reading text-lg" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.5 }}>
                {parsed.intro}
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {parsed.sections.map((s) => (
                <div key={s.label} className="flex flex-col gap-1.5 rounded-xl p-4" style={{ background: `${s.color}10`, border: `1px solid ${s.color}40` }}>
                  <span className="text-xs font-bold tracking-wide uppercase" style={{ color: s.color, letterSpacing: "1px" }}>
                    {s.label}
                  </span>
                  <span className="text-sm" style={{ color: NEURAL_TEXT, lineHeight: 1.5 }}>
                    {s.text}
                  </span>
                </div>
              ))}
            </div>
            {parsed.closing && (
              <p className="m-0 font-reading text-base italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_GOLD, lineHeight: 1.5 }}>
                Lo más importante: {parsed.closing}
              </p>
            )}
          </>
        ) : (
          <p className="m-0 font-reading text-lg" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.5 }}>
            {plan.result}
          </p>
        )}
      </div>
    );
  }

  if (step === "obstacle") {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
          Lo que me frena
        </span>
        <p className="m-0 font-reading text-2xl" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.4 }}>
          {plan.obstacle}
        </p>
        <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Nombrar el obstáculo no es rendirse: es saber exactamente dónde poner el plan.
        </p>
      </div>
    );
  }

  return <PlanStep plan={plan} />;
}

function PlanStep({ plan }: { plan: WoopPlan }) {
  const reportResult = useReportWoopResult();
  const [localResponse, setLocalResponse] = useState<"worked" | "not-worked" | null>(null);
  const { main, twoMinuteNote } = splitPlanThen(plan.planThen);

  const today = todayISO();
  const answeredToday = plan.lastResultDate && plan.lastResultDate.slice(0, 10) === today;
  const response = localResponse ?? (answeredToday ? "worked" : null);

  function answer(worked: boolean) {
    setLocalResponse(worked ? "worked" : "not-worked");
    reportResult.mutate({ id: plan.id, worked });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_TEXT_SECONDARY, letterSpacing: "1.5px" }}>
          Si…
        </span>
        <p className="m-0 mt-1 text-lg" style={{ color: NEURAL_TEXT }}>
          {cleanPlanIf(plan.planIf)},
        </p>
      </div>
      <div className="rounded-xl p-4" style={{ background: "rgba(34,211,238,.06)", border: "1px solid rgba(34,211,238,.3)" }}>
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_CYAN, letterSpacing: "1.5px" }}>
          Entonces…
        </span>
        <p className="m-0 mt-1 text-lg" style={{ color: NEURAL_TEXT }}>
          {main}
        </p>
        {twoMinuteNote && (
          <p className="m-0 mt-1.5 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {twoMinuteNote}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-semibold" style={{ color: NEURAL_TEXT }}>
          ¿Usaste el plan hoy?
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={reportResult.isPending || !!answeredToday}
            onClick={() => answer(true)}
            className="rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-60"
            style={{ background: NEURAL_CYAN, color: "#070B1F" }}
          >
            Sí, y funcionó
          </button>
          <button
            type="button"
            disabled={reportResult.isPending || !!answeredToday}
            onClick={() => answer(false)}
            className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-60"
            style={{ borderColor: "rgba(34,211,238,.45)", color: NEURAL_CYAN }}
          >
            Lo usé, pero no funcionó
          </button>
        </div>
      </div>

      {response && (
        <p className="m-0 text-sm font-semibold" style={{ color: NEURAL_GOLD }}>
          {response === "worked"
            ? "Funcionó. Cada vez que el “si” dispara el “entonces”, el plan se vuelve más automático."
            : "Gracias por ser honesto. ¿Ajustamos el “entonces” para que sea aún más pequeño?"}
        </p>
      )}
    </div>
  );
}

/** "Plan WOOP" (mockups 14f/14g) — stepper vertical W·O·O·P + panel del paso activo, en vez de la tarjeta plana de 4 bloques. */
export function WoopView() {
  const { data: plans, isLoading } = useWoopPlans();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("plan");
  const [showNewFlow, setShowNewFlow] = useState(false);

  if (isLoading) return null;

  if (!plans || plans.length === 0) {
    return (
      <>
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed p-7" style={{ borderColor: "rgba(34,211,238,.35)" }}>
          <p className="m-0 text-sm italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Todavía no armaste ningún plan WOOP — armalo cuando sientas un bloqueo puntual.
          </p>
          <button type="button" onClick={() => setShowNewFlow(true)} className="rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: NEURAL_CYAN, color: "#070B1F" }}>
            + Nuevo plan WOOP
          </button>
        </div>
        {showNewFlow && <WoopFlow onClose={() => setShowNewFlow(false)} />}
      </>
    );
  }

  const plan = plans.find((p) => p.id === selectedId) ?? plans[0];

  return (
    <div className="flex flex-col gap-5">
      {plans.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold"
              style={p.id === plan.id ? { background: NEURAL_CYAN, color: "#070B1F" } : { background: "rgba(255,255,255,0.05)", color: NEURAL_TEXT_SECONDARY }}
            >
              {p.title ?? summarize(p.desire, 28)}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
            Mi plan WOOP
          </span>
          <h2 className="m-0 text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
            {plan.title ?? plan.desire}
          </h2>
        </div>
        <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Usado {plan.timesUsed} {plan.timesUsed === 1 ? "vez" : "veces"} · funcionó {plan.timesWorked} de {plan.timesUsed}
        </span>
      </div>

      <div className="micro-view-in flex flex-col gap-5 lg:flex-row lg:items-start" key={`${plan.id}-${step}`}>
        <Stepper step={step} onSelect={setStep} plan={plan} />
        <div className="min-h-[420px] min-w-0 flex-1 rounded-[22px] p-6 sm:p-7" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <StepPanel step={step} plan={plan} />
        </div>
      </div>
    </div>
  );
}

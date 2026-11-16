import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useCreateMicroAction,
  useLearningApplications,
  useLearningDetail,
  useMicroActionsByLearning,
  useOrderLearning,
  useToggleMicroAction,
} from "../../api/microActions";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR } from "../NeuralCore/brainTokens";
import { NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";

function formatFullDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

function dayLabel(dateISO: string): string {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const d = dateISO.slice(0, 10);
  if (d === todayISO) return "Hoy";
  const [, month, day] = d.split("-");
  return `${day}/${month}`;
}

const SUGGESTED_FIRST_ACTIONS = ["+ Escribir una línea sobre esto", "+ Compartirlo con alguien hoy"];

function MicroActionsTab({ learningId }: { learningId: string }) {
  const { data: actions } = useMicroActionsByLearning(learningId);
  const { data: detail } = useLearningDetail(learningId);
  const toggle = useToggleMicroAction();
  const createMicroAction = useCreateMicroAction();
  const orderLearning = useOrderLearning();
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [justOrdered, setJustOrdered] = useState(false);

  const items = actions ?? [];
  const hasIssues = detail && (detail.duplicateExtras > 0 || detail.notesCount > 0);

  function handleAdd() {
    if (!newText.trim()) return;
    createMicroAction.mutate(
      { learningId, text: newText.trim() },
      { onSuccess: () => { setNewText(""); setAdding(false); } },
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hasIssues && !justOrdered && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5" style={{ background: "rgba(34,211,238,.06)", border: "1px solid rgba(34,211,238,.25)" }}>
          <span className="text-sm" style={{ color: NEURAL_TEXT }}>
            Hay {detail.duplicateExtras} {detail.duplicateExtras === 1 ? "micro acción repetida" : "micro acciones repetidas"}
            {detail.notesCount > 0 && ` y ${detail.notesCount} ${detail.notesCount === 1 ? "nota guardada" : "notas guardadas"} como acción`}.
          </span>
          <button
            type="button"
            disabled={orderLearning.isPending}
            onClick={() => orderLearning.mutate(learningId, { onSuccess: () => setJustOrdered(true) })}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-60"
            style={{ background: NEURAL_CYAN, color: "#070B1F" }}
          >
            {orderLearning.isPending ? "Ordenando…" : "Ordenar"}
          </button>
        </div>
      )}
      {justOrdered && (
        <p className="m-0 text-sm font-semibold" style={{ color: NEURAL_GOLD }}>
          ✓ Listo: unificamos las repetidas y movimos la nota a &ldquo;Cómo lo apliqué&rdquo;.
        </p>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed p-5" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
          <p className="m-0 text-sm italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Aún no tiene micro acciones. ¿Qué paso pequeño lo pondría en práctica mañana?
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_FIRST_ACTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => createMicroAction.mutate({ learningId, text: s.replace(/^\+\s*/, "") })}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: "rgba(34,211,238,.35)", color: NEURAL_CYAN }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((a) =>
            a.isLikelyNote ? (
              <div key={a.id} className="rounded-xl border border-dashed px-3.5 py-3 text-sm italic" style={{ borderColor: "rgba(255,255,255,0.18)", color: NEURAL_TEXT_SECONDARY }}>
                {a.text}
              </div>
            ) : (
              <label key={a.id} className="flex min-h-11 items-center gap-3 rounded-xl px-1.5 py-1.5 text-[15px]" style={{ color: a.completed ? "#A9B1D6" : NEURAL_TEXT }}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={a.completed}
                  onClick={() => toggle.mutate({ id: a.id, completed: !a.completed })}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold"
                  style={a.completed ? { background: NEURAL_CYAN, borderColor: NEURAL_CYAN, color: "#070B1F" } : { borderColor: "rgba(255,255,255,0.25)", color: "transparent" }}
                >
                  ✓
                </button>
                {a.text}
              </label>
            ),
          )}
        </div>
      )}

      {adding ? (
        <div className="flex flex-wrap gap-2">
          <input
            autoFocus
            className="min-w-0 flex-1 rounded-xl p-2.5 text-sm"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.16)", color: NEURAL_TEXT }}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Un paso chico y concreto"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button type="button" disabled={createMicroAction.isPending || !newText.trim()} onClick={handleAdd} className="rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60" style={{ background: NEURAL_CYAN, color: "#070B1F" }}>
            Agregar
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="rounded-xl border border-dashed py-3 text-sm font-bold" style={{ borderColor: "rgba(34,211,238,.35)", color: NEURAL_CYAN }}>
          + Agregar micro acción
        </button>
      )}
    </div>
  );
}

function ApplicationsTab({ learningId }: { learningId: string }) {
  const { data: applications } = useLearningApplications(learningId);
  const [showAll, setShowAll] = useState(false);

  const items = applications ?? [];
  if (items.length === 0) {
    return (
      <p className="m-0 text-sm italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Todavía no hay aplicaciones. La primera vez que hagas una de sus micro acciones, acá va a quedar lo que aprendiste.
      </p>
    );
  }

  const visible = showAll ? items : items.slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      {visible.map((app, i) => (
        <div key={app.id} className="flex gap-3.5" style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 } : undefined}>
          <span className="w-14 shrink-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {dayLabel(app.date)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="m-0 font-reading text-base" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.5 }}>
              {app.response}
            </p>
            {(app.habit?.name || app.context) && (
              <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                mientras: {app.habit?.name ?? app.context}
              </span>
            )}
          </div>
        </div>
      ))}
      {!showAll && items.length > 4 && (
        <button type="button" onClick={() => setShowAll(true)} className="self-start text-sm font-semibold" style={{ color: NEURAL_CYAN }}>
          Ver las {items.length} aplicaciones →
        </button>
      )}
    </div>
  );
}

/** Panel de detalle de un aprendizaje (mockups 14c/14d/14e): LA IDEA, dato motivador, y las pestañas Micro acciones/Cómo lo apliqué. */
export function LearningDetailPanel({ learningId }: { learningId: string }) {
  const { data: learning } = useLearningDetail(learningId);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: "acciones" | "aplicaciones" = tabParam === "aplicaciones" ? "aplicaciones" : "acciones";

  function setTab(next: "acciones" | "aplicaciones") {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    setSearchParams(params);
  }

  if (!learning) return null;

  const area = AREA_OF_CATEGORY[learning.area];
  const areaColor = BRAIN_AREA_COLOR[area];
  const idea = learning.keyIdea ?? learning.derivedIdea?.text ?? null;

  return (
    <div className="micro-view-in flex flex-col gap-5 rounded-[22px] p-6 sm:p-7" style={{ background: `linear-gradient(160deg, ${areaColor}14, rgba(11,15,40,0.5))`, border: `1px solid ${areaColor}33` }}>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
          La idea
        </span>
        {idea ? (
          <p className="m-0 font-reading text-xl italic sm:text-[21px]" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.5 }}>
            &ldquo;{idea}&rdquo;
          </p>
        ) : (
          <p className="m-0 text-sm italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Todavía no agregaste una idea clave para este aprendizaje.
          </p>
        )}
        <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Aprendido el {formatFullDate(learning.createdAt)}
          {learning.derivedIdea ? ` · ${learning.derivedIdea.label}` : learning.source ? ` · ${learning.source}` : ""}
        </span>
      </div>

      {learning.insight && (
        <p className="m-0 border-l-2 pl-3.5 text-sm" style={{ borderColor: NEURAL_CYAN, color: NEURAL_TEXT, lineHeight: 1.6 }}>
          {learning.insight}
        </p>
      )}

      <div className="flex gap-2 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <button
          type="button"
          onClick={() => setTab("acciones")}
          className="rounded-full px-4 py-2 text-sm font-bold"
          style={tab === "acciones" ? { background: NEURAL_CYAN, color: "#070B1F" } : { color: NEURAL_TEXT_SECONDARY }}
        >
          Micro acciones ({learning.microActionsCount})
        </button>
        <button
          type="button"
          onClick={() => setTab("aplicaciones")}
          className="rounded-full px-4 py-2 text-sm font-bold"
          style={tab === "aplicaciones" ? { background: NEURAL_CYAN, color: "#070B1F" } : { color: NEURAL_TEXT_SECONDARY }}
        >
          Cómo lo apliqué ({learning.applicationsCount})
        </button>
      </div>

      {tab === "acciones" ? <MicroActionsTab learningId={learningId} /> : <ApplicationsTab learningId={learningId} />}
    </div>
  );
}

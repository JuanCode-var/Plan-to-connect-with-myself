import { useEffect, useRef, useState } from "react";
import { useCreateLearningApplication, type Learning } from "../api/microActions";
import { HABIT_CATEGORY_LABELS, type ApplicationType, type HabitCategory } from "../domain";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR } from "./NeuralCore/brainTokens";
import {
  NEURAL_BG,
  NEURAL_CARD_BG,
  NEURAL_CARD_BORDER,
  NEURAL_CYAN,
  NEURAL_TEXT,
  NEURAL_TEXT_SECONDARY,
} from "./NeuralCore/tokens";

function CheckIcon({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function lowercaseFirst(text: string): string {
  return text.length > 0 ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

/**
 * "¿Cómo lo aplicaste?" — lanzado desde TrackerMatrix al marcar cumplido un
 * hábito Mental/Emocional (ver applyLearningTriggers.ts para el throttle de
 * "máximo una vez por hábito por día"). Ya no crea una micro acción para
 * mañana al guardar — esa casilla duplicaba datos entre MicroAction y
 * Application (causa raíz del bug de duplicados, ver Paso 1 de Micro
 * Acciones); esto es solo una reflexión. Foco atrapado a mano: no hay ningún
 * helper de focus-trap en el repo, y esto no amerita sumar una librería nueva.
 */
export function ApplyLearningModal({
  habitId,
  habitName,
  habitCategory,
  learning,
  onClose,
}: {
  habitId: string;
  habitName: string;
  habitCategory: HabitCategory;
  learning: Learning;
  onClose: () => void;
}) {
  const [type, setType] = useState<ApplicationType>("APPLIED");
  const [response, setResponse] = useState("");
  const createApplication = useCreateLearningApplication();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const areaColor = BRAIN_AREA_COLOR[AREA_OF_CATEGORY[habitCategory]];

  useEffect(() => {
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;

      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSave() {
    if (!response.trim()) return;
    createApplication.mutate(
      { habitId, learningId: learning.id, type, response: response.trim() },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(5,5,9,0.72)", backdropFilter: "blur(6px)" }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="aplicar-titulo"
        className="flex w-full max-w-[500px] flex-col gap-5 rounded-[24px] border p-7"
        style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="flex items-center gap-3 rounded-2xl border px-3.5 py-3" style={{ background: `${areaColor}14`, borderColor: `${areaColor}40` }}>
          <CheckIcon color={areaColor} />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold">{habitName}</span>
            <span className="text-xs" style={{ color: areaColor }}>
              Cumplido · área {HABIT_CATEGORY_LABELS[habitCategory]}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: "#C4B5FD" }}>
            Del saber al hacer
          </span>
          <h2
            id="aplicar-titulo"
            className="m-0 text-2xl leading-tight font-extrabold"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            ¿Cómo aplicaste hoy lo que aprendiste sobre {lowercaseFirst(learning.title)}?
          </h2>
        </div>

        <div role="group" aria-label="Tipo de respuesta" className="grid grid-cols-2 gap-2 rounded-2xl p-1" style={{ background: NEURAL_CARD_BG }}>
          <button
            type="button"
            aria-pressed={type === "APPLIED"}
            onClick={() => setType("APPLIED")}
            className="h-11 rounded-[10px] text-sm font-bold"
            style={{ background: type === "APPLIED" ? NEURAL_CYAN : "transparent", color: type === "APPLIED" ? "#070B1F" : NEURAL_TEXT_SECONDARY }}
          >
            Ya lo apliqué
          </button>
          <button
            type="button"
            aria-pressed={type === "WILL_APPLY"}
            onClick={() => setType("WILL_APPLY")}
            className="h-11 rounded-[10px] text-sm font-bold"
            style={{ background: type === "WILL_APPLY" ? NEURAL_CYAN : "transparent", color: type === "WILL_APPLY" ? "#070B1F" : NEURAL_TEXT_SECONDARY }}
          >
            Lo aplicaré
          </button>
        </div>

        <label className="flex flex-col gap-2 text-[13px]" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Tu respuesta
          <textarea
            rows={4}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="resize-none rounded-2xl border p-3.5 text-[15px] leading-relaxed font-reading"
            style={{ background: NEURAL_CARD_BG, borderColor: "rgba(34,211,238,.35)", color: NEURAL_TEXT, fontFamily: "'Lora', Georgia, serif" }}
            autoFocus
          />
        </label>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border text-sm font-bold"
            style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT_SECONDARY, background: "transparent" }}
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={createApplication.isPending || !response.trim()}
            className="h-12 flex-[2] rounded-xl text-sm font-bold disabled:opacity-60"
            style={{ background: NEURAL_CYAN, color: "#070B1F" }}
          >
            {createApplication.isPending ? "Guardando…" : "Guardar en 'Cómo lo apliqué'"}
          </button>
        </div>
      </div>
    </div>
  );
}

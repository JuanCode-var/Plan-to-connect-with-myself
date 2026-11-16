import { useState } from "react";
import { Link } from "react-router-dom";
import { useCreateJournalEntry } from "../api/journal";
import { useCreateLearning } from "../api/microActions";
import { JournalDatePicker } from "./JournalDatePicker";
import { DIARIO_SECTION_COLORS } from "../domain";
import { NEURAL_BG, NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { todayISO } from "../lib/date";

const SOURCES = ["Libro", "Podcast", "Conversación", "Experiencia", "Biblioteca"] as const;

function truncateTitle(text: string, maxLen = 70): string {
  const trimmed = text.trim();
  return trimmed.length <= maxLen ? trimmed : `${trimmed.slice(0, maxLen).trim()}…`;
}

type SavedReflection = { text: string; learningId: string | null };

/**
 * "Conocimientos" (mockups 17d/17e) — la pestaña conserva el título de
 * tarjeta "Conocimientos y reflexiones" (pedido explícito, aunque la
 * pestaña en sí se llame "Conocimientos"). Sin tarjeta propia: el borde y
 * fondo vienen del wrapper compartido en Journal.tsx.
 */
export function KnowledgeCard() {
  const [date, setDate] = useState(todayISO());
  const [content, setContent] = useState("");
  const [source, setSource] = useState<(typeof SOURCES)[number] | null>(null);
  const [actionable, setActionable] = useState(true);
  const [saved, setSaved] = useState<SavedReflection | null>(null);

  const createEntry = useCreateJournalEntry();
  const createLearning = useCreateLearning();

  const saving = createEntry.isPending || createLearning.isPending;

  async function handleSave() {
    const text = content.trim();
    if (!text) return;

    let learningId: string | null = null;
    if (actionable) {
      const learning = await createLearning.mutateAsync({
        title: truncateTitle(text),
        keyIdea: text,
        source: source ?? undefined,
        area: "MENTAL",
      });
      learningId = learning.id;
    }

    await createEntry.mutateAsync({
      date,
      knowledge: text,
      source: source ?? undefined,
      learningId: learningId ?? undefined,
    });

    setSaved({ text, learningId });
  }

  function reset() {
    setDate(todayISO());
    setContent("");
    setSource(null);
    setActionable(true);
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
          <h2 className="font-display m-0 text-xl font-bold" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
            Reflexión guardada
          </h2>
        </div>

        <p
          className="font-reading m-0 border-l-2 pl-4 text-lg italic"
          style={{ fontFamily: "'Lora', Georgia, serif", borderColor: DIARIO_SECTION_COLORS.knowledge, color: NEURAL_TEXT, lineHeight: 1.5 }}
        >
          “{saved.text}”
        </p>

        {saved.learningId && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            style={{ borderColor: "rgba(34,211,238,.35)", background: "rgba(34,211,238,.06)" }}
          >
            <p className="m-0 text-sm" style={{ color: NEURAL_TEXT }}>
              Ahora es un aprendizaje en Micro acciones. Elige su primer paso pequeño para mañana.
            </p>
            <Link
              to={`/microacciones?vista=aprendizajes&learning=${saved.learningId}`}
              className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold"
              style={{ background: NEURAL_CYAN, color: "#070B1F" }}
            >
              Elegir paso →
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={reset}
          className="self-start rounded-xl border px-4 py-2 text-sm font-bold"
          style={{ borderColor: "rgba(34,211,238,.45)", color: NEURAL_CYAN }}
        >
          Escribir otra
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: NEURAL_LAVENDER }}>
          Conocimientos y reflexiones
        </span>
        <JournalDatePicker date={date} onChange={setDate} />
      </div>

      <h2 className="font-display m-0 text-2xl font-bold sm:text-[28px]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
        ¿Qué aprendiste o descubriste hoy?
      </h2>

      <textarea
        autoFocus
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="font-reading resize-none rounded-xl border p-4 text-lg leading-relaxed"
        style={{ background: NEURAL_BG, borderColor: "rgba(34,211,238,.35)", color: NEURAL_TEXT, fontFamily: "'Lora', Georgia, serif" }}
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          ¿De dónde vino? (opcional)
        </span>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => {
            const selected = source === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSource(selected ? null : s)}
                className="rounded-full border px-3.5 py-1.5 text-sm font-semibold"
                style={
                  selected
                    ? { background: NEURAL_CYAN, borderColor: NEURAL_CYAN, color: "#070B1F" }
                    : { borderColor: "rgba(255,255,255,.14)", color: NEURAL_TEXT }
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex min-h-11 items-center gap-3 rounded-xl p-3.5" style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.1)" }}>
        <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
          <input type="checkbox" checked={actionable} onChange={(e) => setActionable(e.target.checked)} className="peer sr-only" />
          <span
            className="absolute inset-0 rounded-full transition-colors"
            style={{ background: actionable ? NEURAL_CYAN : "rgba(255,255,255,.18)" }}
            aria-hidden
          />
          <span
            className="absolute h-4.5 w-4.5 rounded-full bg-white transition-transform"
            style={{ transform: actionable ? "translateX(22px)" : "translateX(2px)" }}
            aria-hidden
          />
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-bold" style={{ color: NEURAL_TEXT }}>
            Llevarlo a la acción
          </span>
          <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Lo agrega a Micro acciones como aprendizaje para que lo practiques.
          </span>
        </span>
      </label>

      <button
        type="button"
        disabled={saving || !content.trim()}
        onClick={handleSave}
        className="self-start rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40"
        style={{ background: NEURAL_CYAN, color: "#070B1F" }}
      >
        {saving ? "Guardando…" : "Guardar reflexión"}
      </button>

      {(createEntry.isError || createLearning.isError) && (
        <p className="text-sm" style={{ color: "#F87171" }}>
          No se pudo guardar la reflexión.
        </p>
      )}
    </div>
  );
}

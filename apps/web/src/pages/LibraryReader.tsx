import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLibrary, useBookReadingProgress, useUpdateReadingProgress, parseLibraryIdeas } from "../api/library";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR } from "../components/NeuralCore/brainTokens";
import { NEURAL_BG, NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_FONT_READING, NEURAL_TEXT_SECONDARY } from "../components/NeuralCore/tokens";

type ReaderTab = "IDEA" | "IDEAS" | "RESUMEN";
const TAB_LABELS: Record<ReaderTab, string> = { IDEA: "En una frase", IDEAS: "Ideas clave", RESUMEN: "Resumen" };

function EmptyNote({ text }: { text: string }) {
  return (
    <p className="m-0 italic" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, color: NEURAL_TEXT_SECONDARY }}>
      {text}
    </p>
  );
}

/**
 * "Lector" (/library/leer/:id) — reemplaza el placeholder de LibraryComingSoon
 * para LIBRO. Muestra lo que ya escribiste del libro (idea en una frase,
 * hasta 5 ideas clave, resumen) en 3 pestañas — nunca inventa contenido que
 * falte, solo avisa que todavía no se escribió (mismo criterio que
 * `idea`/`ideasJson`/`resumen` en schema.prisma: contenido real del usuario).
 */
export function LibraryReader() {
  const { id } = useParams<{ id: string }>();
  const { data: entries } = useLibrary("LIBRO");
  const { data: progressList } = useBookReadingProgress();
  const updateProgress = useUpdateReadingProgress();

  const entry = entries?.find((e) => e.id === id);
  const progress = progressList?.find((p) => p.entryId === id);
  const [tab, setTab] = useState<ReaderTab>(progress?.tab ?? "IDEA");
  const [ideaIndex, setIdeaIndex] = useState(progress?.currentIdeaIndex ?? 0);

  if (!entries || !entry) {
    return (
      <div className="flex min-h-full items-center justify-center" style={{ background: "#070B1F" }}>
        <p style={{ color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>Cargando libro…</p>
      </div>
    );
  }

  const area = entry.area ? AREA_OF_CATEGORY[entry.area] : null;
  const color = area ? BRAIN_AREA_COLOR[area] : "#64748B";
  const ideas = parseLibraryIdeas(entry);
  const status = progress?.status ?? "NUEVO";

  function changeTab(next: ReaderTab) {
    setTab(next);
    updateProgress.mutate({ entryId: entry!.id, data: { tab: next, status: status === "NUEVO" ? "EN_PROGRESO" : undefined } });
  }

  function goToIdea(next: number) {
    const clamped = Math.max(0, Math.min(ideas.length - 1, next));
    setIdeaIndex(clamped);
    updateProgress.mutate({
      entryId: entry!.id,
      data: { currentIdeaIndex: clamped, percent: ideas.length > 0 ? Math.round(((clamped + 1) / ideas.length) * 100) : undefined },
    });
  }

  function markRead() {
    updateProgress.mutate({ entryId: entry!.id, data: { status: "LEIDO", percent: 100 } });
  }

  return (
    <div
      className="min-h-full px-4 py-8 sm:px-8"
      style={{ background: NEURAL_BG }}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link to="/library" className="text-sm font-semibold" style={{ color: "#22D3EE" }}>
          ← Biblioteca
        </Link>

        <div className="flex flex-col gap-1">
          <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: "#FFFFFF" }}>
            {entry.title ?? "Sin título"}
          </span>
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, color: NEURAL_TEXT_SECONDARY }}>
            {entry.author ?? "Autor por confirmar"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(TAB_LABELS) as ReaderTab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => changeTab(t)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 999,
                  fontFamily: NEURAL_FONT_BODY,
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? "#070B1F" : "#E6E9F5",
                  background: active ? "#22D3EE" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {TAB_LABELS[t]}
              </button>
            );
          })}
          {status === "LEIDO" ? (
            <span className="ml-auto text-xs font-semibold" style={{ color: "#FDE68A" }}>
              ✓ Leído
            </span>
          ) : (
            <button type="button" onClick={markRead} className="ml-auto text-xs font-semibold underline underline-offset-2" style={{ color: "#22D3EE" }}>
              Marcar como leído
            </button>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {tab === "IDEA" &&
            (entry.idea ? (
              <p className="m-0" style={{ fontFamily: NEURAL_FONT_READING, fontStyle: "italic", fontSize: 20, lineHeight: 1.5, color: "#FFFFFF" }}>
                “{entry.idea}”
              </p>
            ) : (
              <EmptyNote text="Todavía no escribiste la idea de este libro en una frase." />
            ))}

          {tab === "IDEAS" &&
            (ideas.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>
                    Idea {ideaIndex + 1} de {ideas.length}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => goToIdea(ideaIndex - 1)} disabled={ideaIndex === 0} className="disabled:opacity-30" style={{ color }}>
                      ‹
                    </button>
                    <button type="button" onClick={() => goToIdea(ideaIndex + 1)} disabled={ideaIndex === ideas.length - 1} className="disabled:opacity-30" style={{ color }}>
                      ›
                    </button>
                  </div>
                </div>
                <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: "#FFFFFF" }}>
                  {ideas[ideaIndex].title}
                </span>
                <p className="m-0" style={{ fontFamily: NEURAL_FONT_READING, fontSize: 16, lineHeight: 1.6, color: "#E6E9F5" }}>
                  {ideas[ideaIndex].text}
                </p>
                {ideas[ideaIndex].action && (
                  <div className="rounded-xl p-3" style={{ background: `${color}1A`, borderLeft: `3px solid ${color}` }}>
                    <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Llevalo a la práctica
                    </span>
                    <p className="m-0 mt-1" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, color: "#E6E9F5" }}>
                      {ideas[ideaIndex].action}
                      {ideas[ideaIndex].habitName && ` — ${ideas[ideaIndex].habitName}`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyNote text="Todavía no cargaste las ideas clave de este libro." />
            ))}

          {tab === "RESUMEN" &&
            (entry.resumen ? (
              <p className="m-0 whitespace-pre-wrap" style={{ fontFamily: NEURAL_FONT_READING, fontSize: 16, lineHeight: 1.7, color: "#E6E9F5" }}>
                {entry.resumen}
              </p>
            ) : (
              <EmptyNote text="Todavía no escribiste el resumen de este libro." />
            ))}
        </div>
      </div>
    </div>
  );
}

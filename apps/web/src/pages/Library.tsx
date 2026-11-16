import { useMemo, useState } from "react";
import { useCycles } from "../api/tracking";
import { useLibrary, useLibrarySchools } from "../api/library";
import { SectionIntro } from "../components/SectionIntro";
import { useCycleResonance } from "../components/CycleResonance/useCycleResonance";
import { FilosofiasTab } from "../components/Library/FilosofiasTab";
import { FrasesTab } from "../components/Library/FrasesTab";
import { LibraryTabs, type LibraryTab } from "../components/Library/LibraryTabs";
import { LibrosTab } from "../components/Library/LibrosTab";
import { matchesLibrarySearch } from "../components/Library/librarySearch";
import { ParaTiTab } from "../components/Library/ParaTiTab";
import { NEURAL_BG, NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_TEXT_SECONDARY } from "../components/NeuralCore/tokens";

/**
 * "Alimento para tu cerebro" — rediseño de /library (Fase 1: portada con 4
 * pestañas). Identidad siempre oscura, propia, independiente del tema
 * claro/oscuro del resto de la app — mismo criterio ya establecido para
 * Resonancia del ciclo (ResonanceSection.tsx): esta sección vive conectada
 * al Cerebro Neural/Núcleo Neural, no al resto de /library.
 */
export function Library() {
  const { data: cycles } = useCycles();
  const effectiveCycleId = cycles?.find((c) => c.isActive)?.id ?? cycles?.[cycles.length - 1]?.id;
  const resonance = useCycleResonance(effectiveCycleId);

  const { data: entries } = useLibrary();
  const { data: schools } = useLibrarySchools();

  const [tab, setTab] = useState<LibraryTab>("PARA_TI");
  const [search, setSearch] = useState("");

  const searching = search.trim().length > 0;
  const searchResults = useMemo(() => (entries ?? []).filter((e) => matchesLibrarySearch(e, search)), [entries, search]);

  const books = useMemo(() => (entries ?? []).filter((e) => e.section === "LIBRO"), [entries]);
  const quotes = useMemo(() => (entries ?? []).filter((e) => e.section === "FRASE"), [entries]);

  return (
    <div
      className="min-h-full px-4 py-8 sm:px-8"
      style={{ background: NEURAL_BG }}
    >
      <div className="mx-auto flex flex-col gap-7" style={{ maxWidth: 960, marginTop: 52 }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="m-0" style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 32, fontWeight: 700, color: "#FFFFFF" }}>
                Biblioteca
              </h1>
              <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 15, color: NEURAL_TEXT_SECONDARY }}>
                Lecturas para alimentar tu mente. Cada una envía un impulso a su área.
              </span>
            </div>
            <SectionIntro
              id="library-alimento"
              startCollapsed
              purpose="Biblioteca conectada al Cerebro Neural: cada lectura o dosis completada manda un impulso real a su área."
              steps={[
                "\"Para ti\" te sugiere un libro y una dosis según qué área lo necesita más.",
                "Las frases se desbloquean completando dosis — no están ahí de entrada.",
                "Cada escuela de Filosofías trae un reto de práctica de 7 días.",
              ]}
              benefit="Lo que lees deja de ser aparte de tus hábitos: alimenta la misma red."
              colors={{ bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)", text: "#E6E9F5", textMuted: "#A9B1D6", accent: "#22D3EE", accentSoft: "rgba(34,211,238,0.12)" }}
            />
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar título, autor o texto…"
            style={{
              width: 280,
              height: 44,
              borderRadius: 12,
              padding: "0 14px",
              fontFamily: NEURAL_FONT_BODY,
              fontSize: 14,
              color: "#FFFFFF",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          />
        </div>

        {searching ? (
          <div className="flex flex-col gap-3">
            <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>
              {searchResults.length} {searchResults.length === 1 ? "resultado" : "resultados"} para “{search}”
            </span>
            <div className="flex flex-col gap-2">
              {searchResults.map((e) => (
                <div key={e.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>
                    {e.title ?? `"${e.content.slice(0, 60)}…"`}
                  </span>
                  {e.author && <span style={{ marginLeft: 8, fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>— {e.author}</span>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <LibraryTabs active={tab} onChange={setTab} />

            {!entries || !resonance || resonance.isLoading ? (
              <p style={{ color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>Cargando Biblioteca…</p>
            ) : (
              <>
                {tab === "PARA_TI" && <ParaTiTab resonance={resonance} entries={entries} />}
                {tab === "LIBROS" && <LibrosTab books={books} />}
                {tab === "FRASES" && <FrasesTab quotes={quotes} />}
                {tab === "FILOSOFIAS" && <FilosofiasTab schools={schools ?? []} />}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

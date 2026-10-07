import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GratitudeForm } from "../components/GratitudeForm";
import { JournalForm } from "../components/JournalForm";
import { JournalHistoryModal, type JournalHistoryKind } from "../components/JournalHistoryModal";
import { KnowledgeForm } from "../components/KnowledgeForm";
import { SectionPager } from "../components/SectionPager";

const JOURNAL_SECTIONS = ["emotion", "knowledge", "gratitude"] as const;
type JournalSection = (typeof JOURNAL_SECTIONS)[number];

const JOURNAL_SECTION_LABELS: Record<JournalSection, string> = {
  emotion: "Registro emocional",
  knowledge: "Conocimientos y reflexiones",
  gratitude: "Gratitud",
};

function ViewHistoryButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start rounded-lg border px-3 py-1.5 text-sm font-semibold"
      style={{ borderColor: "var(--border)", color: "var(--accent)" }}
    >
      {label} →
    </button>
  );
}

export function Journal() {
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get("date") ?? undefined;
  const [section, setSection] = useState<JournalSection>("emotion");
  const [historyOpen, setHistoryOpen] = useState<JournalHistoryKind | null>(null);

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ color: "var(--text)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Diario</h1>

        <SectionPager
          sections={JOURNAL_SECTIONS}
          labels={JOURNAL_SECTION_LABELS}
          active={section}
          onChange={setSection}
          panels={{
            emotion: (
              <div className="flex flex-col gap-4">
                <JournalForm initialDate={initialDate} />
                <ViewHistoryButton label="Ver todos los registros" onClick={() => setHistoryOpen("emotion")} />
              </div>
            ),
            knowledge: (
              <div className="flex flex-col gap-4">
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  Un espacio aparte del registro emocional: anotá lo que vas aprendiendo día a día, sin depender de
                  haber pasado por una situación difícil.
                </p>
                <KnowledgeForm initialDate={initialDate} />
                <ViewHistoryButton label="Ver todas las reflexiones" onClick={() => setHistoryOpen("knowledge")} />
              </div>
            ),
            gratitude: (
              <div className="flex flex-col gap-4">
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  Un espacio para anotar, todos los días, aquello que agradecés — grande o pequeño.
                </p>
                <GratitudeForm initialDate={initialDate} />
                <ViewHistoryButton label="Ver todo lo que agradeciste" onClick={() => setHistoryOpen("gratitude")} />
              </div>
            ),
          }}
        />
      </div>

      {historyOpen && <JournalHistoryModal kind={historyOpen} onClose={() => setHistoryOpen(null)} />}
    </div>
  );
}

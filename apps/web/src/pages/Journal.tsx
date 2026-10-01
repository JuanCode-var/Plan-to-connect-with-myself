import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { JournalForm } from "../components/JournalForm";
import { JournalList } from "../components/JournalList";
import { KnowledgeForm } from "../components/KnowledgeForm";
import { KnowledgeList } from "../components/KnowledgeList";
import { SectionPager } from "../components/SectionPager";
import type { Emotion } from "../domain";

const JOURNAL_SECTIONS = ["emotion", "knowledge"] as const;
type JournalSection = (typeof JOURNAL_SECTIONS)[number];

const JOURNAL_SECTION_LABELS: Record<JournalSection, string> = {
  emotion: "Registro emocional",
  knowledge: "Conocimientos y reflexiones",
};

export function Journal() {
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get("date") ?? undefined;
  const [section, setSection] = useState<JournalSection>("emotion");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [emotion, setEmotion] = useState<Emotion | "">("");

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
              <div className="flex flex-col gap-6">
                <JournalForm initialDate={initialDate} />
                <JournalList
                  from={from}
                  to={to}
                  emotion={emotion}
                  onFromChange={setFrom}
                  onToChange={setTo}
                  onEmotionChange={setEmotion}
                />
              </div>
            ),
            knowledge: (
              <div className="flex flex-col gap-6">
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  Un espacio aparte del registro emocional: anotá lo que vas aprendiendo día a día, sin depender de
                  haber pasado por una situación difícil.
                </p>
                <KnowledgeForm initialDate={initialDate} />
                <KnowledgeList />
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
}

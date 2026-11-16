import { useState } from "react";
import { DiarioTabs } from "../components/DiarioTabs";
import { EmotionWizard } from "../components/EmotionWizard";
import { KnowledgeCard } from "../components/KnowledgeCard";
import { GratitudeCard } from "../components/GratitudeCard";
import { FlowCard } from "../components/FlowCard";
import { JournalHistoryModal, type JournalHistoryKind } from "../components/JournalHistoryModal";
import { JournalSidePanel } from "../components/JournalSidePanels";
import { SectionIntro } from "../components/SectionIntro";
import { useJournalEntries } from "../api/journal";
import { DIARIO_SECTION_COLORS, type DiarioSection } from "../domain";
import { todayISO } from "../lib/date";
import { NEURAL_CYAN, NEURAL_CYAN_SOFT, NEURAL_BG, NEURAL_CARD_BORDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../components/NeuralCore/tokens";

const VIEW_ALL_LABEL: Record<DiarioSection, string> = {
  emotion: "Ver todos los registros",
  knowledge: "Ver todas las reflexiones",
  gratitude: "Ver todo lo que agradeciste",
  flow: "Ver todo tu tiempo en flow",
};

/**
 * "Diario" — rediseño Núcleo Neural (mockups 17-17g). Reemplaza el
 * SectionPager deslizante (sin tarjeta propia por sección, pasos ‹ ›) por
 * una rejilla fija de 2 columnas: una tarjeta de escritura a la izquierda
 * (una por pestaña, con SU color de ambiente) y un panel derecho con el
 * contexto de esa pestaña (semana + historial reciente). El brillo radial
 * de fondo es una mancha sólida muy desenfocada (no un gradiente real) a
 * propósito: `background-color` sí anima suave con CSS, un `radial-gradient`
 * no — así la transición entre colores de pestaña queda realmente suave.
 */
export function Journal() {
  const [section, setSection] = useState<DiarioSection>("emotion");
  const [historyOpen, setHistoryOpen] = useState<JournalHistoryKind | null>(null);
  // La tarjeta de Registro emocional "siente" la emoción elegida en vez de
  // quedarse en el rosa fijo de la pestaña — EmotionWizard avisa acá apenas
  // se elige una (o se vuelve a null al pedir "Nuevo registro").
  const [emotionColor, setEmotionColor] = useState<string | null>(null);

  const today = todayISO();
  const { data: todayEntries } = useJournalEntries({ from: today, to: today });
  const hasEntryToday: Record<DiarioSection, boolean> = {
    emotion: (todayEntries ?? []).some((e) => e.emotion != null),
    knowledge: (todayEntries ?? []).some((e) => e.knowledge != null),
    gratitude: (todayEntries ?? []).some((e) => e.gratitude != null),
    flow: (todayEntries ?? []).some((e) => e.flowMinutes != null),
  };

  const color = section === "emotion" ? (emotionColor ?? DIARIO_SECTION_COLORS.emotion) : DIARIO_SECTION_COLORS[section];

  return (
    <div className="relative min-h-full overflow-hidden px-4 py-6 sm:px-8 sm:py-8" style={{ background: NEURAL_BG, color: NEURAL_TEXT }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full"
          style={{ top: "-12%", background: color, opacity: 0.1, filter: "blur(140px)", transition: "background-color 600ms ease" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: NEURAL_TEXT }}>
              Diario
            </h1>
            <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Escribir lo que vives es entrenar a tu cerebro para entenderlo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(section)}
            className="shrink-0 text-sm font-semibold"
            style={{ color: NEURAL_CYAN }}
          >
            {VIEW_ALL_LABEL[section]} →
          </button>
        </div>

        <SectionIntro
          id="journal"
          purpose="4 registros separados: emocional, conocimientos, gratitud y flow."
          steps={["Elige la sección arriba.", "Completa el de hoy.", "\"Ver todos los registros\" para el historial completo."]}
          benefit={'Ganas constancia para que "Patrones detectados" encuentre relaciones reales entre tu ánimo y tus hábitos.'}
          colors={{
            bg: "rgba(255,255,255,0.04)",
            border: NEURAL_CARD_BORDER,
            text: NEURAL_TEXT,
            textMuted: NEURAL_TEXT_SECONDARY,
            accent: NEURAL_CYAN,
            accentSoft: NEURAL_CYAN_SOFT,
          }}
        />

        <DiarioTabs active={section} onChange={setSection} hasEntryToday={hasEntryToday} />

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
          <div
            key={section}
            className="micro-view-in rounded-[24px] p-6 sm:p-8"
            style={{
              background: `linear-gradient(160deg, ${color}14, rgba(11,15,40,0.55))`,
              border: `1px solid ${color}30`,
              borderTop: `3px solid ${color}`,
              transition: "border-color 400ms ease, background 400ms ease",
            }}
          >
            {section === "emotion" && <EmotionWizard onEmotionChange={setEmotionColor} />}
            {section === "knowledge" && <KnowledgeCard />}
            {section === "gratitude" && <GratitudeCard />}
            {section === "flow" && <FlowCard />}
          </div>

          <div key={`${section}-panel`} className="micro-view-in">
            <JournalSidePanel section={section} onOpenHistory={() => setHistoryOpen(section)} />
          </div>
        </div>
      </div>

      {historyOpen && <JournalHistoryModal kind={historyOpen} onClose={() => setHistoryOpen(null)} />}
    </div>
  );
}

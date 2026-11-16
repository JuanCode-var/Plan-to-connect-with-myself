import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLearnings, type LearningWithStats } from "../../api/microActions";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL } from "../NeuralCore/brainTokens";
import { NEURAL_CYAN, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { LearningDetailPanel } from "./LearningDetailPanel";

const SYNAPSE_SEGMENTS = 12;

function MONTH_SHORT(dateISO: string): string {
  const labels = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const [, month, day] = dateISO.slice(0, 10).split("-").map(Number);
  return `${day} ${labels[month - 1]}`;
}

function SynapseBar({ count, color }: { count: number; color: string }) {
  const lit = Math.min(count, SYNAPSE_SEGMENTS);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: SYNAPSE_SEGMENTS }, (_, i) => (
        <span
          key={i}
          className="h-1.5 flex-1 rounded-full"
          style={{ background: i < lit ? color : "rgba(255,255,255,0.08)", boxShadow: i < lit && count >= 10 ? `0 0 4px ${color}` : undefined }}
        />
      ))}
    </div>
  );
}

function LearningListItem({ learning, selected, onSelect }: { learning: LearningWithStats; selected: boolean; onSelect: () => void }) {
  const area = AREA_OF_CATEGORY[learning.area];
  const areaColor = BRAIN_AREA_COLOR[area];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col gap-2 rounded-2xl p-4 text-left"
      style={
        selected
          ? { background: "rgba(34,211,238,.06)", border: "1.5px solid rgba(34,211,238,.55)", boxShadow: "0 0 18px rgba(34,211,238,.18)" }
          : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }
      }
    >
      <span className="text-[11px] font-bold" style={{ color: areaColor }}>
        {BRAIN_AREA_LABEL[area]} · {MONTH_SHORT(learning.createdAt)}
      </span>
      <span className="line-clamp-2 text-[15px] font-bold" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
        {learning.title}
      </span>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold" style={{ color: learning.level.color }}>
          {learning.level.label}
        </span>
        <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
          {learning.applicationsCount} {learning.applicationsCount === 1 ? "aplicación" : "aplicaciones"}
        </span>
      </div>
      <SynapseBar count={learning.applicationsCount} color={learning.level.color} />
    </button>
  );
}

/** "Aprendizajes" (mockups 14c/14d/14e) — lista + detalle. La lista va ordenada por actividad reciente (la trae así el backend). */
export function LearningsView() {
  const { data: learnings, isLoading } = useLearnings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileDetailOpen, setMobileDetailOpen] = useState(!!searchParams.get("learning"));

  const selectedId = searchParams.get("learning") ?? learnings?.[0]?.id;

  function selectLearning(id: string) {
    const params = new URLSearchParams(searchParams);
    params.set("vista", "aprendizajes");
    params.set("learning", id);
    setSearchParams(params);
    setMobileDetailOpen(true);
  }

  if (isLoading) return null;

  if (!learnings || learnings.length === 0) {
    return (
      <p className="font-reading text-base italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT_SECONDARY }}>
        Todavía no registraste ningún aprendizaje — empieza con &quot;+ Nuevo aprendizaje&quot;.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className={`flex-col gap-3 lg:flex lg:w-[330px] lg:shrink-0 ${mobileDetailOpen ? "hidden" : "flex"}`}>
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_CYAN, letterSpacing: "1.5px" }}>
          Tus aprendizajes
        </span>
        <div className="flex flex-col gap-2.5">
          {learnings.map((l) => (
            <LearningListItem key={l.id} learning={l} selected={l.id === selectedId} onSelect={() => selectLearning(l.id)} />
          ))}
        </div>
        <p className="m-0 text-xs" style={{ color: NEURAL_TEXT_SECONDARY, lineHeight: 1.5 }}>
          Por encender · Chispa · Sendero · Conexión consolidada. Cada aplicación suma.
        </p>
      </div>

      {selectedId && (
        <div className={`min-w-0 flex-1 flex-col gap-3 lg:flex ${mobileDetailOpen ? "flex" : "hidden"}`}>
          <button
            type="button"
            onClick={() => setMobileDetailOpen(false)}
            className="self-start text-sm font-semibold lg:hidden"
            style={{ color: NEURAL_CYAN }}
          >
            ← Aprendizajes
          </button>
          <LearningDetailPanel learningId={selectedId} />
        </div>
      )}
    </div>
  );
}

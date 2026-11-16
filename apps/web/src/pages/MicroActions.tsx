import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLearnings, useMicroActions, useWoopPlans } from "../api/microActions";
import { LearningForm } from "../components/LearningForm";
import { TodayView } from "../components/MicroActionsSection/TodayView";
import { LearningsView } from "../components/MicroActionsSection/LearningsView";
import { WoopView } from "../components/MicroActionsSection/WoopView";
import { NEURAL_BG, NEURAL_CYAN, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../components/NeuralCore/tokens";

type View = "hoy" | "aprendizajes" | "woop";

function TabPill({ active, label, count, onClick }: { active: boolean; label: string; count: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold"
      style={active ? { background: NEURAL_CYAN, color: "#070B1F" } : { background: "transparent", color: NEURAL_TEXT }}
    >
      {label}
      <span className="text-xs font-semibold opacity-80">{count}</span>
    </button>
  );
}

/**
 * "Micro acciones" — ruta /microacciones, rediseño "Núcleo Neural" (mockups
 * 14-14g). 3 vistas (Hoy/Aprendizajes/Plan WOOP) en vez de una sola página
 * larga — la vista activa se guarda en ?vista= para que el link se pueda
 * compartir/recargar. Ya no hay "Revisión del día" (la reflexión se captura
 * en el momento, al marcar cada paso de Hoy) ni "Desbloquear con WOOP" en el
 * encabezado (el plan se crea desde adentro de la pestaña Plan WOOP).
 */
export function MicroActions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("vista");
  const view: View = viewParam === "aprendizajes" || viewParam === "woop" ? viewParam : "hoy";

  const { data: learnings } = useLearnings();
  const { data: woopPlans } = useWoopPlans();
  const { data: todayActions } = useMicroActions();
  const [showLearningForm, setShowLearningForm] = useState(false);

  function setView(next: View) {
    const params = new URLSearchParams(searchParams);
    params.set("vista", next);
    if (next !== "aprendizajes") {
      params.delete("learning");
      params.delete("tab");
    }
    setSearchParams(params);
  }

  const todayDone = (todayActions ?? []).filter((a) => a.completed).length;
  const todayTotal = (todayActions ?? []).length;

  return (
    <div className="min-h-full px-4 py-8 sm:px-8" style={{ background: NEURAL_BG, color: NEURAL_TEXT }}>
      <div className="mx-auto flex max-w-5xl flex-col gap-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display m-0 text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
              Micro acciones
            </h1>
            <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Lo que aprendes se vuelve conexión cuando lo aplicas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLearningForm(true)}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold"
            style={{ background: NEURAL_CYAN, color: "#070B1F" }}
          >
            + Nuevo aprendizaje
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Vista de Micro acciones"
          className="flex w-fit flex-wrap gap-1 rounded-full p-1"
          style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span role="tab" aria-selected={view === "hoy"}>
            <TabPill active={view === "hoy"} label="Hoy" count={`${todayDone}/${todayTotal}`} onClick={() => setView("hoy")} />
          </span>
          <span role="tab" aria-selected={view === "aprendizajes"}>
            <TabPill active={view === "aprendizajes"} label="Aprendizajes" count={`${learnings?.length ?? 0}`} onClick={() => setView("aprendizajes")} />
          </span>
          <span role="tab" aria-selected={view === "woop"}>
            <TabPill active={view === "woop"} label="Plan WOOP" count={`${woopPlans?.length ?? 0}`} onClick={() => setView("woop")} />
          </span>
        </div>

        <div className="micro-view-in" key={view}>
          {view === "hoy" && <TodayView />}
          {view === "aprendizajes" && <LearningsView />}
          {view === "woop" && <WoopView />}
        </div>
      </div>

      {showLearningForm && <LearningForm onClose={() => setShowLearningForm(false)} />}
    </div>
  );
}

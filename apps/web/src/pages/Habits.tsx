import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, verticalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useHabitsCatalog, useReorderCatalogHabits, type CatalogHabit } from "../api/habits";
import { HABIT_MOMENTS, HABIT_MOMENT_LABELS, HABIT_PRIORITY_LABELS, type HabitCategory, type HabitMoment } from "../domain";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, CATEGORY_OF_AREA, isBrainArea, type BrainArea } from "../components/NeuralCore/brainTokens";
import { HabitForm } from "../components/HabitForm";
import { HabitRow } from "../components/HabitRow";
import { HabitIdentityHero } from "../components/HabitIdentityHero";
import { HabitIdentityGrid } from "../components/HabitIdentityGrid";
import { HabitDetailPanel } from "../components/HabitDetailPanel";
import { NEURAL_BG, NEURAL_CYAN, NEURAL_PRIORITY_COLORS, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../components/NeuralCore/tokens";

type View = "identidad" | "momento";

function ViewSwitcher({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Vista de Mis hábitos"
      className="flex w-fit gap-1 rounded-full p-1"
      style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {([
        ["identidad", "Por identidad"],
        ["momento", "Por momento del día"],
      ] as const).map(([key, label]) => {
        const active = view === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className="rounded-full px-4 py-2.5 text-sm font-bold"
            style={{ background: active ? NEURAL_CYAN : "transparent", color: active ? "#070B1F" : NEURAL_TEXT }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function MomentTabs({
  counts,
  active,
  onChange,
}: {
  counts: Record<HabitMoment, number>;
  active: HabitMoment;
  onChange: (m: HabitMoment) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {HABIT_MOMENTS.map((m) => {
        const isActive = m === active;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold"
            style={isActive ? { background: NEURAL_CYAN, color: "#070B1F" } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: NEURAL_TEXT_SECONDARY }}
          >
            {HABIT_MOMENT_LABELS[m]}
            <span className="rounded-full px-1.5 py-0.5 text-xs" style={isActive ? { background: "rgba(7,11,31,0.2)" } : { background: "rgba(255,255,255,0.08)" }}>
              {counts[m]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AreaChips({ active, onChange }: { active: BrainArea | null; onChange: (a: BrainArea | null) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {BRAIN_AREAS.map((area) => {
        const isActive = active === area;
        const color = BRAIN_AREA_COLOR[area];
        return (
          <button
            key={area}
            type="button"
            onClick={() => onChange(isActive ? null : area)}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold"
            style={isActive ? { background: `${color}26`, borderColor: color, color } : { background: "transparent", borderColor: "rgba(255,255,255,0.14)", color: NEURAL_TEXT_SECONDARY }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
            {BRAIN_AREA_LABEL[area]}
          </button>
        );
      })}
    </div>
  );
}

function PriorityLegend() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        <span>Prioridad = impulsos por día:</span>
        {(["ALTA", "MEDIA", "BAJA"] as const).map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <span className="flex gap-0.5">
              {Array.from({ length: level === "ALTA" ? 3 : level === "MEDIA" ? 2 : 1 }, (_, i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: NEURAL_PRIORITY_COLORS[level] }} />
              ))}
            </span>
            {HABIT_PRIORITY_LABELS[level]}
          </span>
        ))}
      </div>
      <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Arrastra ⋮⋮ para cambiar el orden
      </span>
    </div>
  );
}

function MomentRowList({ habits, dimmedArea, onOpenDetail }: { habits: CatalogHabit[]; dimmedArea: BrainArea | null; onOpenDetail: (id: string) => void }) {
  const reorderHabits = useReorderCatalogHabits();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = habits.map((h) => h.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    reorderHabits.mutate(arrayMove(ids, oldIndex, newIndex));
  }

  if (habits.length === 0) {
    return (
      <p className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Sin hábitos en este momento.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} dimmed={dimmedArea !== null && CATEGORY_OF_AREA[dimmedArea] !== habit.category} onOpenDetail={onOpenDetail} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export function Habits() {
  const { data: habits, isLoading, isError } = useHabitsCatalog();
  const [showForm, setShowForm] = useState(false);
  const [formInitialCategory, setFormInitialCategory] = useState<HabitCategory | undefined>(undefined);
  const [formPrefill, setFormPrefill] = useState<{ name: string; specification: string } | undefined>(undefined);
  const [moment, setMoment] = useState<HabitMoment>(HABIT_MOMENTS[0]);
  const [detailHabitId, setDetailHabitId] = useState<string | null>(null);

  // ?vista=identidad|momento, recordada en la URL (Paso 3 del rediseño de
  // identidad) — "identidad" es la vista principal por defecto.
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("vista");
  const view: View = viewParam === "momento" ? "momento" : "identidad";

  function setView(next: View) {
    const params = new URLSearchParams(searchParams);
    params.set("vista", next);
    setSearchParams(params);
  }

  // ?area={key} (men/emo/fis/esp/eco/hab) — llega desde "Reactivar" en Mi
  // Mapa Neuronal (ver PruningCard.tsx): selecciona esa región (resalta su
  // tarjeta/cerebro, atenúa el resto) en cualquiera de las 2 vistas.
  const areaParam = searchParams.get("area");
  const [selectedArea, setSelectedArea] = useState<BrainArea | null>(areaParam && isBrainArea(areaParam) ? areaParam : null);

  function handleAreaChange(area: BrainArea | null) {
    setSelectedArea(area);
    if (searchParams.has("area")) {
      const params = new URLSearchParams(searchParams);
      params.delete("area");
      setSearchParams(params);
    }
  }

  function openForm(category?: HabitCategory, prefill?: { name: string; specification: string }) {
    setFormInitialCategory(category);
    setFormPrefill(prefill);
    setShowForm(true);
  }

  const momentCounts = HABIT_MOMENTS.reduce(
    (acc, m) => ({ ...acc, [m]: (habits ?? []).filter((h) => h.moment === m).length }),
    {} as Record<HabitMoment, number>,
  );

  const momentHabits = (habits ?? []).filter((h) => h.moment === moment).sort((a, b) => a.sortOrder - b.sortOrder);
  const detailHabit = detailHabitId ? (habits ?? []).find((h) => h.id === detailHabitId) : undefined;

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ background: NEURAL_BG, color: NEURAL_TEXT }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: NEURAL_TEXT }}>
              Mis hábitos
            </h1>
            <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Cada hábito es una acción de la persona en la que te estás convirtiendo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => (showForm ? setShowForm(false) : openForm())}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold"
            style={{ background: NEURAL_CYAN, color: "#070B1F" }}
          >
            {showForm ? "Cerrar" : "+ Nuevo hábito"}
          </button>
        </div>

        {showForm && (
          <HabitForm
            initialCategory={formInitialCategory}
            initialName={formPrefill?.name}
            initialSpecification={formPrefill?.specification}
            onCreated={() => setShowForm(false)}
          />
        )}

        {isLoading && <p style={{ color: NEURAL_TEXT_SECONDARY }}>Cargando hábitos…</p>}
        {isError && <p className="text-red-500">No se pudieron cargar los hábitos.</p>}

        {habits && (
          <>
            <HabitIdentityHero habits={habits} selectedArea={selectedArea} onSelectArea={handleAreaChange} onOpenDetail={setDetailHabitId} />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <ViewSwitcher view={view} onChange={setView} />
              <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Toca un hábito para ver en quién te convierte
              </span>
            </div>

            {view === "identidad" ? (
              <HabitIdentityGrid habits={habits} selectedArea={selectedArea} onOpenDetail={setDetailHabitId} onCreateInArea={openForm} />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <MomentTabs counts={momentCounts} active={moment} onChange={setMoment} />
                  <AreaChips active={selectedArea} onChange={handleAreaChange} />
                </div>
                <PriorityLegend />
                <MomentRowList habits={momentHabits} dimmedArea={selectedArea} onOpenDetail={setDetailHabitId} />
              </>
            )}
          </>
        )}
      </div>

      {detailHabit && <HabitDetailPanel habit={detailHabit} onClose={() => setDetailHabitId(null)} />}
    </div>
  );
}

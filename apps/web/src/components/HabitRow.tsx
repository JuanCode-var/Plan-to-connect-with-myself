import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CatalogHabit, CatalogStage } from "../api/habits";
import { useDeleteHabit, useUpdateHabit } from "../api/habits";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL } from "./NeuralCore/brainTokens";
import { NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_PRIORITY_COLORS, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { HABIT_PRIORITY_LABELS, type HabitPriorityLevel } from "../domain";
import { CATALOG_STAGE_COLOR, CATALOG_STAGE_LABEL } from "../lib/habitIdentity";

const DELETE_RED = "#FB7185";

const DOT_COUNT: Record<HabitPriorityLevel, number> = { ALTA: 3, MEDIA: 2, BAJA: 1 };

function DragHandleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <circle cx="6" cy="5" r="1.6" />
      <circle cx="14" cy="5" r="1.6" />
      <circle cx="6" cy="10" r="1.6" />
      <circle cx="14" cy="10" r="1.6" />
      <circle cx="6" cy="15" r="1.6" />
      <circle cx="14" cy="15" r="1.6" />
    </svg>
  );
}

function PriorityDots({ priority }: { priority: HabitPriorityLevel }) {
  const color = NEURAL_PRIORITY_COLORS[priority];
  return (
    <span className="flex shrink-0 items-center gap-1" aria-label={`Prioridad ${HABIT_PRIORITY_LABELS[priority]}`}>
      {Array.from({ length: DOT_COUNT[priority] }, (_, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
      ))}
    </span>
  );
}

function StagePercent({ stage, percent, areaColor }: { stage: CatalogStage; percent: number; areaColor: string }) {
  if (stage === "nuevo") {
    return (
      <span className="text-sm font-bold" style={{ color: CATALOG_STAGE_COLOR.nuevo }}>
        Nuevo
      </span>
    );
  }
  return (
    <div className="flex w-32 shrink-0 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold" style={{ color: CATALOG_STAGE_COLOR[stage] }}>
          {CATALOG_STAGE_LABEL[stage]}
        </span>
        <span className="text-xs font-bold" style={{ fontFamily: NEURAL_FONT_DISPLAY, color: NEURAL_TEXT }}>
          {percent}%
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: areaColor }} />
      </div>
    </div>
  );
}

function RowMenu({
  habit,
  onEdit,
  onPause,
  onDeleteRequest,
}: {
  habit: CatalogHabit;
  onEdit: () => void;
  onPause: () => void;
  onDeleteRequest: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Más opciones"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold"
        style={{ color: NEURAL_TEXT_SECONDARY }}
      >
        ⋯
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-20 mt-1 flex w-36 flex-col gap-0.5 rounded-xl border p-1.5 text-sm"
            style={{ background: "#0B0F28", borderColor: NEURAL_CARD_BORDER, boxShadow: "0 16px 32px rgba(0,0,0,.45)" }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="rounded-lg px-3 py-2 text-left"
              style={{ color: NEURAL_TEXT }}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onPause();
              }}
              className="rounded-lg px-3 py-2 text-left"
              style={{ color: NEURAL_TEXT }}
            >
              {habit.active ? "Pausar" : "Reanudar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDeleteRequest();
              }}
              className="rounded-lg px-3 py-2 text-left font-semibold"
              style={{ color: DELETE_RED }}
            >
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DeleteConfirmPanel({ habitId, habitName, onCancel }: { habitId: string; habitName: string; onCancel: () => void }) {
  const deleteHabit = useDeleteHabit();
  return (
    <div className="panel-expand-in mt-2 rounded-xl border p-3" style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER }}>
      <p className="text-sm" style={{ color: NEURAL_TEXT }}>
        ¿Eliminar <strong>{habitName}</strong>? Se borra también su historial.
      </p>
      <p className="mt-1 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Esta acción no se puede deshacer.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT_SECONDARY }}>
          Cancelar
        </button>
        <button
          type="button"
          disabled={deleteHabit.isPending}
          onClick={() => deleteHabit.mutate(habitId, { onSuccess: onCancel })}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: DELETE_RED }}
        >
          {deleteHabit.isPending ? "Eliminando…" : "Eliminar"}
        </button>
      </div>
    </div>
  );
}

/**
 * Una fila del Catálogo de hábitos — vista "Por momento del día" (mockups
 * 16/16b, con el ajuste de 16i: subtítulo "me convierte en alguien que…").
 * `dimmed`: filtro de área activo que no matchea esta fila (se atenúa, no
 * desaparece). Tocar la fila (o "Editar" del menú ⋯) abre
 * HabitDetailPanel.tsx — ya no hay un formulario de edición inline acá, un
 * solo detalle para toda la sección "Hábitos" (Paso 5 del rediseño de
 * identidad).
 */
export function HabitRow({ habit, dimmed, onOpenDetail }: { habit: CatalogHabit; dimmed: boolean; onOpenDetail: (habitId: string) => void }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const updateHabit = useUpdateHabit();
  const area = AREA_OF_CATEGORY[habit.category];
  const areaColor = BRAIN_AREA_COLOR[area];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id });

  return (
    <li
      ref={setNodeRef}
      className="list-none rounded-xl"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : dimmed ? 0.25 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <div className="flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3" style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER }}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arrastrar para reordenar"
          title="Arrastrar para reordenar"
          className="shrink-0 cursor-grab touch-none rounded px-0.5 py-0.5 active:cursor-grabbing"
          style={{ color: NEURAL_TEXT_SECONDARY }}
        >
          <DragHandleIcon />
        </button>

        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: areaColor }} aria-hidden />

        <button type="button" onClick={() => onOpenDetail(habit.id)} className="min-w-0 flex-1 text-left">
          <p className="m-0 flex min-w-0 items-center gap-2">
            <span className="truncate text-base font-bold" style={{ color: NEURAL_TEXT }}>
              {habit.name}
            </span>
            {!habit.active && (
              <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.08)", color: NEURAL_TEXT_SECONDARY }}>
                Pausado
              </span>
            )}
          </p>
          <p className="m-0 truncate text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {habit.specification}
          </p>
          {habit.meConvierteEn && (
            <p className="font-reading m-0 truncate text-[13px] italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_LAVENDER }}>
              me convierte en alguien que {habit.meConvierteEn}
            </p>
          )}
        </button>

        <span
          className="hidden shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-block"
          style={{ borderColor: areaColor, color: areaColor }}
        >
          {BRAIN_AREA_LABEL[area]}
        </span>

        <PriorityDots priority={habit.priority} />

        <StagePercent stage={habit.stage} percent={habit.percent} areaColor={areaColor} />

        <RowMenu
          habit={habit}
          onEdit={() => onOpenDetail(habit.id)}
          onPause={() => updateHabit.mutate({ id: habit.id, data: { active: !habit.active } })}
          onDeleteRequest={() => setConfirmingDelete((v) => !v)}
        />
      </div>

      {confirmingDelete && <DeleteConfirmPanel habitId={habit.id} habitName={habit.name} onCancel={() => setConfirmingDelete(false)} />}
    </li>
  );
}

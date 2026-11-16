import { useEffect, useRef, useState } from "react";
import type { Goal } from "../api/goals";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL } from "./NeuralCore/brainTokens";
import { NEURAL_BG, NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { daysBetween, formatShortDate } from "../lib/goalCycle";
import { todayISO } from "../lib/date";

const NEUTRAL_COLOR = "#7C86B0";
const SEGMENT_CAP = 20;
const LONG_PRESS_MS = 500;

function dueLabel(targetDateISO: string, todayDateISO: string): string {
  const diff = daysBetween(todayDateISO, targetDateISO);
  const date = formatShortDate(targetDateISO);
  if (diff < 0) return `Venció ${date}`;
  if (diff === 0) return `Vence hoy · ${date}`;
  return `Vence ${date} · ${diff} día${diff === 1 ? "" : "s"}`;
}

function SegmentedBar({ progress, targetCount, color }: { progress: number; targetCount: number; color: string }) {
  const segmentCount = Math.min(Math.max(targetCount, 1), SEGMENT_CAP);
  const clampedProgress = Math.min(progress, targetCount);
  const litSegments =
    segmentCount === targetCount ? clampedProgress : Math.round((clampedProgress / targetCount) * segmentCount);

  return (
    <div className="flex gap-1" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={targetCount}>
      {Array.from({ length: segmentCount }, (_, i) => (
        <span
          key={i}
          className="h-1.5 flex-1 rounded-full transition-colors duration-300"
          style={{ background: i < litSegments ? color : "rgba(255,255,255,.1)" }}
        />
      ))}
    </div>
  );
}

function CardMenu({
  onEdit,
  onSubtractOne,
  onDelete,
  canSubtract,
  openSignal,
}: {
  onEdit: () => void;
  onSubtractOne: () => void;
  onDelete: () => void;
  canSubtract: boolean;
  // Se incrementa desde afuera (presión mantenida en la tarjeta, mobile sin
  // hover) para abrir el menú sin duplicar su estado en el padre.
  openSignal: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (openSignal > 0) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmingDelete(false);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        aria-label="Más opciones"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
        style={{ color: NEURAL_TEXT_SECONDARY }}
      >
        ⋯
      </button>

      {open && (
        <div
          role="menu"
          className="popover-in absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border py-1 shadow-lg"
          style={{ background: NEURAL_BG, borderColor: "rgba(255,255,255,.12)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="block w-full px-3.5 py-2 text-left text-sm"
            style={{ color: NEURAL_TEXT }}
          >
            Editar
          </button>
          {canSubtract && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSubtractOne();
              }}
              className="block w-full px-3.5 py-2 text-left text-sm"
              style={{ color: NEURAL_TEXT }}
            >
              Restar 1
            </button>
          )}
          {!confirmingDelete ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => setConfirmingDelete(true)}
              className="block w-full px-3.5 py-2 text-left text-sm"
              style={{ color: "#F87171" }}
            >
              Eliminar
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="block w-full px-3.5 py-2 text-left text-sm font-semibold"
              style={{ color: "#F87171" }}
            >
              ¿Eliminar? Confirmar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta de una meta en la rejilla de /metas (mockups 15e/15f): sin modal
 * de detalle — todo lo accionable (registrar avance, editar, restar 1,
 * eliminar) vive acá mismo o a un toque de distancia, nada queda escondido
 * detrás de un "abrir para ver más". El menú ⋯ y la presión mantenida abren
 * el mismo menú (mobile no tiene hover para un ⋯ siempre visible).
 */
export function GoalCard({
  goal,
  onRegisterProgress,
  onEdit,
  onDelete,
  registeringProgress,
}: {
  goal: Goal;
  onRegisterProgress: (delta: 1 | -1) => void;
  onEdit: () => void;
  onDelete: () => void;
  registeringProgress?: boolean;
}) {
  const achieved = !!goal.achievedAt;
  const areaColor = goal.area ? BRAIN_AREA_COLOR[AREA_OF_CATEGORY[goal.area]] : NEUTRAL_COLOR;
  const accentColor = achieved ? NEURAL_GOLD : areaColor;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuForcedOpen, setMenuForcedOpen] = useState(0);

  function startLongPress() {
    longPressTimer.current = setTimeout(() => setMenuForcedOpen((v) => v + 1), LONG_PRESS_MS);
  }
  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  return (
    <div
      className="panel-card-in flex min-h-[300px] flex-col gap-4 rounded-2xl p-5"
      style={{
        background: `linear-gradient(160deg, ${accentColor}1A, rgba(11,15,40,0.55))`,
        border: `1px solid ${accentColor}40`,
        borderTop: `3px solid ${accentColor}`,
      }}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
    >
      <div className="flex items-start justify-between gap-2">
        {goal.area ? (
          <span
            className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold"
            style={{ background: `${areaColor}22`, borderColor: `${areaColor}55`, color: areaColor }}
          >
            {BRAIN_AREA_LABEL[AREA_OF_CATEGORY[goal.area]]}
          </span>
        ) : (
          <span />
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          {achieved ? (
            <span className="text-xs font-bold" style={{ color: NEURAL_GOLD }}>
              Lograda
            </span>
          ) : (
            <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
              {dueLabel(goal.targetDate, todayISO())}
            </span>
          )}
          <CardMenu
            onEdit={onEdit}
            onSubtractOne={() => onRegisterProgress(-1)}
            onDelete={onDelete}
            canSubtract={goal.progress > 0}
            openSignal={menuForcedOpen}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-xl font-bold" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
          {goal.title}
        </h3>
        {goal.why && (
          <p className="font-reading m-0 text-sm italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_LAVENDER, lineHeight: 1.5 }}>
            {goal.why}
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
        <div className="flex items-end justify-between gap-2">
          <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {goal.unit}
          </span>
          <span className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
            {goal.progress} / {goal.targetCount}
          </span>
        </div>

        <SegmentedBar progress={goal.progress} targetCount={goal.targetCount} color={accentColor} />

        {achieved ? (
          <button
            key="achieved"
            type="button"
            disabled
            className="goal-achieved-in rounded-xl py-2.5 text-sm font-bold"
            style={{ background: NEURAL_GOLD, color: "#3A2E05" }}
          >
            ✓ Meta lograda
          </button>
        ) : (
          <button
            type="button"
            disabled={registeringProgress}
            onClick={() => onRegisterProgress(1)}
            className="rounded-xl py-2.5 text-sm font-bold disabled:opacity-60"
            style={{ background: NEURAL_CYAN, color: "#070B1F" }}
          >
            +1 · Registrar avance
          </button>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useCycleLogs, useCycles } from "../api/tracking";
import { CycleSelector } from "../components/CycleSelector";
import { NewCycleForm } from "../components/NewCycleForm";
import { TrackerMatrix } from "../components/TrackerMatrix";
import { TodayProgress } from "../components/TodayProgress";
import { ToastHost } from "../components/ToastHost";
import { todayISO } from "../lib/date";

export function Tracker() {
  const { data: cycles, isLoading: cyclesLoading, isError: cyclesError } = useCycles();
  // undefined = "sin preferencia explícita todavía": el ciclo activo por
  // defecto se deriva en cada render (ver effectiveCycleId más abajo) en vez
  // de sincronizarse desde un efecto. Solo pasa a tener un valor concreto
  // cuando el usuario elige otro ciclo a mano en el selector.
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(undefined);
  const [showNewCycleForm, setShowNewCycleForm] = useState(false);

  // Ciclo activo por defecto: se lee de `isActive` (única fuente de verdad,
  // calculada en apps/api/src/services/tracking.ts::getActiveCycle), sin
  // reimplementar el criterio acá. Si el ciclo elegido a mano ya no existe (o
  // todavía no se eligió ninguno), recae en el activo o, en su defecto, el
  // último de la lista.
  const selectedCycleStillExists =
    !!selectedCycleId && !!cycles?.some((c) => c.id === selectedCycleId);
  const defaultCycleId = cycles && cycles.length > 0
    ? (cycles.find((c) => c.isActive) ?? cycles[cycles.length - 1]).id
    : undefined;
  const effectiveCycleId = selectedCycleStillExists ? selectedCycleId : defaultCycleId;

  const {
    data: cycleLogs,
    isLoading: logsLoading,
    isError: logsError,
  } = useCycleLogs(effectiveCycleId);

  return (
    <div
      className="min-h-full px-4 py-6 sm:px-8 sm:py-8"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Seguimiento diario</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/journal?date=${todayISO()}`}
              className="rounded-lg border px-3 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
            >
              Registro emocional de hoy
            </Link>
            {cycles && cycles.length > 0 && (
              <CycleSelector
                cycles={cycles}
                selectedCycleId={effectiveCycleId}
                onChange={setSelectedCycleId}
              />
            )}
            <button
              type="button"
              onClick={() => setShowNewCycleForm((v) => !v)}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              Crear nuevo ciclo
            </button>
          </div>
        </div>

        {showNewCycleForm && (
          <NewCycleForm
            cycles={cycles ?? []}
            onCreated={(cycle) => {
              setSelectedCycleId(cycle.id);
              setShowNewCycleForm(false);
            }}
            onCancel={() => setShowNewCycleForm(false)}
          />
        )}

        {cyclesLoading && <p style={{ color: "var(--text-2)" }}>Cargando ciclos…</p>}
        {cyclesError && <p className="text-red-500">No se pudieron cargar los ciclos.</p>}

        {!cyclesLoading && cycles && cycles.length === 0 && (
          <p style={{ color: "var(--text-2)" }}>
            Todavía no hay ciclos. Creá el primero con "Crear nuevo ciclo".
          </p>
        )}

        {effectiveCycleId && logsLoading && <p style={{ color: "var(--text-2)" }}>Cargando matriz…</p>}
        {logsError && <p className="text-red-500">No se pudo cargar la matriz del ciclo.</p>}

        {cycleLogs && effectiveCycleId && (
          <>
            <TodayProgress data={cycleLogs} />
            <TrackerMatrix cycleId={effectiveCycleId} data={cycleLogs} />
          </>
        )}

        <ToastHost />
      </div>
    </div>
  );
}

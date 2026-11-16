import { calculateWordProgress } from "../lib/wordProgress";

function formatShort(dateOnlyISO: string): string {
  const [year, month, day] = dateOnlyISO.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

/**
 * Barra de progreso de UN compromiso — reutilizada en WordDocument.tsx
 * (dentro de /palabra) y, en su propia variante con hitos, en "Circuitos en
 * recableado" dentro del Cerebro del ciclo (ver CommitmentRewireCard.tsx).
 * Es tiempo transcurrido del plazo, no "cuánto se cumplió" — ver
 * lib/wordProgress.ts para el porqué exacto de esa distinción.
 */
export function WordProgressBar({ startDate, targetDate }: { startDate: string; targetDate: string }) {
  const progress = calculateWordProgress(startDate, targetDate);

  const barColor = progress.state === "overdue" ? "#DC2626" : "var(--accent)";
  const label =
    progress.state === "upcoming"
      ? `Empieza el ${formatShort(startDate)}`
      : progress.state === "overdue"
        ? `Plazo cumplido el ${formatShort(targetDate)}`
        : `Día ${progress.daysElapsed} de ${progress.daysTotal} · faltan ${progress.daysRemaining} días`;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--border)" }}
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${progress.percent}%`, background: barColor }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs" style={{ color: "var(--text-2)" }}>
        <span>{label}</span>
        <span className="font-mono-num shrink-0">{progress.percent}%</span>
      </div>
    </div>
  );
}

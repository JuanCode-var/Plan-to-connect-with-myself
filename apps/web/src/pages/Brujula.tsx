import { useCompass } from "../api/compass";
import { useHabitIdentityStats, useHabitsCatalog } from "../api/habits";
import { useWordCommitments } from "../api/word";
import { isCommitmentActive } from "../lib/wordProgress";
import { CompassAchievements } from "../components/CompassAchievements";
import { CompassIdeal } from "../components/CompassIdeal";
import { CompassLastReflection } from "../components/CompassLastReflection";
import { CompassMessagesToggle } from "../components/CompassMessagesToggle";
import { CompassOnboarding } from "../components/CompassOnboarding";
import { IdentityPillarsEntry } from "../components/IdentityPillarsEntry";
import { CompassActions } from "../components/CompassActions";
import { useMarkCompassReviewed } from "../api/compass";
import { NEURAL_BG, NEURAL_CYAN, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../components/NeuralCore/tokens";
import { todayISO } from "../lib/date";

function daysSince(dateISO: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(dateISO).getTime()) / 86_400_000));
}

// `lastReviewedAt` es un timestamp completo (no una fecha pura) — comparar
// por los getters LOCALES, nunca recortando el ISO string (que es UTC y
// corre un día en zonas horarias detrás de UTC, mismo criterio que
// todayISO/todayLocalISO en todo el resto de la app).
function isToday(dateISO: string): boolean {
  const d = new Date(dateISO);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` === todayISO();
}

/**
 * "Mi Identidad" (antes "Mi Brújula") — el documento real de identidad del
 * usuario (mockups 13/13b), con ambiente violeta propio (igual que Mi
 * Palabra: fondos/tarjetas violeta, controles también violeta acá — el
 * mockup lo pide así, pisa la regla general de "controles en cian"). El
 * cuestionario inicial es obligatorio (ver RequireAuth.tsx): si
 * `identityOnboardingCompletedAt` es null, esta misma página muestra el
 * wizard en vez de la vista normal.
 */
export function Brujula() {
  const { data: compass, isLoading } = useCompass();
  const { data: stats } = useHabitIdentityStats();
  const { data: catalogHabits } = useHabitsCatalog();
  const { data: commitments } = useWordCommitments();
  const markReviewed = useMarkCompassReviewed();

  if (isLoading) {
    return <div className="min-h-[70vh] px-4 py-10 sm:px-8" style={{ background: NEURAL_BG, color: NEURAL_TEXT_SECONDARY }} />;
  }

  if (!compass || !compass.identityOnboardingCompletedAt) {
    return (
      <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ background: NEURAL_BG, color: NEURAL_TEXT }}>
        <CompassOnboarding compass={compass ?? null} />
      </div>
    );
  }

  const identity = compass.identities[0];
  const hasActiveCommitment = (commitments ?? []).some(isCommitmentActive);
  const topHabit = stats?.habits.reduce<(typeof stats.habits)[number] | undefined>(
    (best, h) => (!best || h.lifetimeImpulses > best.lifetimeImpulses ? h : best),
    undefined,
  );

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ background: NEURAL_BG, color: NEURAL_TEXT }}>
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-bold sm:text-4xl" style={{ color: NEURAL_TEXT }}>
              Mi identidad
            </h1>
            <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Quién soy, y en quién me estoy convirtiendo con cada hábito.
            </p>
          </div>
          {compass.lastReviewedAt && isToday(compass.lastReviewedAt) ? (
            <span
              className="flex shrink-0 items-center rounded-xl px-4 py-2.5 text-sm font-bold"
              style={{ background: "transparent", border: "1px solid rgba(110,231,183,.5)", color: "#6EE7B7" }}
            >
              ✓ Repasado hoy
            </span>
          ) : (
            <button
              type="button"
              disabled={markReviewed.isPending}
              onClick={() => markReviewed.mutate()}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60"
              style={{ background: NEURAL_CYAN, color: "#070B1F", height: 44 }}
            >
              {compass.lastReviewedAt ? `Repasar · hace ${daysSince(compass.lastReviewedAt)} días` : "Repasar por primera vez"}
            </button>
          )}
        </div>

        <CompassIdeal identity={identity} hasActiveCommitment={hasActiveCommitment} topHabit={topHabit} />

        <div className="flex flex-col gap-4 lg:flex-row">
          <CompassActions stats={stats} />
          <CompassAchievements habits={catalogHabits ?? []} />
        </div>

        <IdentityPillarsEntry />

        <div className="flex flex-col gap-4 lg:flex-row">
          <CompassLastReflection />
          <CompassMessagesToggle messagesEnabled={compass.messagesEnabled} identity={identity} />
        </div>
      </div>
    </div>
  );
}

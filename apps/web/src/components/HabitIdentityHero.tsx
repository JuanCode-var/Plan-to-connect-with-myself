import type { CatalogHabit } from "../api/habits";
import type { BrainArea } from "./NeuralCore/brainTokens";
import { BRAIN_AREA_COLOR } from "./NeuralCore/brainTokens";
import { NEURAL_ACCENT_VIOLET, NEURAL_CYAN, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { IdentityBrainMap } from "./IdentityBrainMap";
import { firstHabitWithoutPhrase, regionsEncendidasCount, regionStrengthByArea, topIdentityPhrases, weakestIdentityPhrase } from "../lib/habitIdentity";

function lowerFirst(text: string): string {
  return text.length > 0 ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

/**
 * Hero de "Hábitos por identidad" (mockup 16e, Paso 2) — el cerebro a la
 * izquierda y, a la derecha, en quién te estás convirtiendo según los
 * hábitos reales (ver lib/habitIdentity.ts: única fuente para estas frases
 * en toda la app, Paso 6).
 */
export function HabitIdentityHero({
  habits,
  selectedArea,
  onSelectArea,
  onOpenDetail,
}: {
  habits: CatalogHabit[];
  selectedArea: BrainArea | null;
  onSelectArea: (area: BrainArea | null) => void;
  onOpenDetail: (habitId: string) => void;
}) {
  const strengths = regionStrengthByArea(habits);
  const topPhrases = topIdentityPhrases(habits);
  const weakest = weakestIdentityPhrase(habits);
  const weakestHabit = weakest ? habits.find((h) => h.id === weakest.habitId) : undefined;
  const doneDays = weakestHabit?.last30.filter(Boolean).length ?? 0;

  const activeCount = habits.filter((h) => h.active).length;
  const regionsOn = regionsEncendidasCount(strengths);

  const hasAnyPhrase = habits.some((h) => h.active && h.meConvierteEn);

  return (
    <div
      className="panel-card-in grid grid-cols-1 gap-7 rounded-[24px] p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr]"
      style={{ background: `linear-gradient(160deg, ${NEURAL_ACCENT_VIOLET}14, rgba(11,15,40,0.55))`, border: "1px solid rgba(167,139,250,.28)" }}
    >
      <IdentityBrainMap strengths={strengths} selected={selectedArea} onSelect={onSelectArea} />

      <div className="flex flex-col gap-4">
        <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: NEURAL_LAVENDER }}>
          En quién te estás convirtiendo
        </span>

        {!hasAnyPhrase ? (
          <div className="flex flex-1 flex-col items-start gap-3">
            <p className="font-reading m-0 text-lg italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.5 }}>
              Escribe en quién te convierte cada hábito y aquí verás a la persona que estás construyendo.
            </p>
            {firstHabitWithoutPhrase(habits) && (
              <button
                type="button"
                onClick={() => onOpenDetail(firstHabitWithoutPhrase(habits)!.id)}
                className="rounded-xl px-4 py-2 text-sm font-bold"
                style={{ background: NEURAL_CYAN, color: "#070B1F" }}
              >
                Empezar
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Ya eres alguien que…
              </span>
              {topPhrases.length === 0 ? (
                <p className="m-0 text-sm italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  Todavía ningún hábito llegó al 85% — sigue sosteniéndolos.
                </p>
              ) : (
                topPhrases.map((p) => (
                  <button
                    key={p.habitId}
                    type="button"
                    onClick={() => onOpenDetail(p.habitId)}
                    className="flex items-start gap-2.5 text-left"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: BRAIN_AREA_COLOR[p.area], boxShadow: `0 0 6px ${BRAIN_AREA_COLOR[p.area]}` }} aria-hidden />
                    <span className="font-reading text-lg italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.4 }}>
                      …{lowerFirst(p.phrase)}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-dashed" style={{ borderColor: "rgba(255,255,255,.14)" }} />

            <div className="flex flex-col gap-1.5">
              <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Te estás convirtiendo en alguien que…
              </span>
              {weakest ? (
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <span className="font-reading text-lg italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT }}>
                    …{lowerFirst(weakest.phrase)}
                  </span>
                  <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                    · {doneDays} de 30 días
                  </span>
                  <button type="button" onClick={() => onOpenDetail(weakest.habitId)} className="text-sm font-bold" style={{ color: NEURAL_CYAN }}>
                    Ayudarlo →
                  </button>
                </div>
              ) : (
                <p className="m-0 text-sm italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  Todos tus hábitos con frase están fuertes.
                </p>
              )}
            </div>
          </>
        )}

        <p className="m-0 mt-auto text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
          {activeCount} {activeCount === 1 ? "hábito activo" : "hábitos activos"} · {regionsOn} de 6 regiones encendidas · toca una región para verla
        </p>
      </div>
    </div>
  );
}

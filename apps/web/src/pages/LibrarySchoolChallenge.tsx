import { Link, useParams } from "react-router-dom";
import { useAdvanceSchoolDay, useLibrarySchools } from "../api/library";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_FONT_READING, NEURAL_TEXT_SECONDARY } from "../components/NeuralCore/tokens";

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#A9B1D6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

/**
 * "Reto de la escuela" (/library/escuela/:id) — reemplaza el placeholder de
 * LibraryComingSoon para FILOSOFIA. Reto secuencial de 7 días: cada día se
 * desbloquea recién cuando se marca el anterior como hecho (ver
 * SchoolChallengeProgress.currentDay en schema.prisma) — nunca se puede
 * saltar adelante, pero sí releer los días ya hechos.
 */
export function LibrarySchoolChallenge() {
  const { id } = useParams<{ id: string }>();
  const { data: schools } = useLibrarySchools();
  const advanceDay = useAdvanceSchoolDay();

  const school = schools?.find((s) => s.id === id);

  if (!schools || !school) {
    return (
      <div className="flex min-h-full items-center justify-center" style={{ background: "#070B1F" }}>
        <p style={{ color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>Cargando escuela…</p>
      </div>
    );
  }

  const completed = school.currentDay >= 7;
  const activeDay = completed ? 7 : school.currentDay + 1;

  return (
    <div
      className="min-h-full px-4 py-8 sm:px-8"
      style={{ background: "#070B1F" }}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link to="/library" className="text-sm font-semibold" style={{ color: "#22D3EE" }}>
          ← Biblioteca
        </Link>

        <div className="flex flex-col gap-1">
          <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: "#FFFFFF" }}>{school.name}</span>
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, color: NEURAL_TEXT_SECONDARY }}>
            {completed ? "Reto completado" : `Día ${activeDay} de 7`}
          </span>
        </div>

        <div className="flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              style={{ flex: 1, height: 6, borderRadius: 3, background: i < school.currentDay ? "#22D3EE" : "rgba(255,255,255,0.1)" }}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
            const done = day <= school.currentDay;
            const locked = day > activeDay;
            const text = school.challengeDays.find((d) => d.day === day)?.text ?? "";
            return (
              <div
                key={day}
                className="rounded-2xl p-5"
                style={{
                  background: day === activeDay ? "rgba(34,211,238,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${day === activeDay ? "#22D3EE" : "rgba(255,255,255,0.08)"}`,
                  opacity: locked ? 0.5 : 1,
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 700, color: done ? "#FDE68A" : day === activeDay ? "#22D3EE" : "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Día {day}
                  </span>
                  {done && <span style={{ color: "#FDE68A", fontSize: 13 }}>✓</span>}
                  {locked && <LockIcon />}
                </div>
                {locked ? (
                  <p className="m-0 italic" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>
                    Se desbloquea al completar el día {day - 1}.
                  </p>
                ) : text ? (
                  <p className="m-0" style={{ fontFamily: NEURAL_FONT_READING, fontSize: 16, lineHeight: 1.6, color: "#E6E9F5" }}>
                    {text}
                  </p>
                ) : (
                  <p className="m-0 italic" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>
                    Todavía no escribiste el texto de este día.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {!completed && (
          <button
            type="button"
            disabled={advanceDay.isPending}
            onClick={() => advanceDay.mutate(school.id)}
            className="self-start rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
            style={{ background: "#22D3EE", color: "#070B1F" }}
          >
            {advanceDay.isPending ? "Guardando…" : `Marqué el día ${activeDay}`}
          </button>
        )}
      </div>
    </div>
  );
}

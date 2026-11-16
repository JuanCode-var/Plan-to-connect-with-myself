import { useEffect, useState } from "react";
import { useCompass } from "../api/compass";
import type { CycleLogs, HabitLog } from "../api/tracking";
import type { LogStatus } from "../domain";
import { toDateOnlyISO } from "../lib/completion";
import {
  countConsecutiveFails,
  isOverdueToday,
  isStreakJustBroken,
  markMessageShownToday,
  wasMessageShownToday,
} from "../lib/compassTriggers";
import { buildOverdueMessage, buildStreakBrokenMessage } from "../lib/compassMessages";
import { todayISO } from "../lib/date";
import { showToast } from "../lib/toast";
import { CompassInterruptionPrompt } from "./CompassInterruptionPrompt";

function buildLogLookup(logs: HabitLog[]): Map<string, LogStatus> {
  const map = new Map<string, LogStatus>();
  for (const log of logs) map.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
  return map;
}

/**
 * Chequeo "al abrir Seguimiento" de los 3 triggers que no dependen de un
 * clic puntual (2-3 días fallados / racha rota / atrasado hoy — los otros
 * dos, cumplido y "hoy no", se disparan desde TrackerMatrix.tsx en el
 * momento del cambio de estado). Corre una sola vez por montaje, elige a lo
 * sumo UN hábito (el de mayor prioridad entre los que califican) para no
 * convertir la pantalla en una lluvia de avisos — "máximo un mensaje de
 * identidad por hábito por día" ya limita cada uno, pero mostrar 5 a la vez
 * igual se sentiría como un reto, no como un acompañamiento.
 */
export function CompassInterventions({ cycleLogs }: { cycleLogs: CycleLogs }) {
  const { data: compass } = useCompass();
  const [interruption, setInterruption] = useState<{ habitId: string; habitName: string } | null>(null);

  useEffect(() => {
    if (!compass || !compass.messagesEnabled) return;
    if (interruption) return;

    const today = todayISO();
    const lookup = buildLogLookup(cycleLogs.logs);
    const effectiveStatus = (habitId: string, date: string): LogStatus => lookup.get(`${habitId}|${date}`) ?? "PENDING";

    const eligible = cycleLogs.habits.filter((h) => h.identityMessagesEnabled && !wasMessageShownToday(h.id, today));

    const interrupted = eligible.find((h) => countConsecutiveFails(h, cycleLogs.days, effectiveStatus, today) >= 2);
    if (interrupted) {
      setInterruption({ habitId: interrupted.id, habitName: interrupted.name });
      return;
    }

    const brokenStreak = eligible.find((h) => isStreakJustBroken(h, cycleLogs.days, effectiveStatus, today));
    if (brokenStreak) {
      markMessageShownToday(brokenStreak.id, today);
      showToast(buildStreakBrokenMessage(brokenStreak.name), "identity");
      return;
    }

    const overdue = eligible.find((h) => isOverdueToday(h, effectiveStatus(h.id, today)));
    if (overdue) {
      const identities = compass.identities;
      const linked = identities.find((i) => i.id === overdue.identityId);
      markMessageShownToday(overdue.id, today);
      showToast(buildOverdueMessage(overdue.name, linked, identities), "identity");
    }
    // Solo al montar (o si cambia el ciclo/compass carga) — no en cada
    // render por cada marca que el usuario hace en la matriz, eso lo
    // maneja TrackerMatrix.tsx por su cuenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compass, cycleLogs.days.length, cycleLogs.habits.length]);

  if (!interruption) return null;

  return (
    <CompassInterruptionPrompt
      habitId={interruption.habitId}
      habitName={interruption.habitName}
      weaknesses={compass?.weaknesses ?? []}
      onDismiss={() => setInterruption(null)}
    />
  );
}

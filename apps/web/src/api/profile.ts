import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HabitCategory } from "../domain";
import { apiFetch } from "./client";

export type NextCycleFocus = { area: HabitCategory | null; setInCycleId: string | null };

/**
 * "Versiones de ti" (Resonancia del ciclo): intención real de la próxima
 * versión ("¿qué región quieres encender?"). Vive en su propio query (no en
 * el `user` de AuthContext, que se pide una sola vez al arrancar la app) para
 * que la mutación de abajo invalide y refresque sin tocar la sesión.
 */
export function useNextCycleFocus() {
  return useQuery({
    queryKey: ["profile", "nextCycleFocus"],
    queryFn: () => apiFetch<NextCycleFocus>("/profile/next-cycle-focus"),
  });
}

/** `area: null` también limpia la intención (al mostrarla al empezar el siguiente ciclo — de un solo uso). */
export function useSetNextCycleFocus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { area: HabitCategory | null; cycleId: string | null }) =>
      apiFetch<NextCycleFocus>("/profile/next-cycle-focus", {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", "nextCycleFocus"] }),
  });
}

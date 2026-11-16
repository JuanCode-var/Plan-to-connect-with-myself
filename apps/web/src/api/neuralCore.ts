import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { BrainArea, CoreStateKey } from "../components/NeuralCore/brainTokens";

export type NeuralAreaStatDTO = {
  id: string;
  area: BrainArea;
  impulsosDeVida: number;
  activeDays: number;
  // Prisma serializa DateTime como ISO completo — usar .slice(0,10) al leer
  // (mismo criterio que el resto de la app, ver toDateOnlyISO en completion.ts).
  lastImpulseDate: string | null;
};

export type NeuralDailyStateDTO = {
  id: string;
  date: string;
  coreState: CoreStateKey;
  impulses: number;
};

export type NeuralCoreSnapshot = {
  areaStats: NeuralAreaStatDTO[];
  dailyStates: NeuralDailyStateDTO[];
};

/**
 * Fuente de verdad real de impulsosDeVida/historial diario (antes solo en
 * localStorage, ver brainHistory.ts) — pedido explícito: progreso de largo
 * plazo que no puede perderse al cambiar de dispositivo. localStorage sigue
 * existiendo como caché de pintado instantáneo, no como fuente de verdad.
 */
export function useNeuralCoreSnapshot() {
  return useQuery({
    queryKey: ["neuralCore"],
    queryFn: () => apiFetch<NeuralCoreSnapshot>("/neural-core"),
  });
}

type AdjustInput = {
  area: BrainArea;
  delta: number;
  date: string;
  coreState: CoreStateKey;
  totalImpulsesToday: number;
};

/**
 * Un ajuste por SECUENCIA de hábito (al marcar: una vez que llegó el último
 * de sus k impulsos; al desmarcar: una vez, inmediato) — no uno por impulso
 * individual, para no multiplicar llamadas de red por 3 en una prioridad
 * alta. La animación/conteo visible sigue siendo 100% local e instantánea
 * (ver useBrainImpulseEngine.ts); esto solo persiste el resultado final.
 */
export function useAdjustNeuralArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustInput) =>
      apiFetch<NeuralAreaStatDTO>("/neural-core/adjust", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["neuralCore"] }),
  });
}

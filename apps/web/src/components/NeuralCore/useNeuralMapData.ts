import { useMemo } from "react";
import { useNeuralCoreSnapshot } from "../../api/neuralCore";
import { addDaysISO, todayISO } from "../../lib/date";
import {
  defaultAreaMeta,
  diasSinImpulsos,
  loadAreaMeta,
  loadDailyHistory,
  pruningBrightness,
  type AreaMeta,
  type DailyEntry,
} from "./brainHistory";
import { BRAIN_AREAS, CORE_STATES, myelinStage, type BrainArea, type CoreStateKey, type MyelinStage } from "./brainTokens";
import { loadLifetime } from "./useBrainImpulseEngine";

export type DayCell = { date: string; stateIndex: number; stateKey: CoreStateKey; impulses: number };

const ZERO_AREA: Record<BrainArea, number> = { men: 0, emo: 0, fis: 0, esp: 0, eco: 0, hab: 0 };

const STAGE_RANGE: Record<Exclude<MyelinStage, "Automático">, [number, number]> = {
  Chispa: [0, 30],
  Sendero: [30, 90],
  Consolidado: [90, 180],
};

export function myelinProgress(impulsosDeVida: number): number {
  const stage = myelinStage(impulsosDeVida);
  if (stage === "Automático") return 1;
  const [lo, hi] = STAGE_RANGE[stage];
  return Math.max(0, Math.min(1, (impulsosDeVida - lo) / (hi - lo)));
}

function stateIndexOf(key: CoreStateKey): number {
  return CORE_STATES.findIndex((s) => s.key === key);
}

/**
 * Datos de "Mi mapa neuronal". Fuente real: GET /neural-core (servidor —
 * progreso de largo plazo, no puede perderse al cambiar de dispositivo).
 * Mientras esa consulta carga, o si falla (sin red), cae al caché local
 * (brainHistory.ts/useBrainImpulseEngine.ts) — mejor mostrar algo
 * levemente desactualizado que una pantalla vacía. Esta pantalla no corre
 * el motor de impulsos, solo observa lo que ya se guardó.
 */
export function useNeuralMapData() {
  const { data: snapshot, isLoading, isError } = useNeuralCoreSnapshot();

  const impulsosDeVida = useMemo<Record<BrainArea, number>>(() => {
    if (!snapshot) return loadLifetime();
    const map = { ...ZERO_AREA };
    for (const stat of snapshot.areaStats) map[stat.area] = stat.impulsosDeVida;
    return map;
  }, [snapshot]);

  const areaMeta = useMemo<Record<BrainArea, AreaMeta>>(() => {
    if (!snapshot) return loadAreaMeta();
    const map = defaultAreaMeta();
    for (const stat of snapshot.areaStats) {
      map[stat.area] = {
        lastImpulseDate: stat.lastImpulseDate ? stat.lastImpulseDate.slice(0, 10) : null,
        activeDays: stat.activeDays,
      };
    }
    return map;
  }, [snapshot]);

  const dailyHistory = useMemo<DailyEntry[]>(() => {
    if (!snapshot) return loadDailyHistory();
    return snapshot.dailyStates.map((d) => ({ date: d.date.slice(0, 10), coreState: d.coreState, impulses: d.impulses }));
  }, [snapshot]);

  const today = todayISO();
  const days: DayCell[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = addDaysISO(today, -i);
    const entry = dailyHistory.find((e) => e.date === date);
    const stateKey: CoreStateKey = entry?.coreState ?? "latente";
    days.push({ date, stateIndex: stateIndexOf(stateKey), stateKey, impulses: entry?.impulses ?? 0 });
  }

  const totalImpulsosDeVida = BRAIN_AREAS.reduce((sum, a) => sum + impulsosDeVida[a], 0);
  const nucleoPlenoDays = days.filter((d) => d.stateKey === "pleno").length;
  const activeDays = days.filter((d) => d.stateKey !== "latente").length;

  const areaStats = BRAIN_AREAS.map((area) => {
    const meta = areaMeta[area];
    const diasSin = diasSinImpulsos(meta);
    // Usuarios con impulsosDeVida previos a que este historial existiera
    // (meta.activeDays nunca contó nada real para esta área todavía): en vez
    // de mostrar "Día — de 66", se estima — nunca exacto, pero más útil que
    // un vacío, y queda marcado como estimado para no hacerlo pasar por dato
    // real. ceil(impulsos/6) ~ 1 hábito mediano completado cada día activo.
    const isEstimatedDays = meta.activeDays === 0 && impulsosDeVida[area] > 0;
    const displayDiasActivos = isEstimatedDays ? Math.ceil(impulsosDeVida[area] / 6) : meta.activeDays;
    return {
      area,
      impulsosDeVida: impulsosDeVida[area],
      diasActivos: displayDiasActivos,
      isEstimatedDays,
      diasSinImpulsos: diasSin,
      brightness: pruningBrightness(diasSin),
      stage: myelinStage(impulsosDeVida[area]),
      stageProgress: myelinProgress(impulsosDeVida[area]),
      justReactivated: diasSin === 0 && meta.lastImpulseDate === today,
    };
  });

  const brightnessByArea = Object.fromEntries(areaStats.map((s) => [s.area, s.brightness])) as Record<BrainArea, number>;
  const attenuating = areaStats.filter((s) => s.diasSinImpulsos > 0);
  const justReactivatedArea = areaStats.find((s) => s.justReactivated);

  return {
    impulsosDeVida,
    totalImpulsosDeVida,
    areaStats,
    brightnessByArea,
    attenuating,
    justReactivatedArea,
    days,
    nucleoPlenoDays,
    activeDays,
    isLoading: isLoading && !snapshot,
    isError: isError && !snapshot,
  };
}

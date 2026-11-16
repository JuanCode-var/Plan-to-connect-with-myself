import { BRAIN_AREAS, coreStateFor, type BrainArea, type CoreStateKey } from "./brainTokens";
import { todayISO } from "../../lib/date";

/**
 * Historial que el widget Cerebro Neural (paso 2) todavía no guardaba:
 * estado del núcleo al cierre de cada día + fecha del último impulso y
 * días activos por área. Se persiste en localStorage, mismo criterio que
 * `impulsosDeVida` (ver useBrainImpulseEngine.ts) — un detalle de este
 * dispositivo, honesto sobre su alcance: arranca vacío si nunca se guardó
 * nada, no reconstruye actividad pasada a la que no puso ANTES de que esta
 * pantalla existiera.
 *
 * "Cierre del día" sin servidor/cron: cada escritura (en cada impulso, y al
 * cargar la app en un día nuevo) actualiza/crea la entrada de HOY — la
 * última escritura antes de que cambie el día queda, de hecho, como el
 * cierre de ese día.
 */

const DAILY_HISTORY_KEY = "neural-core:daily-history:v1";
const AREA_META_KEY = "neural-core:area-meta:v1";
// Se guardan más de 30 por si se quiere ampliar el rango más adelante; la
// pantalla solo muestra los últimos 30.
const MAX_HISTORY_DAYS = 60;

export type DailyEntry = { date: string; coreState: CoreStateKey; impulses: number };
export type AreaMeta = { lastImpulseDate: string | null; activeDays: number };

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Cortesía, no garantía (modo privado, cuota llena, etc.).
  }
}

export function loadDailyHistory(): DailyEntry[] {
  return readJSON<DailyEntry[]>(DAILY_HISTORY_KEY, []);
}

/** Crea o actualiza la entrada de HOY con el estado actual del núcleo y el total de impulsos del día (para el tooltip de la franja de 30 días). */
export function recordDailyState(percent: number, totalImpulsesToday: number): DailyEntry[] {
  const today = todayISO();
  const state = coreStateFor(percent).key;
  const history = loadDailyHistory();
  const existingIndex = history.findIndex((e) => e.date === today);
  const entry: DailyEntry = { date: today, coreState: state, impulses: totalImpulsesToday };
  if (existingIndex >= 0) {
    history[existingIndex] = entry;
  } else {
    history.push(entry);
  }
  const trimmed = history.slice(-MAX_HISTORY_DAYS);
  writeJSON(DAILY_HISTORY_KEY, trimmed);
  return trimmed;
}

export function defaultAreaMeta(): Record<BrainArea, AreaMeta> {
  return Object.fromEntries(BRAIN_AREAS.map((a) => [a, { lastImpulseDate: null, activeDays: 0 }])) as Record<
    BrainArea,
    AreaMeta
  >;
}

export function loadAreaMeta(): Record<BrainArea, AreaMeta> {
  const stored = readJSON<Partial<Record<BrainArea, AreaMeta>>>(AREA_META_KEY, {});
  const base = defaultAreaMeta();
  for (const area of BRAIN_AREAS) {
    if (stored[area]) base[area] = stored[area]!;
  }
  return base;
}

/** Registra que `area` recibió un impulso hoy — actualiza lastImpulseDate y, si es un día nuevo para esa área, suma 1 a activeDays. */
export function recordAreaImpulse(area: BrainArea): Record<BrainArea, AreaMeta> {
  const today = todayISO();
  const meta = loadAreaMeta();
  const current = meta[area];
  const isNewDay = current.lastImpulseDate !== today;
  meta[area] = {
    lastImpulseDate: today,
    activeDays: isNewDay ? current.activeDays + 1 : current.activeDays,
  };
  writeJSON(AREA_META_KEY, meta);
  return meta;
}

function daysBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86400000);
}

export function diasSinImpulsos(meta: AreaMeta): number {
  if (!meta.lastImpulseDate) return 0;
  return Math.max(0, daysBetween(meta.lastImpulseDate, todayISO()));
}

/** Brillo de poda suave (sección 3c del pedido): nunca baja de 35%, nunca llega a 0. */
export function pruningBrightness(diasSin: number): number {
  return Math.max(0.35, 1 - 0.07 * diasSin);
}

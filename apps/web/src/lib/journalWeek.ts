import { addDaysISO } from "./date";

/** L a D — a propósito con Martes Y Miércoles como "M" (como en los
 * mockups 17-17g), a diferencia de WEEKDAY_LABELS_SHORT en domain.ts (que
 * usa "X" para Miércoles y está indexado domingo-primero para la matriz de
 * Seguimiento). Son dos necesidades distintas: esta es solo para las tiras
 * semanales del Diario. */
export const DIARIO_WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function mondayFirstIndex(dateISO: string): number {
  const [year, month, day] = dateISO.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return (d.getDay() + 6) % 7; // 0=lunes..6=domingo
}

/** Lunes de la semana calendario que contiene `dateISO` — mismo criterio que
 * GET /learning-applications/summary en el backend (semana lunes-domingo
 * que contiene hoy, no los últimos 7 días rodantes). */
export function mondayOfWeek(dateISO: string): string {
  return addDaysISO(dateISO, -mondayFirstIndex(dateISO));
}

/** Los 7 días ISO de lunes a domingo a partir de su lunes. */
export function weekDaysISO(mondayISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(mondayISO, i));
}

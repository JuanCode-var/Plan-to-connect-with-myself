/**
 * Fecha de HOY en el calendario LOCAL del dispositivo ("YYYY-MM-DD"), nunca
 * la fecha UTC: `new Date().toISOString()` convierte a UTC primero, así que
 * en zonas horarias detrás de UTC (ej. Colombia, UTC-5) cualquier hora entre
 * las ~19:00 y medianoche local ya cae "mañana" en UTC — mostraba el día
 * siguiente al real. Los getters LOCALES (getFullYear/getMonth/getDate) sí
 * reflejan el calendario del dispositivo, no los UTC.
 */
export function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Suma (o resta, con `delta` negativo) días calendario a una fecha
 * "YYYY-MM-DD", en calendario LOCAL (mismo criterio que `todayISO`: construir
 * el `Date` con año/mes/día sueltos, nunca parseando el string ISO completo,
 * evita el corrimiento de un día que trae interpretar "YYYY-MM-DD" como UTC).
 */
export function addDaysISO(dateISO: string, delta: number): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

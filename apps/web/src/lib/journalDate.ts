/** "30 nov" en es-CO, sin punto final de abreviatura ni año — mismo criterio
 * de formato corto que ya usan otras secciones (Metas, Mi Palabra), pero acá
 * vive su propia copia en vez de importarla de otra sección: son utilidades
 * genéricas de una sola fórmula, preferible a un import cruzado entre
 * dominios que no se relacionan entre sí. */
export function formatShortDate(dateISO: string): string {
  const d = new Date(`${dateISO.slice(0, 10)}T00:00:00`);
  const month = d.toLocaleDateString("es-CO", { month: "short" }).replace(/\.$/, "");
  return `${d.getDate()} ${month}`;
}

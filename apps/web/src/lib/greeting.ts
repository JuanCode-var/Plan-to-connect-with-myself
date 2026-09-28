/** Saludo según la hora local del dispositivo — sin vueltas de huso horario
 * de servidor: la hora que importa es la de la persona frente a la
 * pantalla. */
export function timeOfDayGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 6) return "Buenas noches";
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

/** Primer nombre de pila, para no saludar con el nombre completo. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export type TimeOfDayVariant = "sun" | "sunset" | "moon";

/** Qué ícono acompaña el saludo — mismo corte horario que
 * `timeOfDayGreeting` (ver TimeOfDayIcon.tsx). */
export function timeOfDayVariant(date: Date = new Date()): TimeOfDayVariant {
  const hour = date.getHours();
  if (hour < 6) return "moon";
  if (hour < 12) return "sun";
  if (hour < 20) return "sunset";
  return "moon";
}

/** Fecha de hoy en español, larga y legible ("lunes 15 de septiembre"). */
export function formatLongDateEs(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

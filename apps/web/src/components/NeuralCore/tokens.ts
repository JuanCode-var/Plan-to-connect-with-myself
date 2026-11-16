import type { HabitPriorityLevel } from "../../domain";

/**
 * "Núcleo Neural": identidad visual propia (violeta/cian sobre azul noche
 * muy oscuro), independiente de los tokens del resto de Evolving Mind —
 * mismo criterio ya usado en Micro Acciones/Mi Palabra antes de su retinte:
 * una sección puntual con su propio sistema de color, definido acá como
 * constantes (no `var(--...)`), tal como lo pidió la especificación.
 */
export const NEURAL_BG = "#070B1F";
export const NEURAL_GLOW_VIOLET = "rgba(124,92,255,.22)";
export const NEURAL_GLOW_CYAN = "rgba(34,211,238,.10)";
/** Glow fuerte para botones/segmentos de progreso en estado activo (regla de color, paso 0). */
export const NEURAL_GLOW_CYAN_STRONG = "rgba(34,211,238,.45)";

export const NEURAL_CARD_BG = "rgba(255,255,255,.035)";
/** Borde NEUTRO (regla de color, paso 0) — default para toda sección sin
 * ambiente propio (Hábitos, Diario, Metas, Micro Acciones, Patrones). */
export const NEURAL_CARD_BORDER = "rgba(255,255,255,.09)";
/** Borde con tinte violeta — SOLO para el ambiente de Mi Palabra/Mi Identidad
 * y Biblioteca/Dosis (secciones con "ambiente violeta" propio, pedido
 * explícito: "Mi palabra y Mi identidad conservan el ambiente violeta solo
 * en fondos y tarjetas; sus controles son cian"). Nunca en botones/pestañas. */
export const NEURAL_VIOLET_CARD_BORDER = "rgba(139,92,246,.28)";
export const NEURAL_CARD_RADIUS = 20;
export const NEURAL_CARD_SHADOW = "0 30px 80px rgba(0,0,0,.45)";

/**
 * CIAN — único color de "navegar y actuar" en toda la app (regla de color,
 * paso 0, no negociable): pestañas activas, botones primarios (texto
 * siempre NEURAL_BG, nunca blanco), interruptores, links y "seleccionado".
 * El color de ÁREA es para CONTENIDO (chips, barras, bordes, anillos) y
 * nunca para un botón; el violeta queda como ambiente de fondo/tarjeta
 * únicamente en Mi Palabra/Mi Identidad/Biblioteca.
 */
export const NEURAL_CYAN = "#22D3EE";
export const NEURAL_CYAN_SOFT = "rgba(34,211,238,.12)";
export const NEURAL_CYAN_BORDER = "rgba(34,211,238,.35)";
/** Práctica/logros: rachas, sellos, "completado" (regla de color, paso 0). */
export const NEURAL_GOLD = "#FDE68A";

/** Estilo de etiqueta (LAVANDA, 12px/600/mayúsculas/tracking 1.5px) — regla de color, paso 0. */
export const NEURAL_LABEL_STYLE = {
  color: "#C4B5FD",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
} as const;

export const NEURAL_PRIORITY_COLORS: Record<HabitPriorityLevel, string> = {
  ALTA: "#FB5C8C",
  MEDIA: "#22D3EE",
  BAJA: "#A78BFA",
};

/** Mismos 3 colores, como tripleta "r,g,b" — para componer `rgba(...)` con alfa. */
export const NEURAL_PRIORITY_RGB: Record<HabitPriorityLevel, string> = {
  ALTA: "251,92,140",
  MEDIA: "34,211,238",
  BAJA: "167,139,250",
};

export const NEURAL_TEXT = "#FFFFFF";
export const NEURAL_TEXT_SOFT = "#E6E9F5";
export const NEURAL_TEXT_SECONDARY = "#A9B1D6";
export const NEURAL_ACCENT_VIOLET = "#7C5CFF";
export const NEURAL_LAVENDER = "#C4B5FD";

export const NEURAL_FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif";
export const NEURAL_FONT_BODY = "'Inter', system-ui, sans-serif";
/** Frases y cuerpo de lectura ("Alimento para tu cerebro", Biblioteca) — ya cargada en index.css (misma fuente que `.font-reading`), acá como constante para usar en `style={{fontFamily}}` igual que el resto de Núcleo Neural/Cerebro Neural. */
export const NEURAL_FONT_READING = "'Lora', Georgia, 'Times New Roman', serif";

/** Impulsos disparados por hábito al marcarlo cumplido, según su prioridad. */
export const NEURAL_IMPULSE_POINTS: Record<HabitPriorityLevel, number> = {
  ALTA: 3,
  MEDIA: 2,
  BAJA: 1,
};

/** Orden de prioridad para ordenar segmentos del anillo y filas de la columna. */
export const NEURAL_PRIORITY_ORDER: HabitPriorityLevel[] = ["ALTA", "MEDIA", "BAJA"];

export const NEURAL_PRIORITY_LABELS: Record<HabitPriorityLevel, string> = {
  ALTA: "Prioridad alta",
  MEDIA: "Prioridad media",
  BAJA: "Prioridad baja",
};

export const NEURAL_PRIORITY_IMPULSE_LABELS: Record<HabitPriorityLevel, string> = {
  ALTA: "3 impulsos c/u",
  MEDIA: "2 impulsos c/u",
  BAJA: "1 impulso",
};

// Tiempos de la coreografía de impulsos (sección 7 del pedido) — en un solo
// lugar para no repetir números mágicos entre el motor y la capa visual.
export const NEURAL_IMPULSE_STEP_MS = 220;
export const NEURAL_IMPULSE_TRAVEL_MS = 650;
export const NEURAL_FLASH_MS = 700;
export const NEURAL_LIT_DELAY_MS = 40;

// Las medidas de la sección 2-6 del pedido (card 1320×470, orbe 290, columna
// de prioridades 470px...) fueron pensadas para un mockup de página propia,
// standalone. Integrado como UNA tarjeta más dentro de /tracker (con
// sidebar, topbar, título de página y la tabla de hábitos debajo), esas
// medidas literales se sentían "exageradas" (pedido explícito del usuario,
// con captura). `NEURAL_SCALE` reescala TODA la geometría en un solo lugar
// — las proporciones y el layout no cambian, solo el tamaño. Los SVG (orbe,
// sinapsis) escalan gratis vía su `width`/`height` renderizado manteniendo
// el mismo `viewBox` interno; todo lo que es CSS/HTML plano (tarjetas de
// prioridad, capa de impulsos, tipografías) usa el helper `scale()`.
export const NEURAL_SCALE = 0.72;

export function scale(px: number): number {
  return Math.round(px * NEURAL_SCALE * 100) / 100;
}

/**
 * Reescala cada número dentro de un "d" de path SVG/CSS (coordenadas de
 * comandos M/C/L, sin unidades embebidas) — para los `offset-path` de la
 * capa de impulsos, que son CSS plano y no escalan gratis como un SVG con
 * viewBox.
 */
export function scalePathD(d: string): string {
  return d.replace(/-?\d+(\.\d+)?/g, (match) => String(scale(Number(match))));
}

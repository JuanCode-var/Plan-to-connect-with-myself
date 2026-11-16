export const HABIT_MOMENTS = ["MANANA", "DIA", "NOCHE", "CIERRE_DEL_DIA"] as const;
export type HabitMoment = (typeof HABIT_MOMENTS)[number];

// Área de vida del hábito, independiente de su urgencia (ver
// HABIT_PRIORITY_LEVELS más abajo: antes un solo campo de 6 valores
// mezclaba ambos conceptos).
export const HABIT_CATEGORIES = ["FISICO", "ECONOMICO", "MENTAL", "EMOCIONAL", "HABILIDADES", "ESPIRITUAL"] as const;
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

export const LOG_STATUSES = ["DONE", "PENDING", "NA"] as const;
export type LogStatus = (typeof LOG_STATUSES)[number];

// "Micro acciones" — mismos valores que apps/api/src/domain.ts (espejo, ver
// nota en README.md).
export const MICRO_ACTION_ORIGINS = ["MANUAL", "APPLICATION", "REVIEW", "PROPOSITO"] as const;
export type MicroActionOrigin = (typeof MICRO_ACTION_ORIGINS)[number];
export const APPLICATION_TYPES = ["APPLIED", "WILL_APPLY"] as const;
export type ApplicationType = (typeof APPLICATION_TYPES)[number];

// Índice de día de semana = Date#getDay()/getUTCDay() (0=domingo..6=sábado),
// mismo criterio que usa el backend (apps/api/src/services/tracking.ts,
// insights.ts) para `activeWeekdays` — así nunca hace falta remapear entre
// cliente y servidor.
export const WEEKDAY_LABELS_SHORT = ["D", "L", "M", "X", "J", "V", "S"];

export const LIBRARY_SECTIONS = ["LIBRO", "FRASE", "FILOSOFIA"] as const;
export type LibrarySection = (typeof LIBRARY_SECTIONS)[number];

export const LIBRARY_SECTION_LABELS: Record<LibrarySection, string> = {
  LIBRO: "Libros",
  FRASE: "Frases",
  FILOSOFIA: "Filosofías",
};

// Mismo criterio que HABIT_PRIORITY_COLORS más abajo: un color por tipo de
// contenido, usado como franja de acento en las tarjetas "mosaico" de la
// Biblioteca. El violeta es un tono nuevo en la paleta — antes "insight /
// reflexión" (Frases acá, Conocimientos del Diario) no tenía color propio.
export const LIBRARY_SECTION_COLORS: Record<LibrarySection, string> = {
  LIBRO: "var(--accent)",
  FILOSOFIA: "#0D9488",
  FRASE: "#8B5CF6",
};
export const INSIGHT_COLOR = "#8B5CF6";
// Un color por tipo de patrón detectado (ver InsightsPanel.tsx), mismo
// criterio que HABIT_PRIORITY_COLORS: "chain" reutiliza el violeta de
// insight/reflexión de arriba (coincide con la intención, no un color nuevo),
// "weekday" el dorado de marca, "emotion" el mismo teal que ya usan
// HABIT_PRIORITY_COLORS.BAJA / LIBRARY_SECTION_COLORS.FILOSOFIA.
export const INSIGHT_TYPE_COLORS = {
  chain: INSIGHT_COLOR,
  weekday: "var(--accent)",
  emotion: "#0D9488",
} as const;
// Rediseño "Diario" (Núcleo Neural, mockups 17-17g): un color por PESTAÑA
// (ambiente de la tarjeta, punto de la pestaña, brillo radial de fondo),
// distinto de EMOTION_COLORS de abajo (que es por EMOCIÓN puntual, dentro
// de la pestaña "Registro emocional"). GRATITUDE_COLOR/FLOW_COLOR vivían
// como constantes sueltas antes de este rediseño — mismos 2 consumidores
// (JournalHistoryModal), ahora parte de este único mapa junto con los otros
// 2 colores de sección.
export const DIARIO_SECTION_COLORS = {
  emotion: "#FB5C8C",
  knowledge: "#38BDF8",
  gratitude: "#FBBF24",
  flow: "#FB923C",
} as const;
export type DiarioSection = keyof typeof DIARIO_SECTION_COLORS;

export const PIN_DURATIONS = ["DAY", "WEEK", "MONTH"] as const;
export type PinDuration = (typeof PIN_DURATIONS)[number];
export const PIN_DURATION_LABELS: Record<PinDuration, string> = {
  DAY: "Un día",
  WEEK: "Una semana",
  MONTH: "Un mes",
};

// Rediseño "Diario" (Paso 2 del pedido): 10 emociones fijas, cada una con su
// propio color de punto — reemplaza la lista vieja separada en "negativas"/
// "positivas" (sin color propio, solo agrupadas en un <optgroup>). El
// backend (apps/api/src/domain.ts) valida contra la MISMA lista — si cambiás
// una acá, cambiá la misma ahí. Entradas viejas con una emoción que ya no
// está en esta lista (ej. "Agotamiento", "Entusiasmo", "Otra") siguen
// existiendo tal cual en la base: nunca se remapean solas a una emoción
// nueva (sería inventar un dato que la persona no escribió) — ver
// EMOTION_FALLBACK_COLOR para cómo se pintan.
export const EMOTIONS = [
  "Alegría",
  "Calma",
  "Gratitud",
  "Orgullo",
  "Esperanza",
  "Ansiedad",
  "Tristeza",
  "Frustración",
  "Enojo",
  "Cansancio",
] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const EMOTION_COLORS: Record<Emotion, string> = {
  Alegría: "#FBBF24",
  Calma: "#34D399",
  Gratitud: "#FDE68A",
  Orgullo: "#22D3EE",
  Esperanza: "#A78BFA",
  Ansiedad: "#FB923C",
  Tristeza: "#38BDF8",
  Frustración: "#FB5C8C",
  Enojo: "#EF4444",
  Cansancio: "#94A3B8",
};
// Para una emoción guardada antes de este rediseño que ya no está en
// EMOTIONS — se sigue mostrando tal cual, solo sin un color mapeado.
export const EMOTION_FALLBACK_COLOR = "#7C86B0";

export const HABIT_MOMENT_LABELS: Record<HabitMoment, string> = {
  MANANA: "Mañana",
  DIA: "Día",
  NOCHE: "Noche",
  CIERRE_DEL_DIA: "Cierre del día",
};

export const HABIT_CATEGORY_LABELS: Record<HabitCategory, string> = {
  FISICO: "Físico",
  ECONOMICO: "Económico",
  MENTAL: "Mental",
  EMOCIONAL: "Emocional",
  HABILIDADES: "Habilidades",
  ESPIRITUAL: "Espiritual",
};

// "Hábitos por identidad" (mockups 16e-16i, Paso 1): frase de identidad por
// área — se usa mientras Compass.identity{Area} siga sin tocar (null). La
// clave de Compass que guarda cada una (ver api/compass.ts) para no repetir
// el mapeo HabitCategory → campo en cada componente que lee/escribe esto.
export const AREA_IDENTITY_COMPASS_FIELD = {
  MENTAL: "identityMental",
  FISICO: "identityFisica",
  EMOCIONAL: "identityEmocional",
  HABILIDADES: "identityHabilidades",
  ESPIRITUAL: "identityEspiritual",
  ECONOMICO: "identityEconomica",
} as const satisfies Record<HabitCategory, string>;

export const DEFAULT_AREA_IDENTITY: Record<HabitCategory, string> = {
  MENTAL: "Soy alguien que dirige su mente",
  FISICO: "Soy alguien que cuida y entrena su cuerpo",
  EMOCIONAL: "Soy alguien que se conoce y agradece",
  HABILIDADES: "Soy alguien que aprende y crea con enfoque",
  ESPIRITUAL: "Soy alguien que vive con calma y presencia",
  ECONOMICO: "Soy alguien que genera y cuida su dinero",
};

// Urgencia del hábito, campo independiente de la categoría (área de vida):
// un hábito de cualquier área puede ser alta, media o baja urgencia — ya no
// se deriva de la categoría, se elige a mano al crear/editar el hábito.
export const HABIT_PRIORITY_LEVELS = ["ALTA", "MEDIA", "BAJA"] as const;
export type HabitPriorityLevel = (typeof HABIT_PRIORITY_LEVELS)[number];

export const HABIT_PRIORITY_LABELS: Record<HabitPriorityLevel, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

// Un color por NIVEL de prioridad: alta = rojo (hacer primero, urgente),
// media = el dorado de marca de la app (el grueso de la rutina diaria),
// baja = teal frío (se puede saltear, a propósito distinto en temperatura de
// los otros dos). Tres hues bien distintos entre sí — no una escala
// monocromática — para que se puedan diferenciar de un vistazo, tanto en el
// ícono de PriorityIcon (CategoryBadge, TrackerMatrix) como en los anillos
// "por prioridad" de TodayProgress y los gráficos del Resumen.
export const HABIT_PRIORITY_COLORS: Record<HabitPriorityLevel, string> = {
  ALTA: "#DC2626",
  MEDIA: "var(--accent)",
  BAJA: "#0D9488",
};

// La paleta propia de "Micro acciones" (antes acá) quedó reemplazada por los
// tokens de Núcleo Neural (components/NeuralCore/tokens.ts) en el rediseño
// a 3 vistas (Hoy/Aprendizajes/Plan WOOP) — mismo sistema de color que ya
// usan Hábitos/Patrones/Mi Palabra.

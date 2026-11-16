// "Nivel de conexión" de un aprendizaje (Paso 1 del pedido) — cuántas veces
// se aplicó en la vida real (LearningApplication), no cuántas micro acciones
// tiene asignadas. Mismos 4 umbrales en toda la sección (barra de sinapsis
// de 12 segmentos en Aprendizajes, medalla de "Peso"/conexión más fuerte).
export type ConnectionLevelKey = "por_encender" | "chispa" | "sendero" | "consolidada";

export type ConnectionLevel = {
  key: ConnectionLevelKey;
  label: string;
  color: string;
  glow: boolean;
};

export function connectionLevelFor(applicationsCount: number): ConnectionLevel {
  if (applicationsCount === 0) return { key: "por_encender", label: "Por encender", color: "#7C86B0", glow: false };
  if (applicationsCount <= 2) return { key: "chispa", label: "Chispa", color: "#E6E9F5", glow: false };
  if (applicationsCount <= 9) return { key: "sendero", label: "Sendero en formación", color: "#C4B5FD", glow: false };
  return { key: "consolidada", label: "Conexión consolidada", color: "#22D3EE", glow: true };
}

import type { BrainArea } from "../NeuralCore/brainTokens";

/**
 * "Próxima identidad" (tarjeta "EN DISEÑO", sección 4 del pedido) — frase en
 * FUTURO/aspiracional, distinta de BRAIN_IDENTITY_PHRASE (brainTokens.ts, en
 * PRESENTE: "ya eres alguien que..."), que es la que se usa para la frase
 * "ganada" de las versiones ya vividas (sección 1). Las dos existen porque
 * dicen cosas distintas: una ya se cumplió, la otra todavía se está eligiendo.
 */
export const FUTURE_IDENTITY_CLAUSE: Record<BrainArea, string> = {
  men: "piensa con claridad",
  eco: "construye su libertad financiera",
  hab: "domina lo que practica",
  emo: "se escucha",
  fis: "se mueve todos los días",
  esp: "se conecta consigo",
};

/**
 * Consejo del panel "Diseña tu vN+1" (sección 6) cuando el área elegida
 * TODAVÍA no tiene ningún hábito — el mockup solo escribía este caso para
 * Económica (la única área vacía en su demo); acá se generaliza a las 6,
 * con el mismo formato ("crea 1 hábito chico, repetilo 3 días por semana")
 * y la MISMA frase literal para Económica que ya traía Versiones.dc.html.
 */
export const EMPTY_AREA_STARTER_TIP: Record<BrainArea, string> = {
  men: "Crea 1 hábito mental pequeño (anotar las 3 tareas del día en 2 minutos) y repítelo 3 días por semana.",
  eco: "Crea 1 hábito económico pequeño (registrar gastos 2 minutos al día) y repítelo 3 días por semana.",
  hab: "Crea 1 hábito de habilidades pequeño (practicar 5 minutos lo que quieres aprender) y repítelo 3 días por semana.",
  emo: "Crea 1 hábito emocional pequeño (anotar cómo te sientes en 2 minutos) y repítelo 3 días por semana.",
  fis: "Crea 1 hábito físico pequeño (caminar 10 minutos) y repítelo 3 días por semana.",
  esp: "Crea 1 hábito espiritual pequeño (2 minutos de respiración consciente) y repítelo 3 días por semana.",
};

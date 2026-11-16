import { useEffect, useRef, useState } from "react";
import { NEURAL_FONT_BODY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { prefersReducedMotion } from "./resonanceCanvas";
import { RESONANCE_STATES, resonanceStateFor } from "./resonanceTokens";

const CENTER = 86;
const R_ARC = 66;
const R_OUTER = 81;
const CIRC_ARC = 2 * Math.PI * R_ARC; // 414.69
const CIRC_OUTER = 2 * Math.PI * R_OUTER; // 508.94
const FILL_MS = 1600;

// Los 3 umbrales intermedios (despertar/enfoque/flow) — ni "apagón" (0%,
// siempre "alcanzado") ni "pleno" (100%, caso borde aparte) llevan muesca.
const TICK_STATES = RESONANCE_STATES.slice(1, 4);

function polar(pct: number, r: number): { x: number; y: number } {
  const deg = -90 + (pct / 100) * 360;
  const rad = (deg * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

/**
 * "Carga neuronal del ciclo" — puerto del anillo SVG de Resonancia.dc.html
 * (geometría/animaciones portadas tal cual: r=66/81, circunferencias
 * 414.7/508.9, muescas en los umbrales de RESONANCE_STATES). El llenado
 * arranca en 0 y anima a su valor real en `FILL_MS` vía CSS transition —
 * mismo patrón de 2 pasos que ya usa ProgressRing.tsx (estado 0 → rAF →
 * estado final, nunca una `@keyframes` con un "to" implícito sobre un
 * atributo SVG, que no siempre se interpola igual entre navegadores).
 */
export function CycleLoadRing({
  percentGeneral,
  completado,
  pendiente,
  noAplica,
  cycleNumber,
  prevCyclePercent,
  scanGeneration,
}: {
  percentGeneral: number;
  completado: number;
  pendiente: number;
  noAplica: number;
  cycleNumber: number | null;
  prevCyclePercent: number | null;
  scanGeneration: number;
}) {
  const reduceMotion = useRef(prefersReducedMotion()).current;
  const [animatedPercent, setAnimatedPercent] = useState(reduceMotion ? percentGeneral : 0);

  useEffect(() => {
    if (reduceMotion) {
      setAnimatedPercent(percentGeneral);
      return;
    }
    setAnimatedPercent(0);
    const raf = requestAnimationFrame(() => setAnimatedPercent(percentGeneral));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- también se re-dispara al "repetir escaneo" (scanGeneration), no solo cuando cambia el %.
  }, [percentGeneral, scanGeneration]);

  const state = resonanceStateFor(percentGeneral);
  const arcLength = (animatedPercent / 100) * CIRC_ARC;
  const totalTracked = completado + pendiente + noAplica;
  const naFraction = totalTracked > 0 ? noAplica / totalTracked : 0;

  const sparkPos = polar(animatedPercent, R_ARC);

  const reachedTicks = percentGeneral > 0 ? TICK_STATES.filter((t) => percentGeneral >= t.minPercent) : [];

  const diff = prevCyclePercent !== null ? percentGeneral - prevCyclePercent : null;

  return (
    <div className="mx-auto flex w-full flex-col items-center" style={{ maxWidth: 200 }}>
      <svg
        role="img"
        aria-label={`Carga neuronal del ciclo: ${percentGeneral}%, estado ${state.label}. ${completado} impulsos enviados de ${totalTracked}; ${noAplica} días en reposo.`}
        width="92%"
        viewBox="0 0 172 172"
        style={{ overflow: "visible", aspectRatio: "1 / 1", display: "block" }}
      >
        <circle cx={CENTER} cy={CENTER} r={R_OUTER} fill="none" stroke="rgba(169,177,214,0.12)" strokeWidth={2} />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R_OUTER}
          fill="none"
          stroke="#A9B1D6"
          strokeOpacity={0.75}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${naFraction * CIRC_OUTER} ${CIRC_OUTER}`}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
        <circle cx={CENTER} cy={CENTER} r={R_ARC} fill="none" stroke="#A78BFA" strokeOpacity={0.45} strokeWidth={12} strokeDasharray="2 5" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R_ARC}
          fill="none"
          stroke="#22D3EE"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${CIRC_ARC}`}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          style={{
            transition: reduceMotion ? undefined : `stroke-dasharray ${FILL_MS}ms linear`,
            filter: "drop-shadow(0 0 8px rgba(34,211,238,0.75))",
          }}
        />
        {!reduceMotion && animatedPercent > 0 && (
          <circle
            cx={sparkPos.x}
            cy={sparkPos.y}
            r={5}
            fill="#FFFFFF"
            style={{
              filter: "drop-shadow(0 0 6px #FFFFFF)",
              opacity: animatedPercent >= percentGeneral * 0.98 ? 0 : 1,
              transition: `opacity 160ms linear ${FILL_MS * 0.92}ms`,
            }}
          />
        )}

        {TICK_STATES.map((t) => {
          const reached = percentGeneral >= t.minPercent;
          const p1 = polar(t.minPercent, 58);
          const p2 = polar(t.minPercent, 79);
          return (
            <line
              key={t.key}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={t.color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeOpacity={reached ? 1 : 0.55}
              strokeDasharray={reached ? undefined : "2 3"}
            />
          );
        })}

        {!reduceMotion &&
          reachedTicks.map((t) => (
            <circle
              key={t.key}
              className="cn-flash"
              style={{ animationDelay: `${(t.minPercent / percentGeneral) * (FILL_MS / 1000)}s` }}
              cx={CENTER}
              cy={CENTER}
              r={R_ARC}
              fill="none"
              stroke={t.color}
              strokeWidth={3}
            />
          ))}

        {!reduceMotion && (
          <g className="cn-orbit" style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}>
            <circle cx={CENTER} cy={34} r={2.5} fill="#7DE3F4" />
            <circle cx={131} cy={112} r={2} fill="#7DE3F4" fillOpacity={0.8} />
            <circle cx={41} cy={112} r={2} fill="#C4B5FD" fillOpacity={0.8} />
          </g>
        )}

        <text x={CENTER} y={90} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontSize={38} fontWeight={700} fill="#FFFFFF">
          {percentGeneral}%
        </text>
        {/* "Latente / Apagón" (el único estado de 2 palabras) no entra a este
            tamaño — acá se corta a "APAGÓN" solo para el centro del
            anillo; el label completo se conserva en el aria-label y en
            cualquier otro lugar que lo use. */}
        <text x={CENTER} y={110} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={12} fontWeight={700} letterSpacing={2} fill={state.color}>
          {(state.key === "apagon" ? "Apagón" : state.label).toUpperCase()}
        </text>
      </svg>

      {diff !== null && (
        <span className="mt-1 text-center" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>
          <strong style={{ color: diff >= 0 ? "#34D399" : "#FB5C8C" }}>
            {diff >= 0 ? "▲" : "▼"} {Math.abs(diff)} pts
          </strong>{" "}
          vs. ciclo {(cycleNumber ?? 1) - 1}
        </span>
      )}
    </div>
  );
}

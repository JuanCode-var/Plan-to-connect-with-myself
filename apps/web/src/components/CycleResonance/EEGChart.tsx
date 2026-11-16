import { useMemo, useState } from "react";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY } from "../NeuralCore/tokens";
import { dayStateFor } from "./resonanceTokens";
import { bestFlowDayIndex, dayOfWeek, findApagonRuns, findRecoveries, formatShortDateEs, type EEGDay } from "./eegAnalysis";

const VB_W = 1360;
const VB_H = 360;
const PL = 100;
const PW = 1220;
const PT = 30;
const PH = 280;

/**
 * "Electroencefalograma del ciclo" — puerto de EEG.dc.html. A diferencia
 * del mockup (que posiciona dots/etiquetas/tooltip como `<div>` HTML
 * absolutos encima de un SVG aparte, en coordenadas de diseño fijas), acá
 * TODO vive dentro de un único SVG con `viewBox` fijo y ancho fluido
 * (`width="100%"`) — mismo aprendizaje que Cerebro del ciclo: mezclar HTML
 * posicionado en px con un SVG que se achica no escala junto, y eso fue
 * justo el bug que rompió esa pantalla la primera vez.
 */
export function EEGChart({ days }: { days: EEGDay[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const N = days.length;
  const STEP = PW / (N - 1);
  const X = (i: number) => PL + i * STEP;
  const Y = (v: number) => PT + (1 - v / 100) * PH;

  const linePath = useMemo(() => {
    let d = `M${X(0).toFixed(1)} ${Y(days[0].percent).toFixed(1)}`;
    for (let i = 1; i < N; i++) {
      const x0 = X(i - 1);
      const y0 = Y(days[i - 1].percent);
      const x1 = X(i);
      const y1 = Y(days[i].percent);
      const h = (x1 - x0) / 2;
      d += ` C${(x0 + h).toFixed(1)} ${y0.toFixed(1)} ${(x1 - h).toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const areaPath = `${linePath} L${X(N - 1).toFixed(1)} ${Y(0).toFixed(1)} L${X(0).toFixed(1)} ${Y(0).toFixed(1)} Z`;

  const runs = findApagonRuns(days);
  const recoveries = findRecoveries(days);
  const flowIdx = bestFlowDayIndex(days);

  // Cycles largos (muchos días transcurridos) harían ilegible una etiqueta
  // de eje X por día — se van salteando a partir de cierta densidad, los
  // puntos del gráfico en sí nunca se saltean (esos son el dato real).
  const labelStep = N <= 35 ? 1 : N <= 70 ? 2 : 3;

  const todayIndex = N - 1;
  const hv = hoverIndex;

  return (
    <div className="relative w-full">
      <svg
        role="img"
        aria-label={`Electroencefalograma de los últimos ${N} días del ciclo. Cada punto es un día; el fondo muestra en qué estado estuvo tu núcleo.`}
        width="100%"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ display: "block", overflow: "visible" }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="eegArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="eegStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="55%" stopColor="#7DE3F4" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
          <filter id="eegGlow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation={5} />
          </filter>
        </defs>

        {/* Bandas de fondo por estado — sección 1 del pedido. */}
        <rect x={PL} y={Y(100)} width={PW} height={Y(87) - Y(100)} fill="#A78BFA" fillOpacity={0.1} />
        <rect x={PL} y={Y(87)} width={PW} height={Y(58) - Y(87)} fill="#38BDF8" fillOpacity={0.06} />
        <rect x={PL} y={Y(58)} width={PW} height={Y(29) - Y(58)} fill="#22D3EE" fillOpacity={0.03} />
        <rect x={PL} y={Y(29)} width={PW} height={Y(0) - Y(29)} fill="#FB5C8C" fillOpacity={0.05} />
        <g stroke="rgba(255,255,255,0.10)" strokeWidth={1} strokeDasharray="4 6">
          <line x1={PL} x2={PL + PW} y1={Y(87)} y2={Y(87)} />
          <line x1={PL} x2={PL + PW} y1={Y(58)} y2={Y(58)} />
          <line x1={PL} x2={PL + PW} y1={Y(29)} y2={Y(29)} />
        </g>
        <text x={16} y={(Y(100) + Y(87)) / 2 + 4} fontFamily={NEURAL_FONT_BODY} fontSize={13} fontWeight={600} fill="#A78BFA">
          Flow
        </text>
        <text x={16} y={(Y(87) + Y(58)) / 2 + 4} fontFamily={NEURAL_FONT_BODY} fontSize={13} fontWeight={600} fill="#38BDF8">
          Enfoque
        </text>
        <text x={16} y={(Y(58) + Y(29)) / 2 + 4} fontFamily={NEURAL_FONT_BODY} fontSize={13} fontWeight={600} fill="#22D3EE">
          Despertar
        </text>
        <text x={16} y={(Y(29) + Y(0)) / 2 + 4} fontFamily={NEURAL_FONT_BODY} fontSize={13} fontWeight={600} fill="#FB5C8C">
          Latente
        </text>

        {/* Línea + área — sección 2. */}
        <path className="eeg-area" d={areaPath} fill="url(#eegArea)" />
        <path className="eeg-line" d={linePath} fill="none" stroke="#22D3EE" strokeOpacity={0.6} strokeWidth={7} filter="url(#eegGlow)" />
        <path className="eeg-line" d={linePath} fill="none" stroke="url(#eegStroke)" strokeWidth={2.5} strokeLinecap="round" />

        {/* Flechas de recuperación — sección 4. */}
        {recoveries.map((r) => {
          const x0 = X(r.runEndIndex) + 8;
          const y0 = Y(days[r.runEndIndex].percent) - 10;
          const x1 = X(r.recoveryIndex) - 6;
          const y1 = Y(r.percent) + 10;
          return (
            <path
              key={r.runEndIndex}
              d={`M${x0} ${y0} C${x0 + 20} ${Y(30)} ${x1 - 20} ${Y(Math.min(60, r.percent))} ${x1} ${y1}`}
              fill="none"
              stroke="#FDE68A"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          );
        })}

        {/* Puntos por día — sección 3. */}
        {days.map((d, i) => {
          const state = dayStateFor(d.percent);
          const apagon = d.percent < 29;
          const isToday = i === todayIndex;
          const size = hv === i ? 14 : apagon ? 12 : 9;
          const cx = X(i);
          const cy = Y(d.percent);
          return (
            <circle
              key={d.date}
              className="eeg-dot"
              style={{ animationDelay: `${(0.3 + i * 0.05).toFixed(2)}s` }}
              cx={cx}
              cy={cy}
              r={size / 2}
              fill={apagon ? "#0E1330" : isToday ? "#FFFFFF" : state.color}
              stroke={apagon ? "#FB5C8C" : "#0E1330"}
              strokeWidth={2}
              filter="url(#eegGlow)"
            />
          );
        })}
        {/* "Hoy": aro que late, separado del punto (mismo criterio que el mockup: el pulso es un elemento aparte encima del dot). */}
        <circle
          className="eeg-now"
          style={{ transformOrigin: `${X(todayIndex)}px ${Y(days[todayIndex].percent)}px` }}
          cx={X(todayIndex)}
          cy={Y(days[todayIndex].percent)}
          r={8}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2}
        />

        {/* Anotaciones automáticas — sección 4. */}
        {runs.map((run) => {
          const midX = (X(run.startIndex) + X(run.endIndex)) / 2;
          const text = `Apagón · ${run.days} ${run.days === 1 ? "día" : "días"}`;
          return <AnnotationPill key={`run-${run.startIndex}`} x={midX} y={Y(0) - 40} text={text} color="#FB5C8C" />;
        })}
        {recoveries.map((r) => (
          <AnnotationPill
            key={`rec-${r.runEndIndex}`}
            x={X(r.recoveryIndex)}
            y={Y(r.percent) - 42}
            text={`Volviste con ${r.percent}% al día siguiente`}
            color="#FDE68A"
          />
        ))}
        {flowIdx !== null && (
          <AnnotationPill x={X(flowIdx)} y={Y(days[flowIdx].percent) - 38} text={`Tu día en Flow · ${days[flowIdx].percent}%`} color="#A78BFA" />
        )}

        {/* Eje X — días + fines de semana en lavanda (sección 5). */}
        {days.map((d, i) => {
          if (i !== todayIndex && i % labelStep !== 0) return null;
          const isToday = i === todayIndex;
          const weekend = dayOfWeek(d.date) === 0 || dayOfWeek(d.date) === 6;
          const dayNum = Number(d.date.slice(8, 10));
          return (
            <text
              key={d.date}
              x={X(i)}
              y={PT + PH + 24}
              textAnchor="middle"
              fontFamily={NEURAL_FONT_BODY}
              fontSize={11}
              fontWeight={isToday ? 600 : 400}
              fill={isToday ? "#FFFFFF" : weekend ? "#C4B5FD" : "#A9B1D6"}
            >
              {isToday ? "Hoy" : String(dayNum).padStart(2, "0")}
            </text>
          );
        })}

        {/* Línea guía + columnas invisibles para hover/foco por teclado — sección 5. */}
        {hv !== null && (
          <line
            x1={X(hv)}
            x2={X(hv)}
            y1={PT}
            y2={PT + PH}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1}
            style={{ pointerEvents: "none" }}
          />
        )}
        {days.map((d, i) => (
          <rect
            key={d.date}
            className="eeg-col"
            x={X(i) - STEP / 2}
            y={PT}
            width={STEP}
            height={PH + 40}
            fill="transparent"
            role="button"
            tabIndex={0}
            aria-label={`${formatShortDateEs(d.date)}: ${d.percent}%, ${dayStateFor(d.percent).label}${i === todayIndex ? " (en curso)" : ""}`}
            onMouseEnter={() => setHoverIndex(i)}
            onFocus={() => setHoverIndex(i)}
            onClick={() => setHoverIndex(i)}
            onBlur={() => setHoverIndex((prev) => (prev === i ? null : prev))}
          />
        ))}

        {/* Tooltip — sección 5. */}
        {hv !== null && <Tooltip day={days[hv]} isToday={hv === todayIndex} x={X(hv)} y={Y(days[hv].percent)} />}
      </svg>
    </div>
  );
}

function AnnotationPill({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  const width = text.length * 6.6 + 20;
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={x - width / 2} y={y - 14} width={width} height={26} rx={13} fill="rgba(14,19,48,0.9)" stroke={color} strokeWidth={1} />
      <text x={x} y={y + 4} textAnchor="middle" fontFamily={NEURAL_FONT_BODY} fontSize={12} fontWeight={600} fill={color}>
        {text}
      </text>
    </g>
  );
}

function Tooltip({ day, isToday, x, y }: { day: EEGDay; isToday: boolean; x: number; y: number }) {
  const state = dayStateFor(day.percent);
  const label = day.percent < 29 ? "Apagón" : state.label;
  const width = 150;
  const left = Math.min(x + 16, PL + PW - width);
  const top = Math.max(PT - 20, y - 96);
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={left} y={top} width={width} height={74} rx={12} fill="rgba(14,19,48,0.95)" stroke={state.color} strokeWidth={1} />
      <text x={left + 12} y={top + 22} fontFamily={NEURAL_FONT_BODY} fontSize={12} fill="#A9B1D6">
        {formatShortDateEs(day.date)}
        {isToday ? " · en curso" : ""}
      </text>
      <text x={left + 12} y={top + 48} fontFamily={NEURAL_FONT_DISPLAY} fontSize={22} fontWeight={700} fill="#FFFFFF">
        {day.percent}%
      </text>
      <text x={left + 12} y={top + 66} fontFamily={NEURAL_FONT_BODY} fontSize={12} fontWeight={600} fill={state.color}>
        {label}
      </text>
    </g>
  );
}

import type { CSSProperties } from "react";
import type { CoreStateKey } from "./brainTokens";
import { scale } from "./tokens";

const AURA_SIZE = scale(540);

const AURA_BY_STATE: Record<CoreStateKey, { style: CSSProperties; className?: string }> = {
  latente: {
    style: { background: "radial-gradient(circle, rgba(124,92,255,.14), transparent 70%)" },
  },
  despertar: {
    style: { background: "radial-gradient(circle, rgba(34,211,238,.24), transparent 70%)" },
    className: "neural-aura-breathe",
  },
  enfoque: {
    style: {
      background: "conic-gradient(from 0deg, #22D3EE, #7C5CFF, #FB5C8C, #22D3EE)",
      filter: "blur(50px)",
      opacity: 0.7,
      animationDuration: "12s",
    },
    className: "neural-aura-spin",
  },
  flow: {
    style: {
      background: "conic-gradient(from 0deg, #22D3EE, #C4B5FD, #34D399, #22D3EE)",
      filter: "blur(46px)",
      opacity: 0.85,
      animationDuration: "6s",
    },
    className: "neural-aura-spin",
  },
  pleno: {
    style: {
      background: "conic-gradient(from 0deg, #FDE68A, #C4B5FD, #22D3EE, #FDE68A)",
      filter: "blur(44px)",
      opacity: 1,
      animationDuration: "4s",
    },
    className: "neural-aura-spin",
  },
};

/** Aura circular (540px) detrás del cerebro — distinta por estado del núcleo (sección 5 del pedido). */
export function CoreAura({ state }: { state: CoreStateKey }) {
  const { style, className } = AURA_BY_STATE[state];
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className ?? ""}`}
      style={{
        width: AURA_SIZE,
        height: AURA_SIZE,
        borderRadius: "50%",
        left: "50%",
        top: "50%",
        // Centrado con márgenes negativos (no `transform: translate(-50%,-50%)`):
        // las clases de animación de abajo también animan `transform`
        // (scale/rotate) — es una sola propiedad CSS, así que un `transform`
        // inline de centrado se perdería al aplicarse el keyframe.
        marginLeft: -AURA_SIZE / 2,
        marginTop: -AURA_SIZE / 2,
        zIndex: -1,
        ...style,
      }}
    />
  );
}

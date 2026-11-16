import type { ReactNode } from "react";
import { BRAIN_IDENTITY_PHRASE, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY } from "../NeuralCore/tokens";
import { MiniBrainSVG } from "./MiniBrainSVG";

type Shared = { cycleNumber: number };

type RealCardProps = Shared & {
  variant: "real";
  totalDays: number;
  stateLabel: string;
  percentByArea: Record<BrainArea, number | null>;
  percent: number;
  identityArea: BrainArea | null;
};

type GhostCardProps = Shared & { variant: "ghost" };

type CurrentCardProps = Shared & {
  variant: "current";
  currentDay: number;
  totalDays: number;
  stateLabel: string;
  percentByArea: Record<BrainArea, number | null>;
  percent: number;
  identityArea: BrainArea | null;
  projectedClosePercent: number | null;
};

type FutureCardProps = Shared & {
  variant: "future";
  percentByArea: Record<BrainArea, number | null>;
  focusArea: BrainArea;
  focusAreaLabel: string;
  futureIdentitySentence: string;
  daysUntilStart: number;
};

type Props = RealCardProps | GhostCardProps | CurrentCardProps | FutureCardProps;

const EMPTY_AREAS: Record<BrainArea, number | null> = { men: null, esp: null, emo: null, eco: null, fis: null, hab: null };

function Shell({ border, background, boxShadow, children }: { border: string; background: string; boxShadow?: string; children: ReactNode }) {
  return (
    <div
      className="vs-card flex flex-shrink-0 flex-col gap-1.5"
      style={{ width: 240, boxSizing: "border-box", padding: 18, borderRadius: 20, border, background, boxShadow: boxShadow ?? "none" }}
    >
      {children}
    </div>
  );
}

function TitleRow({ cycleNumber, chip, chipColor }: { cycleNumber: number; chip: string | null; chipColor: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>Tú v{cycleNumber}</span>
      {chip && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1px",
            color: chipColor,
            padding: "4px 9px",
            borderRadius: 999,
            border: `1px solid ${chipColor}`,
            whiteSpace: "nowrap",
          }}
        >
          {chip}
        </span>
      )}
    </div>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 12, color: "#A9B1D6", fontFamily: NEURAL_FONT_BODY }}>{children}</span>;
}

function Extra({ children }: { children?: ReactNode }) {
  return <span style={{ fontSize: 12, color: "#A9B1D6", minHeight: 16, fontFamily: NEURAL_FONT_BODY }}>{children}</span>;
}

function IdentityBox({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div
      className="mt-auto box-border rounded-xl"
      style={{ padding: "10px 12px", fontSize: 13, lineHeight: 1.45, fontStyle: "italic", color, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", minHeight: 58 }}
    >
      {children}
    </div>
  );
}

function PercentRow({ value, color, label }: { value: string; color: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 34, fontWeight: 700, lineHeight: 1, color }}>{value}</span>
      <span style={{ fontSize: 12, color: "#A9B1D6", fontFamily: NEURAL_FONT_BODY }}>{label}</span>
    </div>
  );
}

function GhostCard({ cycleNumber }: GhostCardProps) {
  return (
    <Shell border="1px dashed rgba(255,255,255,0.16)" background="transparent">
      <TitleRow cycleNumber={cycleNumber} chip="SIN DATOS" chipColor="#64748B" />
      <Sub>Ciclo {cycleNumber} · no se registró en la app</Sub>
      <MiniBrainSVG percentByArea={EMPTY_AREAS} ghost ariaLabel={`Versión ${cycleNumber} sin datos`} />
      <PercentRow value="—" color="#64748B" label="sin registro" />
      <Extra />
      <IdentityBox color="#A9B1D6">Esta versión existió, pero no quedó medida.</IdentityBox>
    </Shell>
  );
}

function RealCard(props: RealCardProps) {
  return (
    <Shell border="1px solid rgba(255,255,255,0.10)" background="rgba(255,255,255,0.03)">
      <TitleRow cycleNumber={props.cycleNumber} chip={null} chipColor="" />
      <Sub>
        Ciclo {props.cycleNumber} · {props.totalDays} días · {props.stateLabel}
      </Sub>
      <MiniBrainSVG percentByArea={props.percentByArea} ariaLabel={`Cerebro de la versión ${props.cycleNumber}: ${props.percent} %`} />
      <PercentRow value={`${props.percent}%`} color="#FFFFFF" label="carga del ciclo" />
      <Extra />
      <IdentityBox color="#E6E9F5">
        {props.identityArea ? `"${BRAIN_IDENTITY_PHRASE[props.identityArea]}"` : "Todavía sin una identidad medible este ciclo."}
      </IdentityBox>
    </Shell>
  );
}

function CurrentCard(props: CurrentCardProps) {
  return (
    <Shell
      border="1px solid rgba(56,189,248,0.6)"
      background="linear-gradient(170deg, rgba(56,189,248,0.14), rgba(255,255,255,0.03))"
      boxShadow="0 0 30px rgba(56,189,248,0.18)"
    >
      <TitleRow cycleNumber={props.cycleNumber} chip="HOY" chipColor="#38BDF8" />
      <Sub>
        Ciclo {props.cycleNumber} · día {props.currentDay} de {props.totalDays} · {props.stateLabel}
      </Sub>
      <MiniBrainSVG percentByArea={props.percentByArea} ariaLabel={`Cerebro de tu versión actual: ${props.percent} %`} />
      <PercentRow value={`${props.percent}%`} color="#38BDF8" label="carga hasta hoy" />
      <Extra>{props.projectedClosePercent !== null && `Cierre proyectado ≈ ${props.projectedClosePercent} %`}</Extra>
      <IdentityBox color="#E6E9F5">
        {props.identityArea ? `"${BRAIN_IDENTITY_PHRASE[props.identityArea]}"` : "Todavía sin una identidad medible este ciclo."}
      </IdentityBox>
    </Shell>
  );
}

function FutureCard(props: FutureCardProps) {
  return (
    <Shell border="1px dashed rgba(196,181,253,0.6)" background="rgba(124,92,255,0.06)">
      <TitleRow cycleNumber={props.cycleNumber} chip="EN DISEÑO" chipColor="#C4B5FD" />
      <Sub>
        Ciclo {props.cycleNumber} · empieza en {props.daysUntilStart} días
      </Sub>
      <MiniBrainSVG
        percentByArea={props.percentByArea}
        pulseArea={props.focusArea}
        ariaLabel={`Cerebro de tu próxima versión, con ${props.focusAreaLabel} encendida`}
      />
      <PercentRow value="?" color="#C4B5FD" label="la escribes tú" />
      <Extra>Región elegida: {props.focusAreaLabel}</Extra>
      <IdentityBox color="#FFFFFF">{props.futureIdentitySentence}</IdentityBox>
    </Shell>
  );
}

/**
 * Una tarjeta de "Versiones de ti" — 4 variantes (secciones 1/2/3/4 del
 * pedido): real (un ciclo pasado con datos), fantasma (ciclo pasado SIN
 * ningún HabitLog, nunca un % inventado), actual ("HOY", con cierre
 * proyectado) y futura ("EN DISEÑO", con la región elegida pulsando).
 */
export function VersionCard(props: Props) {
  switch (props.variant) {
    case "ghost":
      return <GhostCard {...props} />;
    case "real":
      return <RealCard {...props} />;
    case "current":
      return <CurrentCard {...props} />;
    case "future":
      return <FutureCard {...props} />;
  }
}

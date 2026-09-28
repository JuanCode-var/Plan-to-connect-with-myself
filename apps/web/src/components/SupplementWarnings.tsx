import { useState } from "react";

// Ámbar fijo (no var(--accent)): --accent ya es el dorado de marca para
// CTAs/racha/celebración; un aviso de seguridad necesita su propio canal de
// color para no competir con ese significado. Mismo ámbar que el badge de
// racha (ver TrackerMatrix/TodayProgress), aplicado como wash de fondo (igual
// técnica que CounterChip en Dashboard.tsx: hex + alpha en vez de un token
// nuevo) para que funcione en claro y oscuro sin declarar --warn en index.css.
const WARN = "#D97706";

export function SupplementWarnings() {
  const [expanded, setExpanded] = useState(true);

  return (
    <section
      className="rounded-xl border p-4"
      style={{ background: `${WARN}1A`, borderColor: `${WARN}4D` }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left font-semibold"
        style={{ color: WARN }}
      >
        <span>⚠ Advertencias sobre suplementos</span>
        <span aria-hidden>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <ul
          className="mt-3 list-disc space-y-1 pl-5 text-sm"
          style={{ color: "var(--text-2)" }}
        >

          <li>
            El Neurobion (150 mg de vitamina B6) no se incluye como hábito diario
            automático ni debe usarse prolongadamente sin valoración profesional.
          </li>
          <li>
            La melatonina es condicional: no combinar con alcohol, no usar para
            compensar trasnochos.
          </li>
          <li>
            La creatina se registra como 3 g diarios, no como dosis de energía
            inmediata.
          </li>
          <li>
            Melena de león y levadura de cerveza son opcionales; evidencia limitada
            en humanos.
          </li>
          <li>
            Los suplementos no sustituyen sueño, alimentación, tratamiento de salud
            mental ni ayuda profesional para ludopatía o consumo problemático de
            alcohol.
          </li>
          <li>
            La app es una herramienta de seguimiento personal, no un diagnóstico ni
            tratamiento médico o psicológico.
          </li>
        </ul>
      )}
    </section>
  );
}

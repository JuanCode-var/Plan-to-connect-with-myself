import { useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

/**
 * Lienzo para dibujar la firma a mano (mouse, trackpad o dedo en celular) —
 * nunca tipeada. El papel es SIEMPRE claro con tinta oscura, sin importar el
 * tema de la app (claro/oscuro): una firma real se hace con tinta sobre
 * papel, no "en modo oscuro" — es una elección de diseño a propósito para
 * que se sienta como firmar un documento de verdad, no un widget más de la
 * UI. `onChange` recibe el PNG en base64 recién el usuario levanta el lápiz
 * (no en cada frame del trazo).
 */
export function SignaturePad({
  onChange,
  height = 180,
}: {
  onChange: (dataUrl: string) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // El canvas se redimensiona al ancho real del contenedor (responsive) y se
  // escala por devicePixelRatio para que el trazo no se vea borroso en
  // pantallas retina — sin esto, una firma dibujada en una laptop de alta
  // densidad queda pixelada.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const prevDrawing = canvas.toDataURL();
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Reset explícito antes de escalar: cambiar canvas.width/height ya
        // reinicia la matriz de transformación por sí solo, pero dejarlo
        // explícito evita cualquier escalado acumulado si este efecto
        // alguna vez corre dos veces seguidas sin pasar por ese reset.
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#1a2033";
        ctx.lineWidth = 2.4;
      }
      // Restaura el trazo si ya había algo dibujado antes del resize (ej. al
      // rotar el celular) — sin esto, cambiar de tamaño borraba la firma a
      // mitad de dibujarla.
      if (!isEmpty) {
        const img = new Image();
        img.onload = () => ctx?.drawImage(img, 0, 0, width, height);
        img.src = prevDrawing;
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    canvas?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const point = pointFromEvent(e);
    lastPointRef.current = point;
    setIsEmpty(false);
    // Un punto visible ya en el click inicial (antes de cualquier
    // movimiento) — como un marcador real, que deja marca apenas toca el
    // papel, no recién cuando empieza a moverse.
    if (ctx) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const last = lastPointRef.current;
    if (!canvas || !ctx || !last) return;

    const point = pointFromEvent(e);
    // Curva cuadrática entre el punto medio de los últimos dos segmentos en
    // vez de líneas rectas segmento a segmento: así el trazo se ve como un
    // gesto fluido de pluma y no como una polilínea angulosa.
    const mid = { x: (last.x + point.x) / 2, y: (last.y + point.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
    ctx.stroke();
    lastPointRef.current = point;
  }

  function handlePointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange("");
  }

  return (
    // `w-full` acá adentro (no solo en quien lo usa) a propósito: este
    // componente vive dentro de contenedores `flex` con `items-start`
    // (WordDocument.tsx), donde un hijo sin ancho propio ni contenido
    // intrínseco se achica a su mínimo — el lienzo quedaba comprimido a
    // unos pocos píxeles de ancho (una rayita vertical), invisible. Al ser
    // el propio componente el que fuerza su ancho, funciona sin importar
    // cómo lo envuelva quien lo use.
    <div className="flex w-full flex-col gap-2">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border-2"
        style={{ borderColor: "#c9bfa0", background: "#faf6ec", height }}
      >
        {/* Línea de firma + "X" inicial, como en un documento impreso — se
            dibuja en DOM (no en el canvas) para que nunca se borre al limpiar. */}
        <div
          className="pointer-events-none absolute inset-x-6 bottom-9 border-b"
          style={{ borderColor: "#b9ac85" }}
        />
        <span
          className="pointer-events-none absolute bottom-7 left-6 text-sm font-semibold"
          style={{ color: "#b9ac85" }}
        >
          ×
        </span>
        {isEmpty && (
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm italic"
            style={{ color: "#a89a74" }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M13.3 3.3a1.8 1.8 0 0 1 2.5 2.5L6.5 15.1l-3.3.8.8-3.3 9.3-9.3z" />
            </svg>
            Haz clic y arrastra para firmar, como con un marcador
          </span>
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none"
          style={{ cursor: "crosshair" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      {!isEmpty && (
        <button
          type="button"
          onClick={clear}
          className="self-start text-xs font-semibold underline underline-offset-2"
          style={{ color: "var(--text-2)" }}
        >
          Borrar y firmar de nuevo
        </button>
      )}
    </div>
  );
}

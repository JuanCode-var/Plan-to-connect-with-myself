import { useEffect, useRef } from "react";
import type { BackgroundScene } from "../lib/backgroundContext";

type Particle = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  phase: number;
  speed: number;
  drift: number;
  accent: boolean;
  colorIndex: number;
};

type ShootingStar = { x: number; y: number; vx: number; vy: number; life: number };

// --- Escena "neural": red de neuronas con axones/dendritas ramificados
// (no una constelación de puntos con líneas rectas) e impulsos que viajan
// sobre la curva real de cada conexión y pueden disparar nuevos impulsos al
// llegar a destino. Todo esto se calcula una sola vez por resize (nodos,
// enlaces, adyacencia); solo la posición de cada impulso y el "calor"
// (brillo temporal) de cada enlace cambian cuadro a cuadro.
type NeuralLayer = 0 | 1 | 2; // 0 = capa trasera (tenue, lejana), 2 = frontal (brillante)

type DendriteStub = { angle: number; length: number; bend: number };

type Neuron = {
  bx: number;
  by: number;
  x: number;
  y: number;
  layer: NeuralLayer;
  r: number;
  baseAlpha: number;
  colorIndex: number;
  glow: boolean;
  phase: number;
  jitterAmp: number;
  jitterFreq: number;
  links: number[];
  dendrites: DendriteStub[];
};

type NeuralLink = {
  a: number;
  b: number;
  bend: number;
  layer: NeuralLayer;
  width: number;
  baseAlpha: number;
  heat: number;
};

type NeuralImpulse = {
  linkIndex: number;
  reverse: boolean;
  t: number;
  speedPerMs: number;
  colorIndex: number;
};

type SynapticFlash = { x: number; y: number; life: number };

// Partículas por px² (con tope y piso en buildParticles) — suficientes para
// dar sensación de profundidad sin sobrecargar el canvas en pantallas grandes.
const DENSITY = 1 / 9000;

const NEURON_DENSITY = 1 / 7500;
const NEURON_CAP_MOBILE = 55;
const NEURON_CAP_DESKTOP = 150;
const NEURON_FLOOR = 24;

// Radio de búsqueda de vecinos cercanos (enlaces "primarios", tipo axón a
// una región próxima) vs. enlaces "largos" ocasionales que cruzan a
// regiones lejanas (ver sección 4 del pedido: "capa posterior... conexiones
// entre regiones lejanas").
const NEURAL_NEIGHBOR_RADIUS = 170;
const NEURAL_LINKS_PER_NODE = 3;
const NEURAL_LONGRANGE_CHANCE = 0.1;
const NEURAL_LONGRANGE_RADIUS = 420;
const NEURAL_MAX_LINKS_MOBILE = 130;
const NEURAL_MAX_LINKS_DESKTOP = 300;

const NEURAL_MAX_PULSES_MOBILE = 5;
const NEURAL_MAX_PULSES_DESKTOP = 10;
const NEURAL_PROPAGATE_CHANCE = 0.55;
// Probabilidad por milisegundo de que surja un impulso "ambiental" en una
// conexión al azar — fuera de las ondas sincronizadas, mantiene la red con
// actividad baja y continua (promedio ~1 cada 2s).
const NEURAL_TRICKLE_CHANCE_PER_MS = 0.0005;
const NEURAL_BURST_MIN_MS = 2600;
const NEURAL_BURST_MAX_MS = 5200;
const NEURAL_BURST_LINKS: [number, number] = [3, 5];
const NEURAL_HEAT_DECAY_PER_MS = 0.0022;
const NEURAL_DENDRITE_MIN = 1;
const NEURAL_DENDRITE_MAX = 3;

function readCssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Fondo animado (canvas) para las 10 secciones: red neuronal con impulsos
 * viajando entre nodos (escena por defecto), estrellas parpadeando, un
 * campo espacial a la deriva, o nieve cayendo — elección del usuario vía
 * BackgroundPicker (ver ProfileMenu.tsx), persistida en
 * BackgroundProvider. Vive como primer hijo de `<main>` (ver AppShell.tsx),
 * que tiene `position: relative; isolation: isolate` para aislar su propio
 * contexto de apilamiento — así el `z-index` negativo del canvas es
 * inequívoco (sin depender de cómo cada navegador ordena hijos de un
 * contenedor flex) y solo compite con lo que hay dentro de `<main>`. Las
 * superficies opacas (--surface) de tarjetas y tablas lo tapan con
 * normalidad; sidebar y header quedan fuera de `<main>`, así que nunca lo
 * muestran. Se ajusta con ResizeObserver al tamaño real del contenedor (no
 * al viewport), porque `<main>` puede crecer más que la pantalla con tablas
 * largas.
 *
 * La escena "neural" NO es una constelación de puntos con líneas rectas:
 * cada neurona tiene enlaces primarios (vecinos cercanos, vía grilla
 * espacial — O(n), no O(n²)) y ocasionales enlaces largos a regiones
 * lejanas, dibujados como curvas (bézier cuadrática) en vez de segmentos.
 * Los impulsos recorren la curva real de su enlace (interpolación, nunca
 * una posición al azar) y, al llegar a destino, pueden propagar un nuevo
 * impulso por otro enlace saliente de esa neurona — así una señal se
 * extiende por la red en vez de aparecer y desaparecer aislada. La
 * topología (qué neurona conecta con cuál) se calcula una sola vez por
 * resize; cuadro a cuadro solo avanza la posición de cada impulso y el
 * "calor" (brillo temporal) de cada enlace.
 *
 * Reutiliza --text-2, --accent, --accent-blue, --accent-violet y --text
 * (nunca colores nuevos sueltos, ver convenciones del proyecto) leyéndolos
 * en vivo del DOM, así seguimos el tema claro/oscuro sin duplicar lógica de
 * theming acá. El loop se pausa del todo si la pestaña no está visible
 * (`visibilitychange`), para las 4 escenas.
 */
export function AnimatedBackground({ scene }: { scene: BackgroundScene }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const parent = canvas?.parentElement;
    if (!canvas || !ctx || !parent) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let shootingStar: ShootingStar | null = null;

    let neurons: Neuron[] = [];
    let links: NeuralLink[] = [];
    let impulses: NeuralImpulse[] = [];
    let flashes: SynapticFlash[] = [];
    let burstTimer = 0;
    let nextBurstAt = 0;

    let raf = 0;
    let paused = false;
    let lastTime = 0;

    function buildParticles() {
      // Menos nodos en pantallas chicas (móvil) — mismo criterio que el
      // resto de la app para no sobrecargar un dispositivo más limitado.
      const cap = width < 640 ? 70 : 180;
      const count = Math.min(cap, Math.max(40, Math.round(width * height * DENSITY)));
      particles = Array.from({ length: count }, () => {
        const accent = Math.random() < 0.12;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r:
            scene === "snow"
              ? 1 + Math.random() * 2.2
              : accent
                ? 1.3 + Math.random() * 1.5
                : 0.6 + Math.random() * 1.2,
          alpha: 0.25 + Math.random() * 0.55,
          phase: Math.random() * Math.PI * 2,
          speed:
            scene === "space" ? 0.4 + Math.random() * 1.1 : scene === "snow" ? 0.5 + Math.random() * 1.2 : 0,
          drift: scene === "snow" ? 0.3 + Math.random() * 0.6 : 0.4 + Math.random() * 0.8,
          accent,
          colorIndex: Math.floor(Math.random() * 3),
        };
      });
    }

    function buildNeuralNetwork() {
      const mobile = width < 640;
      const count = Math.min(
        mobile ? NEURON_CAP_MOBILE : NEURON_CAP_DESKTOP,
        Math.max(NEURON_FLOOR, Math.round(width * height * NEURON_DENSITY)),
      );

      neurons = Array.from({ length: count }, () => {
        const layerRoll = Math.random();
        const layer: NeuralLayer = layerRoll < 0.45 ? 0 : layerRoll < 0.8 ? 1 : 2;
        const colorRoll = Math.random();
        const colorIndex = colorRoll < 0.5 ? 0 : colorRoll < 0.85 ? 1 : 2;
        const x = Math.random() * width;
        const y = Math.random() * height;
        const sizeBase = layer === 0 ? 0.6 : layer === 1 ? 1.1 : 1.7;
        const dendriteCount =
          NEURAL_DENDRITE_MIN + Math.floor(Math.random() * (NEURAL_DENDRITE_MAX - NEURAL_DENDRITE_MIN + 1));
        return {
          bx: x,
          by: y,
          x,
          y,
          layer,
          r: sizeBase + Math.random() * (layer === 2 ? 1.1 : 0.7),
          baseAlpha:
            layer === 0
              ? 0.22 + Math.random() * 0.16
              : layer === 1
                ? 0.38 + Math.random() * 0.18
                : 0.55 + Math.random() * 0.3,
          colorIndex,
          glow: layer === 2 && Math.random() < 0.6,
          phase: Math.random() * Math.PI * 2,
          jitterAmp: reduceMotion ? 0 : 1.2 + Math.random() * 1.6,
          jitterFreq: 0.0006 + Math.random() * 0.0008,
          links: [],
          dendrites: Array.from({ length: dendriteCount }, () => ({
            angle: Math.random() * Math.PI * 2,
            length: 5 + Math.random() * 14,
            bend: (Math.random() - 0.5) * 0.9,
          })),
        };
      });

      // Grilla espacial para buscar vecinos sin comparar cada neurona con
      // todas las demás (O(n), no O(n²) — importante al tener más nodos que
      // la versión anterior de esta escena).
      const cellSize = NEURAL_NEIGHBOR_RADIUS;
      const grid = new Map<string, number[]>();
      function cellKeyOf(x: number, y: number) {
        return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
      }
      neurons.forEach((n, i) => {
        const key = cellKeyOf(n.x, n.y);
        const bucket = grid.get(key);
        if (bucket) bucket.push(i);
        else grid.set(key, [i]);
      });
      function nearby(x: number, y: number, radius: number): number[] {
        const result: number[] = [];
        const cellRadius = Math.ceil(radius / cellSize);
        const cx = Math.floor(x / cellSize);
        const cy = Math.floor(y / cellSize);
        for (let gx = cx - cellRadius; gx <= cx + cellRadius; gx++) {
          for (let gy = cy - cellRadius; gy <= cy + cellRadius; gy++) {
            const bucket = grid.get(`${gx},${gy}`);
            if (bucket) result.push(...bucket);
          }
        }
        return result;
      }

      links = [];
      const linkKeys = new Set<string>();
      const maxLinks = mobile ? NEURAL_MAX_LINKS_MOBILE : NEURAL_MAX_LINKS_DESKTOP;

      function addLink(i: number, j: number, primary: boolean) {
        if (links.length >= maxLinks) return;
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (linkKeys.has(key)) return;
        linkKeys.add(key);
        const a = neurons[i];
        const b = neurons[j];
        const layer = Math.min(a.layer, b.layer) as NeuralLayer;
        links.push({
          a: i,
          b: j,
          bend: (Math.random() - 0.5) * 0.7,
          layer,
          width: primary ? (layer === 2 ? 1.5 : layer === 1 ? 1.1 : 0.7) : 0.55,
          baseAlpha: primary ? (layer === 2 ? 0.26 : layer === 1 ? 0.18 : 0.1) : 0.06,
          heat: 0,
        });
        const linkIndex = links.length - 1;
        a.links.push(linkIndex);
        b.links.push(linkIndex);
      }

      neurons.forEach((n, i) => {
        const candidates = nearby(n.x, n.y, NEURAL_NEIGHBOR_RADIUS)
          .filter((j) => j !== i)
          .map((j) => ({ j, dist: Math.hypot(neurons[j].x - n.x, neurons[j].y - n.y) }))
          .filter((c) => c.dist < NEURAL_NEIGHBOR_RADIUS)
          .sort((c1, c2) => c1.dist - c2.dist)
          .slice(0, NEURAL_LINKS_PER_NODE);
        for (const c of candidates) {
          if (links.length >= maxLinks) break;
          addLink(i, c.j, true);
        }
        if (Math.random() < NEURAL_LONGRANGE_CHANCE && links.length < maxLinks) {
          const farCandidates = nearby(n.x, n.y, NEURAL_LONGRANGE_RADIUS)
            .filter((j) => j !== i)
            .map((j) => ({ j, dist: Math.hypot(neurons[j].x - n.x, neurons[j].y - n.y) }))
            .filter((c) => c.dist > NEURAL_NEIGHBOR_RADIUS && c.dist < NEURAL_LONGRANGE_RADIUS);
          if (farCandidates.length > 0) {
            const pick = farCandidates[Math.floor(Math.random() * farCandidates.length)];
            addLink(i, pick.j, false);
          }
        }
      });

      impulses = [];
      flashes = [];
      burstTimer = 0;
      nextBurstAt = NEURAL_BURST_MIN_MS + Math.random() * (NEURAL_BURST_MAX_MS - NEURAL_BURST_MIN_MS);
    }

    function build() {
      if (scene === "neural") buildNeuralNetwork();
      else buildParticles();
    }

    function resize() {
      width = parent!.clientWidth;
      height = parent!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(parent);

    const dimColor = readCssVar("--text-2", "#9aacc9");
    const accentColor = readCssVar("--accent", "#19d9ff");
    const blueColor = readCssVar("--accent-blue", "#258bff");
    const violetColor = readCssVar("--accent-violet", "#8057ff");
    const whiteBlue = readCssVar("--text", "#f3f6ff");
    const neuralColors = [accentColor, blueColor, violetColor];

    function controlPoint(ax: number, ay: number, bx: number, by: number, bend: number) {
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const dx = bx - ax;
      const dy = by - ay;
      const dist = Math.hypot(dx, dy) || 1;
      const px = -dy / dist;
      const py = dx / dist;
      const offset = dist * bend;
      return { cx: mx + px * offset, cy: my + py * offset };
    }

    function quadPoint(ax: number, ay: number, cx: number, cy: number, bx: number, by: number, t: number) {
      const mt = 1 - t;
      return {
        x: mt * mt * ax + 2 * mt * t * cx + t * t * bx,
        y: mt * mt * ay + 2 * mt * t * cy + t * t * by,
      };
    }

    function randomImpulseColor(): number {
      // Mayormente cian/azul eléctrico, violeta como acento escaso — nunca
      // verde ni amarillo (ver paleta pedida).
      const roll = Math.random();
      return roll < 0.55 ? 0 : roll < 0.9 ? 1 : 2;
    }

    function spawnImpulseOnRandomLink() {
      const linkIndex = Math.floor(Math.random() * links.length);
      impulses.push({
        linkIndex,
        reverse: Math.random() < 0.5,
        t: 0,
        speedPerMs: 0.00028 + Math.random() * 0.00032,
        colorIndex: randomImpulseColor(),
      });
    }

    function propagateFrom(neuronIdx: number, excludeLinkIndex: number) {
      const neuron = neurons[neuronIdx];
      const candidates = neuron.links.filter((li) => li !== excludeLinkIndex);
      if (candidates.length === 0) return;
      const linkIndex = candidates[Math.floor(Math.random() * candidates.length)];
      const link = links[linkIndex];
      impulses.push({
        linkIndex,
        reverse: link.b === neuronIdx,
        t: 0,
        speedPerMs: 0.00028 + Math.random() * 0.00032,
        colorIndex: randomImpulseColor(),
      });
    }

    function triggerBurst(maxPulses: number) {
      const candidates = neurons
        .map((n, i) => ({ i, count: n.links.length }))
        .filter((c) => c.count >= 2)
        .sort((a, b) => b.count - a.count);
      if (candidates.length === 0) return;
      const epicenter = candidates[Math.floor(Math.random() * Math.min(candidates.length, 10))].i;
      const neuron = neurons[epicenter];
      const [minFire, maxFire] = NEURAL_BURST_LINKS;
      const fireCount = Math.min(neuron.links.length, minFire + Math.floor(Math.random() * (maxFire - minFire + 1)));
      const shuffled = [...neuron.links].sort(() => Math.random() - 0.5).slice(0, fireCount);
      for (const linkIndex of shuffled) {
        if (impulses.length >= maxPulses) break;
        const link = links[linkIndex];
        impulses.push({
          linkIndex,
          reverse: link.b === epicenter,
          t: 0,
          speedPerMs: 0.00026 + Math.random() * 0.00026,
          colorIndex: randomImpulseColor(),
        });
      }
    }

    function updateNeuronPositions(t: number) {
      if (reduceMotion) return;
      for (const n of neurons) {
        n.x = n.bx + Math.sin(t * n.jitterFreq + n.phase) * n.jitterAmp;
        n.y = n.by + Math.cos(t * n.jitterFreq * 0.8 + n.phase) * n.jitterAmp;
      }
    }

    function updateImpulses(dt: number) {
      if (reduceMotion || links.length === 0) return;
      const maxPulses = width < 640 ? NEURAL_MAX_PULSES_MOBILE : NEURAL_MAX_PULSES_DESKTOP;

      if (impulses.length < maxPulses && Math.random() < dt * NEURAL_TRICKLE_CHANCE_PER_MS) {
        spawnImpulseOnRandomLink();
      }

      burstTimer += dt;
      if (burstTimer >= nextBurstAt) {
        burstTimer = 0;
        nextBurstAt = NEURAL_BURST_MIN_MS + Math.random() * (NEURAL_BURST_MAX_MS - NEURAL_BURST_MIN_MS);
        triggerBurst(maxPulses);
      }

      for (const link of links) {
        link.heat *= Math.max(0, 1 - NEURAL_HEAT_DECAY_PER_MS * dt);
      }

      const arrived: NeuralImpulse[] = [];
      for (const imp of impulses) {
        imp.t += imp.speedPerMs * dt;
        const link = links[imp.linkIndex];
        if (link) link.heat = Math.min(1, link.heat + 0.12);
        if (imp.t >= 1) arrived.push(imp);
      }
      impulses = impulses.filter((imp) => imp.t < 1);

      for (const imp of arrived) {
        const link = links[imp.linkIndex];
        if (!link) continue;
        const destIdx = imp.reverse ? link.a : link.b;
        const dest = neurons[destIdx];
        flashes.push({ x: dest.x, y: dest.y, life: 1 });
        if (impulses.length < maxPulses && Math.random() < NEURAL_PROPAGATE_CHANCE) {
          propagateFrom(destIdx, imp.linkIndex);
        }
      }

      for (const f of flashes) f.life -= dt * 0.0045;
      flashes = flashes.filter((f) => f.life > 0);
    }

    function drawNeural(t: number, dt: number) {
      updateNeuronPositions(t);
      updateImpulses(dt);

      ctx!.shadowBlur = 0;

      // Enlaces, capa por capa (atrás → adelante) para dar sensación de
      // profundidad: curvas (bézier cuadrática), no segmentos rectos. Las
      // conexiones "calientes" (con un impulso encima) se iluminan y el
      // brillo se apaga gradualmente en vez de cortar de golpe.
      for (let layer = 0; layer <= 2; layer++) {
        for (const link of links) {
          if (link.layer !== layer) continue;
          const a = neurons[link.a];
          const b = neurons[link.b];
          const { cx, cy } = controlPoint(a.x, a.y, b.x, b.y, link.bend);
          ctx!.globalAlpha = Math.min(1, link.baseAlpha + link.heat * 0.5);
          ctx!.strokeStyle = link.heat > 0.08 ? accentColor : dimColor;
          ctx!.lineWidth = link.width + link.heat * 1.4;
          if (link.heat > 0.12) {
            ctx!.shadowBlur = 6 * link.heat;
            ctx!.shadowColor = accentColor;
          } else {
            ctx!.shadowBlur = 0;
          }
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.quadraticCurveTo(cx, cy, b.x, b.y);
          ctx!.stroke();
        }
      }
      ctx!.shadowBlur = 0;

      // Dendritas: trazos cortos y finos que nacen de cada neurona con un
      // punto sináptico en la punta — textura orgánica barata (sin sombra,
      // un stroke + un punto por rama), da la sensación de ramificación
      // fina sin el costo de miles de nodos "reales".
      ctx!.strokeStyle = dimColor;
      ctx!.fillStyle = dimColor;
      ctx!.lineWidth = 0.6;
      for (const n of neurons) {
        ctx!.globalAlpha = n.baseAlpha * 0.4;
        for (const d of n.dendrites) {
          const ex = n.x + Math.cos(d.angle) * d.length;
          const ey = n.y + Math.sin(d.angle) * d.length;
          const midx =
            n.x + Math.cos(d.angle) * d.length * 0.55 + Math.cos(d.angle + Math.PI / 2) * d.length * d.bend;
          const midy =
            n.y + Math.sin(d.angle) * d.length * 0.55 + Math.sin(d.angle + Math.PI / 2) * d.length * d.bend;
          ctx!.beginPath();
          ctx!.moveTo(n.x, n.y);
          ctx!.quadraticCurveTo(midx, midy, ex, ey);
          ctx!.stroke();
          ctx!.beginPath();
          ctx!.arc(ex, ey, 0.6, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      // Cuerpos neuronales — "respiración" suave de alfa, color alternando
      // entre los 3 acentos, con brillo solo en las de capa frontal (costo
      // de shadowBlur acotado a una fracción de los nodos).
      for (const n of neurons) {
        const breathe = 0.85 + 0.15 * Math.sin(t * 0.0012 + n.phase);
        ctx!.globalAlpha = Math.min(1, n.baseAlpha * breathe);
        ctx!.fillStyle = neuralColors[n.colorIndex];
        if (n.glow) {
          ctx!.shadowBlur = 7;
          ctx!.shadowColor = neuralColors[n.colorIndex];
        } else {
          ctx!.shadowBlur = 0;
        }
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      // Impulsos: recorren la curva real de su conexión (interpolación
      // sobre la bézier, nunca una posición al azar por cuadro).
      for (const imp of impulses) {
        const link = links[imp.linkIndex];
        if (!link) continue;
        const a = neurons[link.a];
        const b = neurons[link.b];
        const { cx, cy } = controlPoint(a.x, a.y, b.x, b.y, link.bend);
        const tt = imp.reverse ? 1 - imp.t : imp.t;
        const p = quadPoint(a.x, a.y, cx, cy, b.x, b.y, tt);
        const fade = 1 - Math.pow(Math.abs(imp.t - 0.5) * 2, 2) * 0.35;
        ctx!.globalAlpha = Math.min(1, fade);
        ctx!.fillStyle = neuralColors[imp.colorIndex];
        ctx!.shadowBlur = 9;
        ctx!.shadowColor = neuralColors[imp.colorIndex];
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 2.1, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      // Destellos sinápticos: un breve resplandor blanco-azulado cuando un
      // impulso llega a destino, que se apaga enseguida.
      for (const f of flashes) {
        const radius = 3 + (1 - f.life) * 14;
        const gradient = ctx!.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius);
        gradient.addColorStop(0, whiteBlue);
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx!.globalAlpha = Math.max(0, f.life) * 0.9;
        ctx!.fillStyle = gradient;
        ctx!.beginPath();
        ctx!.arc(f.x, f.y, radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      ctx!.shadowBlur = 0;
    }

    function drawFrame(t: number) {
      const dt = lastTime ? Math.min(64, t - lastTime) : 16;
      lastTime = t;

      ctx!.clearRect(0, 0, width, height);

      if (scene === "neural") {
        drawNeural(t, dt);
        ctx!.globalAlpha = 1;
        ctx!.shadowBlur = 0;
        return;
      }

      for (const p of particles) {
        let alpha = p.alpha;
        let x = p.x;
        let y = p.y;

        if (scene === "stars") {
          alpha = p.alpha * (0.5 + 0.5 * Math.sin(t * 0.0011 * p.drift + p.phase));
        } else if (scene === "space") {
          y = (p.y + t * p.speed * 0.02) % height;
          x = (p.x + t * p.speed * 0.006) % width;
        } else {
          y = (p.y + t * p.speed * 0.03) % height;
          x = ((p.x + Math.sin(t * 0.0015 + p.phase) * p.drift * 10) % width + width) % width;
        }

        ctx!.beginPath();
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = p.accent ? accentColor : dimColor;
        ctx!.shadowBlur = p.accent ? 6 : 0;
        ctx!.shadowColor = accentColor;
        ctx!.arc(x, y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (scene === "stars" && !reduceMotion) {
        if (!shootingStar && Math.random() < 0.0015) {
          shootingStar = {
            x: Math.random() * width * 0.6,
            y: Math.random() * height * 0.3,
            vx: 6 + Math.random() * 4,
            vy: 3 + Math.random() * 2,
            life: 1,
          };
        }
        if (shootingStar) {
          const s = shootingStar;
          ctx!.globalAlpha = s.life;
          ctx!.strokeStyle = accentColor;
          ctx!.lineWidth = 1.6;
          ctx!.shadowBlur = 0;
          ctx!.beginPath();
          ctx!.moveTo(s.x, s.y);
          ctx!.lineTo(s.x - s.vx * 6, s.y - s.vy * 6);
          ctx!.stroke();
          s.x += s.vx;
          s.y += s.vy;
          s.life -= 0.02;
          if (s.life <= 0 || s.x > width || s.y > height) shootingStar = null;
        }
      }

      ctx!.globalAlpha = 1;
      ctx!.shadowBlur = 0;
    }

    function loop(time: number) {
      if (paused) return;
      drawFrame(time);
      raf = requestAnimationFrame(loop);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        paused = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (paused) {
        paused = false;
        lastTime = 0;
        if (!reduceMotion) raf = requestAnimationFrame(loop);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (reduceMotion) {
      drawFrame(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scene]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: -1 }}
    />
  );
}

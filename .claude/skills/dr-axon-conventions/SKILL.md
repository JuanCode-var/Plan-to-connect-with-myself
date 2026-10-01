---
name: dr-axon-conventions
description: Referencia rápida y condensada del proyecto Dr. Axón (stack, modelo de datos Prisma, colores por categoría de hábito, fórmulas de porcentaje, mapa de endpoints y rutas). Úsala en vez de releer openspec/config.yaml o openspec/changes/add-habit-tracker-app/design.md completos cada vez que se trabaje en apps/web o apps/api de este proyecto. Se activa con menciones de: hábito, tracking, checklist, ciclo, dashboard, resumen, prisma, schema, seed, categoría, porcentaje de cumplimiento, endpoint de la API.
---

# Convenciones del proyecto Dr. Axón — hoja de referencia

Esta hoja existe para que no tengas que reabrir `design.md` (7.5 KB) ni `config.yaml`
cada vez que toques este proyecto. Si necesitas el detalle completo de un requirement
o un scenario, ve a `openspec/changes/add-habit-tracker-app/specs/<capability>/spec.md`
— esta hoja es un resumen operativo, no la fuente de verdad de los requirements.

## Stack (no cambiar sin nueva propuesta en openspec/changes/)
- Monorepo npm workspaces: `apps/web` (React 18 + TS + Vite + react-router-dom +
  @tanstack/react-query + Tailwind + Recharts) y `apps/api` (Express + TS + Prisma
  + SQLite en `apps/api/data/dev.db`).
- Linter: `oxlint` desde la raíz (`npx oxlint`), no ESLint.
- Todo corre local: `apps/api` en `:4000`, `apps/web` en `:5173` (proxy `/api`).

## Modelo de datos (resumen — el detalle completo vive en design.md)
```
Habit          { id, name, moment, specification, category, sortOrder, active }
Cycle          { id, name, startDate, endDate }
HabitLog       { id, habitId, cycleId, date, status }  // @@unique([habitId, date])
EmotionalEntry { id, date, emotion, situation, feeling, impulse, decision, learning }
LibraryEntry   { id, section, source, title?, author?, content, createdAt }

enum HabitMoment    { MANANA, DIA, NOCHE, CIERRE_DEL_DIA }
enum HabitCategory  { PRIORIDAD_MAXIMA, SUPLEMENTO, OPCIONAL, HABITO_BASE, CONDICIONAL, AUTOCONOCIMIENTO }
enum LogStatus      { DONE, PENDING, NA }
enum LibrarySection { LIBRO, FRASE, FILOSOFIA }
enum LibrarySource  { SEED, USER }  // SEED = curado por la app, no se puede borrar desde la API
```
Borrar un `Cycle` (`DELETE /api/cycles/:id`) se lleva también sus `HabitLog` en
la misma transacción — decisión explícita del usuario, no default de Prisma
(la relación no tiene `onDelete: Cascade`).
Fechas: guardar siempre como fecha pura (medianoche UTC), nunca con hora local —
es la causa típica de bugs de "un día antes/después" en trackers de hábitos.

## Los 12 hábitos semilla (orden fijo, no reordenar)
1. Luz natural al despertar — Mañana — HABITO_BASE
2. Creatina monohidratada — Mañana — SUPLEMENTO
3. Melena de león — Mañana — OPCIONAL
4. Levadura de cerveza — Mañana — OPCIONAL
5. Cero apuestas — Día — PRIORIDAD_MAXIMA
6. Cero alcohol — Día — PRIORIDAD_MAXIMA
7. Entrenamiento o movimiento — Día — HABITO_BASE
8. Bloque de estudio — Día — HABITO_BASE
9. Preparar el sueño — Noche — HABITO_BASE
10. Reservar ventana de sueño 7-9h — Noche — HABITO_BASE
11. Melatonina condicional — Noche — CONDICIONAL
12. Registro emocional y autoconocimiento — Cierre del día — AUTOCONOCIMIENTO

El texto exacto de cada especificación está en
`openspec/changes/add-habit-tracker-app/specs/habit-catalog/spec.md` — cópialo
literal en el seed, no lo reformules.

## Colores por prioridad (usar siempre estos, no inventar otros)
Cada hábito tiene un **nivel de prioridad real** (`HABIT_CATEGORY_PRIORITY`, no
la categoría en sí) y cada nivel un color bien distinto (`HABIT_PRIORITY_COLORS`),
ambos en `apps/web/src/domain.ts` — cambiar solo ahí, todo lo demás (ícono de
`PriorityIcon`, anillos "por prioridad" de TodayProgress, barras del Resumen)
lee de acá.

| Nivel | Categorías | Color | Significado |
|---|---|---|---|
| ALTA | PRIORIDAD_MAXIMA | `#DC2626` (rojo) | hacerse primero, urgente |
| MEDIA | HABITO_BASE, CONDICIONAL, AUTOCONOCIMIENTO | `var(--accent)` (dorado de marca) | el grueso de la rutina diaria |
| BAJA | SUPLEMENTO, OPCIONAL | `#0D9488` (teal) | se puede saltear |

Nada de chip sólido ni de fila pintada (se probó y se sacó): el color vive SOLO
en el ícono de `PriorityIcon` (llama/hoja/punto) junto al nombre del hábito —
el color fuerte de fondo se reserva para el estado cumplido/pendiente de cada
celda. `${color}26` (alpha hex) no funciona con `var(--accent)`: usar el
helper `softTint`/`var(--accent-soft)` para fondos suaves con el color MEDIA.

## Fórmula de porcentaje (crítica, siempre igual en frontend y backend)
```
% = COUNTIF(rango, DONE) / (COUNTIF(rango, DONE) + COUNTIF(rango, PENDING))
```
Las celdas en `NA` **no cuentan ni en el numerador ni en el denominador**. Si el
denominador es 0 (todo `NA`), el resultado es 0%, nunca un error o `NaN`.

## Interacción del checkbox en /tracker (regla de UX innegociable)
- Clic izquierdo sobre una celda: alterna `PENDING ⇄ DONE`. Un solo clic, sin
  confirmaciones, sin recargar la página.
- Clic derecho / long-press: menú para marcar `NA`.
- Nunca volver a un dropdown de 3 opciones para el uso diario — eso ya se probó
  en la versión de Excel y se descartó explícitamente por el usuario.

## Mapa de endpoints (`apps/api`, ver design.md para el detalle)
```
GET/POST   /api/habits            PATCH  /api/habits/:id
GET/POST   /api/cycles            GET    /api/cycles/:id/logs
DELETE     /api/cycles/:id        (borra también sus HabitLog)
PUT        /api/logs/:habitId/:date
GET/POST   /api/journal
GET        /api/dashboard/:cycleId
GET        /api/dashboard/compare
GET/POST   /api/library[?section=LIBRO|FRASE|FILOSOFIA]
DELETE     /api/library/:id       (403 si source=SEED)
```

## Rutas del frontend
`/` → redirige a `/tracker` · `/tracker` · `/habits` · `/journal` · `/dashboard` · `/library`

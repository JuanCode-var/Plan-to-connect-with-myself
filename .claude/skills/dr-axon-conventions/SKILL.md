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

enum HabitMoment   { MANANA, DIA, NOCHE, CIERRE_DEL_DIA }
enum HabitCategory { PRIORIDAD_MAXIMA, SUPLEMENTO, OPCIONAL, HABITO_BASE, CONDICIONAL, AUTOCONOCIMIENTO }
enum LogStatus     { DONE, PENDING, NA }
```
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

## Colores por categoría (usar siempre estos, no inventar otros)
| Categoría | Chip (saturado) | Tinte de fila (suave) |
|---|---|---|
| PRIORIDAD_MAXIMA | `#C00000` texto blanco | `#E79E9E` |
| SUPLEMENTO | `#FFD966` texto oscuro | `#FFF4D4` |
| OPCIONAL | `#BFBFBF` texto oscuro | `#EDEDED` |
| HABITO_BASE | `#70AD47` texto blanco | `#DFECD6` |
| CONDICIONAL | `#8064A2` texto blanco | `#E3DCEA` |
| AUTOCONOCIMIENTO | `#E5B800` texto oscuro | `#F8EDBF` |

El tinte de fila cubre TODA la fila (de la columna de hábito hasta el último día),
no solo la celda de categoría — así la fila se ve como una unidad.

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
GET/POST   /api/habits            PATCH /api/habits/:id
GET/POST   /api/cycles            GET   /api/cycles/:id/logs
PUT        /api/logs/:habitId/:date
GET/POST   /api/journal
GET        /api/dashboard/:cycleId
GET        /api/dashboard/compare
```

## Rutas del frontend
`/` → redirige a `/tracker` · `/tracker` · `/habits` · `/journal` · `/dashboard`

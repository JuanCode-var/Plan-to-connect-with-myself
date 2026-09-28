# Change: add-habit-tracker-app

## Why
El seguimiento venía funcionando en un Excel (checklist horizontal 12 hábitos x 30 días,
hoja de especificaciones, resumen con indicadores/gráficos y registro emocional). Un Excel
no escala bien para uso diario en el celular, no soporta múltiples ciclos de 30 días de
forma cómoda, y editar hábitos con el tiempo (agregar, pausar, cambiar especificación)
es incómodo. Se necesita una app web local, rápida de abrir y marcar en segundos, que
conserve el historial completo entre ciclos.

## What Changes
- Se crea un monorepo desde cero: frontend React + TypeScript (Vite) en `apps/web`
  y backend Express + TypeScript + Prisma (SQLite local) en `apps/api`, con oxlint
  como linter.
- Se modela el dominio en 4 capabilities nuevas:
  - `habit-catalog`: alta/edición/pausa de hábitos y sus especificaciones.
  - `daily-tracking`: la matriz hábito x día (equivalente a la hoja "Checklist
    horizontal"), organizada en "ciclos" (periodos, ej. 30 días) en vez de fechas fijas
    hardcodeadas.
  - `emotional-log`: registro emocional diario (equivalente a la hoja "Registro
    emocional").
  - `summary-dashboard`: indicadores y gráficos agregados (equivalente a la hoja
    "Resumen").
- Se migran como datos semilla (seed) los 12 hábitos actuales, con sus especificaciones,
  momento del día y categoría, más el bloque de advertencias sobre suplementos.
- Se crea el primer ciclo de seguimiento (14/09/2026 – 13/10/2026, 30 días) como dato
  semilla, para no perder el punto de partida ya usado en el Excel.

## Impact
- **Capabilities afectadas:** habit-catalog (nueva), daily-tracking (nueva),
  emotional-log (nueva), summary-dashboard (nueva).
- **Código/infra:** proyecto Next.js nuevo, esquema Prisma nuevo, base SQLite local
  nueva (`./data/dev.db`). No reemplaza el Excel automáticamente; el Excel queda como
  respaldo histórico y esta app es el nuevo punto de entrada diario.
- **Fuera de alcance de este change:** autenticación multiusuario, despliegue en la
  nube, apps móviles nativas, recordatorios/notificaciones push (quedan para un
  change futuro si se necesitan).

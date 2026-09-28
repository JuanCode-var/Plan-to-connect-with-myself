# Dr. Axón — Aplicativo de seguimiento de hábitos

App personal, de un solo usuario, para seguir el plan de hábitos Dr. Axón (recuperación
de disciplina, apuestas, alcohol, sueño, estudio, entrenamiento y regulación
emocional). Corre 100% local, sin nube ni login.

## Stack

- Monorepo con npm workspaces: `apps/web` (frontend) y `apps/api` (backend).
- Frontend: React 18 + TypeScript vía Vite, react-router-dom, @tanstack/react-query,
  Tailwind CSS, Recharts.
- Backend: Node.js + Express + TypeScript, API REST bajo `/api`.
- Base de datos: SQLite vía Prisma, archivo en `apps/api/data/dev.db`.
- Linter: oxlint (`.oxlintrc.json` en la raíz).

## Cómo correrlo local

1. Instalar dependencias (una sola vez, desde la raíz):

   ```bash
   npm install
   ```

2. Aplicar las migraciones de la base de datos y cargar el seed (una sola vez, o cada
   vez que se borre `apps/api/data/dev.db`):

   ```bash
   cd apps/api
   npx prisma migrate dev
   ```

   El seed (12 hábitos + "Ciclo 1") se ejecuta automáticamente después de la
   migración. Para volver a cargarlo manualmente: `npx prisma db seed`.

3. Levantar los dos procesos de desarrollo (en dos terminales separadas, desde la
   raíz del repo):

   ```bash
   npm run dev --workspace apps/api
   ```

   ```bash
   npm run dev --workspace apps/web
   ```

4. Abrir [http://localhost:5173](http://localhost:5173). El frontend corre en
   `:5173` y proxea `/api` hacia el backend en `:4000` (configurado en
   `apps/web/vite.config.ts`).

## Rutas de la app

- `/tracker` — matriz hábito x día del ciclo activo (o el seleccionado).
- `/habits` — catálogo de hábitos + advertencias sobre suplementos.
- `/journal` — registro emocional diario.
- `/dashboard` — indicadores y gráficos del ciclo.

## Verificación

```bash
npx oxlint                                    # lint (raíz)
npx tsc -b --noEmit                           # type-check (dentro de apps/web)
npx tsc --noEmit                              # type-check (dentro de apps/api)
```

## Notas de implementación

- SQLite no soporta el tipo `enum` nativo de Prisma: `Habit.moment`, `Habit.category`
  y `HabitLog.status` se modelan como `String`, con el contrato de valores
  documentado en `apps/api/src/domain.ts` (espejo en `apps/web/src/domain.ts`) y
  validado con `zod` en cada endpoint.
- Todas las fechas de dominio (`Cycle.startDate/endDate`, `HabitLog.date`,
  `EmotionalEntry.date`) se guardan y comparan como fecha pura a medianoche UTC.
- Esta es una herramienta de seguimiento personal, no un producto médico: no
  reemplaza diagnóstico ni tratamiento profesional (ver el bloque de advertencias en
  `/habits`).

## Fuera de alcance

Autenticación multiusuario, despliegue en la nube, apps móviles nativas y
notificaciones push quedan fuera de este proyecto (ver
`openspec/changes/add-habit-tracker-app/proposal.md`).

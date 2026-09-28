## 1. Setup del monorepo
- [x] 1.1 Crear la raíz con `npm init -y` y configurar `"workspaces": ["apps/web", "apps/api"]`
      en el `package.json` raíz.
- [x] 1.2 Crear `apps/web` con Vite (`npm create vite@latest apps/web -- --template react-ts`).
- [x] 1.3 Instalar y configurar Tailwind CSS en `apps/web` (plugin oficial de Vite).
- [x] 1.4 Instalar en `apps/web`: `react-router-dom`, `@tanstack/react-query`, `recharts`.
- [x] 1.5 Configurar el proxy de Vite (`apps/web/vite.config.ts`) para que `/api` apunte a
      `http://localhost:4000` en desarrollo.
- [x] 1.6 Crear `apps/api` con TypeScript + Express (`npm init -y`, instalar `express`,
      `cors`, `zod` para validación de body, `typescript`, `ts-node-dev`, `@types/express`).
- [x] 1.7 Instalar y configurar Prisma en `apps/api` con SQLite
      (`npx prisma init --datasource-provider sqlite`), `DATABASE_URL` → `file:./data/dev.db`.
- [x] 1.8 Instalar y configurar oxlint en la raíz (`npm i -D oxlint`, crear `.oxlintrc.json`
      cubriendo `apps/web/src` y `apps/api/src`); agregar script `"lint": "oxlint"` en el
      `package.json` raíz.
- [x] 1.9 Confirmar `tsconfig.json` en modo estricto (`"strict": true`) en ambos paquetes.

## 2. Modelo de datos (`apps/api`)
- [x] 2.1 Escribir `apps/api/prisma/schema.prisma` según `design.md` (modelos `Habit`,
      `Cycle`, `HabitLog`, `EmotionalEntry`, enums `HabitCategory`, `HabitMoment`, `LogStatus`).
      Nota: SQLite no soporta enums nativos en Prisma; `moment`/`category`/`status`
      quedaron como `String` con el contrato documentado, validado con zod en las rutas.
- [x] 2.2 Ejecutar `npx prisma migrate dev --name init` dentro de `apps/api`.
- [x] 2.3 Crear `apps/api/prisma/seed.ts` con los 12 hábitos y el "Ciclo 1"
      (14/09/2026–13/10/2026) descritos en `specs/habit-catalog/spec.md`.
- [x] 2.4 Registrar el seed en `apps/api/package.json` (`prisma.seed`) y ejecutarlo.
- [x] 2.5 Crear `apps/api/src/db.ts` con una instancia singleton de `PrismaClient`.
- [x] 2.6 Crear `apps/api/src/server.ts`: Express + `cors()` + `express.json()`, montar
      los routers de `src/routes/`, escuchar en el puerto 4000.
      (El montaje de routers se agrega incrementalmente en las secciones 3-6, a medida
      que cada router se crea.)

## 3. habit-catalog
- [x] 3.1 Backend: `apps/api/src/routes/habits.ts` con `GET /api/habits`,
      `POST /api/habits`, `PATCH /api/habits/:id` (editar especificación / pausar).
- [x] 3.2 Frontend: hooks `apps/web/src/api/habits.ts` (`useHabits`, `useCreateHabit`,
      `useUpdateHabit`) sobre React Query.
- [x] 3.3 Página `/habits`: listado agrupado por momento del día, insignia de color por
      categoría, formulario de alta y edición inline.
- [x] 3.4 Componente de bloque de advertencias sobre suplementos, visible por defecto
      (puede ser colapsable pero no oculto detrás de un menú).

## 4. daily-tracking
- [x] 4.1 Backend: `apps/api/src/routes/cycles.ts` (`GET/POST /api/cycles`,
      `GET /api/cycles/:id/logs`) y `apps/api/src/routes/logs.ts`
      (`PUT /api/logs/:habitId/:date`).
- [x] 4.2 Backend: `apps/api/src/services/tracking.ts` con el cálculo de % por hábito y
      por día (excluyendo `NA` del denominador), reutilizable desde el dashboard.
- [x] 4.3 Frontend: hooks `apps/web/src/api/tracking.ts` (`useCycles`, `useCycleLogs`,
      `useSetLogStatus` con actualización optimista de React Query).
- [x] 4.4 Selector de ciclo (por defecto, el ciclo activo).
- [x] 4.5 Componente de matriz: filas = hábitos activos (agrupados por momento),
      columnas = días del ciclo, con tinte de fondo por categoría en toda la fila.
- [x] 4.6 Celda de estado como botón: clic izquierdo alterna `PENDING ⇄ DONE`; clic
      derecho / long-press abre opción "Marcar como no aplica" (`NA`).
- [x] 4.7 Fila de % de cumplimiento por día y columna de % de cumplimiento por hábito,
      recalculadas en cliente tras cada mutación.
- [x] 4.8 Botón "Crear nuevo ciclo" con fecha de inicio sugerida y duración por
      defecto de 30 días.

## 5. emotional-log
- [x] 5.1 Backend: `apps/api/src/routes/journal.ts` (`GET /api/journal` con filtros
      `?from=&to=&emotion=`, `POST /api/journal`).
- [x] 5.2 Frontend: hooks `apps/web/src/api/journal.ts` (`useJournalEntries`,
      `useCreateJournalEntry`).
- [x] 5.3 Formulario de nueva entrada (fecha, emoción principal, y los 4 campos
      narrativos opcionales).
- [x] 5.4 Lista de entradas con filtro por rango de fechas y por emoción.
- [x] 5.5 Atajo "Registro emocional de hoy" visible en `/tracker`, que navega a
      `/journal` con la fecha de hoy preseleccionada (query param o estado de router).

## 6. summary-dashboard
- [x] 6.1 Backend: `apps/api/src/routes/dashboard.ts` (`GET /api/dashboard/:cycleId`,
      `GET /api/dashboard/compare`) usando `services/tracking.ts` para los cálculos.
- [x] 6.2 Frontend: hook `apps/web/src/api/dashboard.ts` (`useCycleSummary`,
      `useCycleComparison`).
- [x] 6.3 Tarjetas de indicadores (cumplidos, pendientes, no aplica, % general, días
      sin apuestas/alcohol, con entrenamiento/estudio/registro emocional).
- [x] 6.4 Gráfico de barras (Recharts) de % cumplimiento por hábito, con color
      distintivo para categoría "Prioridad máxima".
- [x] 6.5 Gráfico de línea de % cumplimiento por día, mostrando solo días
      transcurridos si el ciclo está en curso.
- [x] 6.6 Selector de ciclo + gráfico/tabla de comparación de % general entre ciclos.

## 7. Pulido y verificación
- [x] 7.1 Layout raíz (`apps/web/src/App.tsx`) con navegación entre `/tracker`,
      `/habits`, `/journal`, `/dashboard`, y redirección de `/` a `/tracker`.
- [x] 7.2 Responsive: la matriz de `/tracker` debe usarse cómodamente en celular
      (scroll horizontal con encabezado de hábito fijo).
- [x] 7.3 Correr `npx oxlint` en la raíz y dejar el proyecto sin warnings antes de
      cerrar la tarea.
- [x] 7.4 Revisar que ningún requirement de los 4 archivos `specs/**/spec.md` quede
      sin implementar (recorrer cada Scenario manualmente).
- [x] 7.5 Documentar en el `README.md` de la raíz cómo correrlo local: `npm install`,
      `npx prisma migrate dev` (dentro de `apps/api`), y luego los dos procesos de
      desarrollo (`npm run dev --workspace apps/api` y `npm run dev --workspace apps/web`).

# Dr. Axón — Aplicativo de seguimiento de hábitos

App personal, de un solo usuario (con login propio), para seguir el plan de hábitos
Dr. Axón (recuperación de disciplina, apuestas, alcohol, sueño, estudio, entrenamiento
y regulación emocional).

## Stack

- Monorepo con npm workspaces: `apps/web` (frontend) y `apps/api` (backend).
- Frontend: React 18 + TypeScript vía Vite, react-router-dom, @tanstack/react-query,
  Tailwind CSS, ECharts.
- Backend: Node.js + Express + TypeScript, API REST bajo `/api`, sesión propia por
  token firmado (HMAC, ver `apps/api/src/lib/session.ts`) — **requiere un
  `SESSION_SECRET` propio en `apps/api/.env` antes de exponer la app a internet**,
  nunca el default hardcodeado en el código.
- Base de datos: Turso (libSQL), vía el adapter de Prisma — ver "Configurar una
  máquina nueva" más abajo. Ya no es un archivo SQLite local.
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
   `:5173` y proxea `/api` hacia el backend en `:5000` (configurado en
   `apps/web/vite.config.ts`).

## Configurar una máquina nueva

`apps/api/.env` (gitignoreado, nunca se sube) necesita:

- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` — credenciales de la base en Turso
  (`turso db show dr-axon --url` / `turso db tokens create dr-axon`, con la CLI de
  Turso logueada).
- `SESSION_SECRET` — un valor propio y aleatorio (ej.
  `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`).
  Sin esto, la app firma las sesiones con un default hardcodeado en el código — sirve
  para desarrollo local, nunca para algo expuesto a internet.
- `PORT` — opcional, puerto del backend (default `5000`).

## Correrlo con Docker

Pensado como paso previo a subir la app a un host — no reemplaza el flujo de
desarrollo de arriba (sin hot-reload, hay que reconstruir la imagen en cada cambio).

```bash
docker compose up --build
```

Levanta dos contenedores (frontend con nginx + backend con Node, sin contenedor de
base de datos — sigue usando Turso): abrir
[http://localhost:8080](http://localhost:8080). La API lee sus credenciales de
`apps/api/.env` (ver "Configurar una máquina nueva" arriba) vía `env_file` en
`docker-compose.yml` — confirmar que `SESSION_SECRET` esté seteado ahí antes de
levantarlo. Las migraciones de base de datos no corren solas al levantar el
contenedor; se siguen aplicando a mano (ver `apps/api/prisma/migrations/`).

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

Autenticación multiusuario (sigue siendo de un solo usuario por cuenta) y
notificaciones push reales (los avisos de "Revisión del día"/recordatorios de WOOP
son banners dentro de la app, no push) quedan fuera por ahora — ver
`openspec/changes/add-habit-tracker-app/proposal.md` para el alcance original. El
despliegue en la nube y la app móvil nativa son el próximo paso, no algo descartado.

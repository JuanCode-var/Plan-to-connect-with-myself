# Change: add-auth

## Why
`openspec/config.yaml` marca la autenticación multiusuario como fuera de alcance
**por defecto**, salvo que el usuario lo pida explícitamente. El usuario lo pidió
explícitamente (quería una puerta de entrada con su nombre para personalizar el
saludo y poder cerrar sesión en su propio dispositivo), así que se implementó. Este
change documenta retroactivamente lo ya construido para que `openspec/` no quede
desalineado del código real.

## What Changes
- Se agrega una capability nueva, `auth`: registro, login y sesión con token, sin
  dependencias nuevas (hash de contraseña con `scrypt` nativo de Node, token de
  sesión firmado con HMAC en vez de `bcrypt`/`jsonwebtoken`).
- Las 4 vistas existentes (`/tracker`, `/habits`, `/journal`, `/dashboard`) quedan
  detrás de un gate de sesión (`RequireAuth`): sin sesión válida, redirigen a
  `/login`.
- **Decisión de alcance explícita (confirmada con el usuario):** el login es
  únicamente una puerta de entrada para identificar "quién abrió la app" y
  personalizar el saludo — **no particiona datos por usuario**. `Habit`, `Cycle`,
  `HabitLog` y `EmotionalEntry` siguen siendo compartidos/globales, exactamente como
  en el diseño original de una app de un solo usuario. Los endpoints de
  `apps/api` (`/api/habits`, `/api/cycles`, `/api/logs`, `/api/journal`,
  `/api/dashboard`) **no están protegidos por sesión** — siguen abiertos a nivel
  HTTP, igual que antes de este change. Si en el futuro se necesita separar datos
  por cuenta, es un change nuevo (agregar `userId` a cada tabla y filtrar cada
  endpoint), no este.

## Impact
- **Capabilities afectadas:** `auth` (nueva). No modifica `habit-catalog`,
  `daily-tracking`, `emotional-log` ni `summary-dashboard`.
- **Esquema de Prisma:** sí, afecta. Se agrega el modelo `User` (`id`, `name`,
  `email` único, `passwordHash`, `createdAt`), sin relación con ningún otro modelo
  (decisión de alcance de arriba). Migración ya generada y aplicada:
  `apps/api/prisma/migrations/20260915040053_add_user`.
- **Fuera de alcance de este change:** particionar datos por cuenta, recuperación
  de contraseña por email, roles/permisos, expirar sesiones del lado del servidor
  (el token HMAC no tiene estado; expira solo por tiempo, `MAX_AGE_MS` en
  `apps/api/src/lib/session.ts`).

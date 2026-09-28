## 1. Backend (`apps/api`)
- [x] 1.1 Modelo `User` en `apps/api/prisma/schema.prisma` (`id`, `name`, `email`
      único, `passwordHash`, `createdAt`), sin relación con `Habit`/`Cycle`/
      `HabitLog`/`EmotionalEntry`. Migración `add_user` generada y aplicada.
- [x] 1.2 `apps/api/src/lib/password.ts`: hash con `scrypt` (salt aleatorio) +
      verificación con `timingSafeEqual`, sin dependencias nuevas.
- [x] 1.3 `apps/api/src/lib/session.ts`: token de sesión propio (payload + firma
      HMAC-SHA256, base64url), expiración por tiempo, sin tabla de sesiones.
- [x] 1.4 `apps/api/src/routes/auth.ts`: `POST /api/auth/register` (409 si el email
      ya existe), `POST /api/auth/login` (401 con mensaje genérico), `GET
      /api/auth/me` (valida `Authorization: Bearer <token>`).
- [x] 1.5 Montar el router en `apps/api/src/server.ts` (`/api/auth`), sin proteger
      el resto de los endpoints (decisión de alcance: los datos siguen
      compartidos, ver `proposal.md`).

## 2. Frontend (`apps/web`)
- [x] 2.1 `apps/web/src/api/auth.ts`: hooks de React Query para registro, login y
      `GET /api/auth/me`.
- [x] 2.2 `apps/web/src/lib/authToken.ts` (persistencia en `localStorage`),
      `apps/web/src/lib/authContext.ts` + `auth.tsx` + `useAuth.ts`
      (`AuthProvider`, valida el token guardado contra `/api/auth/me` al montar).
- [x] 2.3 `apps/web/src/components/RequireAuth.tsx`: layout route que redirige a
      `/login` sin sesión válida, guardando la ruta pedida (`state.from`) para
      volver ahí después de iniciar sesión.
- [x] 2.4 `apps/web/src/pages/Login.tsx` y `Register.tsx`, con el mismo lenguaje
      visual (tema claro/oscuro) del resto de la app.
- [x] 2.5 Botón "Cerrar sesión" en `apps/web/src/components/AppShell.tsx`, y
      saludo personalizado con el nombre de la cuenta en las vistas que ya lo
      usaban (`TodayProgress`, toast de día completo).
- [x] 2.6 `apps/web/src/api/client.ts`: agregar `Authorization: Bearer <token>` a
      toda llamada a `/api/**` cuando hay sesión.

## 3. Verificación
- [x] 3.1 Probado contra el servidor real: registro, login correcto, contraseña
      incorrecta (401), email duplicado (409), `/me` con token válido/ausente/
      inválido.
- [x] 3.2 Correr `npx oxlint` en la raíz sin warnings.

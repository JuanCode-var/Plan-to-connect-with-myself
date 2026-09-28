# Design: add-auth

## Contexto
App personal de un solo usuario, corre 100% local (ver `openspec/config.yaml`). El
login no es un requisito de seguridad multiusuario — es una puerta de entrada simple
para identificar "quién abrió la app" (personalizar el saludo, poder cerrar sesión en
un dispositivo compartido) sin sumar la complejidad de particionar datos por cuenta.

## Decisiones clave
| Decisión | Elección | Por qué |
|---|---|---|
| Hash de contraseña | `scrypt` nativo de `node:crypto` (salt aleatorio de 16 bytes, comparación con `timingSafeEqual`) | Evita sumar `bcrypt`/`argon2` como dependencia nueva solo para esto; suficiente para una app local de bajo tráfico. |
| Sesión | Token propio: payload JSON en base64url + firma HMAC-SHA256, sin estado en el servidor | Evita sumar `jsonwebtoken` y una tabla de sesiones que limpiar; expira solo por tiempo (`MAX_AGE_MS`, 90 días) verificado en cada request. |
| Alcance de los datos | `User` sin relación con `Habit`/`Cycle`/`HabitLog`/`EmotionalEntry` | Decisión explícita del usuario: el login identifica, no particiona. Ver "Fuera de alcance" en `proposal.md`. |
| Protección de endpoints | Solo en el frontend (`RequireAuth` como layout route) | Los datos son igualmente compartidos con o sin sesión; no hay nada que proteger a nivel de fila. Si se decide particionar datos en un change futuro, ahí sí corresponde validar el token en `apps/api`. |

## Modelo de datos (Prisma)
```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}
```
Migración: `apps/api/prisma/migrations/20260915040053_add_user`.

## Endpoints de la API (`apps/api`)
| Método | Ruta | Capability | Uso |
|---|---|---|---|
| POST | `/api/auth/register` | auth | Crear cuenta (`name`, `email`, `password` ≥ 6 caracteres). 409 si el email ya existe. Devuelve `{ token, user }`. |
| POST | `/api/auth/login` | auth | Iniciar sesión (`email`, `password`). 401 con mensaje genérico si el email no existe o la contraseña es incorrecta (no confirma cuál de las dos). Devuelve `{ token, user }`. |
| GET | `/api/auth/me` | auth | Valida el token (`Authorization: Bearer <token>`) y devuelve el usuario actual, o 401. |

`user` en las respuestas es siempre `{ id, name, email }` (nunca `passwordHash`).

## Rutas del frontend (`apps/web`)
- `/login`, `/register` — fuera del gate de sesión, con el mismo lenguaje visual
  (tema claro/oscuro) del resto de la app.
- `/tracker`, `/habits`, `/journal`, `/dashboard` — envueltas en
  `<Route element={<RequireAuth />}>` en `App.tsx`: sin sesión válida, redirigen a
  `/login` guardando la ruta pedida (`state: { from: location }`) para volver ahí
  después de iniciar sesión.
- El token se guarda en `localStorage` (`apps/web/src/lib/authToken.ts`) y se valida
  contra `GET /api/auth/me` al abrir la app (`apps/web/src/lib/auth.tsx`), antes de
  decidir si redirige a `/login` — evita un parpadeo a `/login` en cada recarga.
- `apps/web/src/api/client.ts` agrega el header `Authorization: Bearer <token>` a
  toda llamada a `/api/**` cuando hay un token guardado (aunque, por la decisión de
  alcance de arriba, ningún endpoint además de `/api/auth/me` lo valida todavía).

## Fuera de alcance
Particionar `Habit`/`Cycle`/`HabitLog`/`EmotionalEntry` por cuenta, recuperación de
contraseña, roles/permisos, invalidar sesiones activas del lado del servidor antes de
que expiren por tiempo. Se pueden proponer como changes futuros si se necesitan.

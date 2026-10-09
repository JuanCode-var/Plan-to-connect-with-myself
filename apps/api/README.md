# Dr. Axón — API

API en Express + Prisma. La base de datos vive en [Turso](https://turso.tech)
(libSQL remoto) para que **todas las máquinas que clonen el repo vean los
mismos datos** — ya no hay un `dev.db` local por dispositivo.

## Cómo está armado

- `prisma/schema.prisma` tiene el preview feature `driverAdapters` activado.
  Su `datasource.url` (`DATABASE_URL`) solo la usan los comandos de Prisma
  CLI (`migrate`, `generate`, `studio`): Prisma Migrate todavía no soporta
  conectarse directo a una base libSQL remota, así que las migraciones se
  siguen generando y probando contra un sqlite local descartable.
- En runtime, `src/db.ts` arma el `PrismaClient` con el adapter
  `@prisma/adapter-libsql`, conectado a Turso vía `TURSO_DATABASE_URL` +
  `TURSO_AUTH_TOKEN` (leídas de `apps/api/.env`). La app nunca lee/escribe el
  sqlite local en runtime.

## Configurar una máquina nueva

1. **Instalar dependencias** (desde la raíz del repo): `npm install`.

2. **Instalar el CLI de Turso** (si no lo tenés):
   - Windows (PowerShell): `irm https://github.com/tursodatabase/turso/releases/latest/download/turso_cli-installer.ps1 | iex`
   - macOS/Linux: `curl -sSfL https://get.tur.so/install.sh | bash`

3. **Login**: `turso auth login` (abre el navegador; usá la cuenta del
   equipo/proyecto en turso.tech, pedile acceso a quien la haya creado si no
   la tenés).

4. **Conseguir la base**:
   - Si la base del equipo **ya existe en Turso**, no hace falta crearla de
     nuevo — solo pedí que te agreguen como miembro de la organización/base y
     saltá al paso 5.
   - Si **todavía no existe** (primera vez que se hace este setup), créala a
     partir del `dev.db` que ya tiene los datos y el esquema actuales:
     ```sh
     turso db create dr-axon --from-file apps/api/data/dev.db
     ```
     Esto deja la base inicial en Turso con exactamente los mismos datos que
     tenía el sqlite local de la máquina donde se migró.

5. **Conseguir la URL y el token**:
   ```sh
   turso db show dr-axon --url
   turso db tokens create dr-axon
   ```

6. **Completar `apps/api/.env`** (copiá `apps/api/.env.example` si todavía no
   existe en tu máquina) con esos dos valores:
   ```
   TURSO_DATABASE_URL=libsql://dr-axon-<tu-org>.turso.io
   TURSO_AUTH_TOKEN=<el token del paso anterior>
   ```
   `DATABASE_URL` y `PORT` podés dejarlos con el valor del `.env.example` —
   `DATABASE_URL` no apunta a la base real, solo la necesita el CLI de Prisma
   (ver arriba).

7. **Generar el cliente de Prisma**: `npx prisma generate` (desde
   `apps/api/`).

8. **Levantar la API**: `npm run dev` (desde `apps/api/`). Si
   `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` faltan o están mal, `src/db.ts`
   tira un error explícito al arrancar.

## Cambiar el esquema (nueva migración)

Como Prisma Migrate no soporta Turso remoto directamente, el flujo es:

1. Corré `npx prisma migrate dev --name <algo>` normal — esto escribe el SQL
   en `prisma/migrations/` y lo aplica contra el sqlite local de
   `DATABASE_URL` (la variable ya está en tu `.env` del paso 6).
2. Aplicá ese mismo SQL a Turso con el CLI:
   ```sh
   turso db shell dr-axon < prisma/migrations/<carpeta-nueva>/migration.sql
   ```
3. Avisale al resto del equipo que corrió una migración nueva — como la base
   es compartida, no hace falta que cada uno la vuelva a aplicar, pero sí que
   tiren `npx prisma generate` después de un `git pull` para que su
   `PrismaClient` local quede sincronizado con el `schema.prisma` nuevo.

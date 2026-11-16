# Build context = raíz del repo (no apps/api): es un monorepo de npm
# workspaces, `npm ci` necesita ver los package.json de los 3 niveles
# (raíz, apps/api, apps/web) para resolver el árbol completo aunque esta
# imagen solo termine usando apps/api. Construir con:
#   docker build -f apps/api/Dockerfile .
# (docker-compose.yml en la raíz ya lo arma así).
#
# Base Debian (`-slim`), NO Alpine: @libsql/client trae un binding nativo
# por plataforma y el de musl (Alpine) choca con glibc en este runtime
# ("Error relocating .../libsql: fcntl64: symbol not found", probado en
# esta misma máquina) — mismo motivo por el que las imágenes oficiales de
# Prisma recomiendan Debian/slim sobre Alpine para evitar esta clase de
# problemas con módulos nativos.

FROM node:20-slim AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/api apps/api
# Sin --schema explícito, Prisma busca prisma/schema.prisma relativo al cwd
# — por eso el `cd` en vez de pasar la ruta, más simple que acordarse del
# flag en cada comando.
RUN cd apps/api && npx prisma generate
RUN npm run build --workspace apps/api

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Prisma necesita openssl para el motor de consultas nativo — sin esto
# falla en runtime con "Error loading shared library libssl.so".
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev --workspace apps/api

# El cliente de Prisma se instala (paquete @prisma/client) con el ci de
# arriba, pero el motor GENERADO (node_modules/.prisma) solo existe después
# de `prisma generate`, que necesita el CLI de Prisma — un devDependency
# que --omit=dev no instaló acá a propósito (no hace falta en runtime). Se
# copia el ya generado en el stage de build, mismo binario (misma base en
# los dos stages).
COPY --from=build /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /repo/apps/api/dist ./apps/api/dist

EXPOSE 5000
CMD ["node", "apps/api/dist/server.js"]

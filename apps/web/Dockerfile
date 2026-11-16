# Build context = raíz del repo, mismo motivo que apps/api/Dockerfile
# (workspaces de npm). Construir con: docker build -f apps/web/Dockerfile .

FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci

COPY apps/web apps/web
RUN npm run build --workspace apps/web

# nginx sirve el build estático (apps/web/dist) y hace de proxy hacia la
# API — mismo comportamiento que el proxy de Vite en dev
# (apps/web/vite.config.ts), así el frontend le sigue pidiendo todo a
# `/api` same-origin, sin CORS ni una URL de API hardcodeada en el build.
FROM nginx:alpine AS runtime
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

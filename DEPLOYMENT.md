# Desplegar Dr. Axón como beta pública

Guía de referencia para llevar la app del `docker compose up` local (ver
"Correrlo con Docker" en `README.md`) a un servidor real con dominio propio y
HTTPS. Son pasos manuales, pensados para hacerse una sola vez (y repetirse
cada vez que haga falta actualizar el servidor).

## Antes de arrancar

- Confirmar que `apps/api/.env` tiene un `SESSION_SECRET` propio (no el
  default del código) y las credenciales reales de Turso
  (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) — nunca se sube al repo.
- Tener a mano una tarjeta para pagar el VPS y el dominio (ver precios más
  abajo).

## Paso a paso

### 1. Comprar un dominio

Sin dominio no hay HTTPS creíble para algo público. Recomendado: **Cloudflare
Registrar** — vende al precio de mayorista, sin margen, y ya incluye WHOIS
privado y DNSSEC gratis.

### 2. Crear el VPS

Hetzner o DigitalOcean (ver comparación de precios abajo). Elegir el tamaño
mínimo que aguante los 2 contenedores con margen — el de 512 MB de RAM queda
muy justo, conviene arrancar con 1 GB o más.

Al crear el servidor:
- Sistema operativo: Ubuntu LTS (22.04 o 24.04).
- Login por **clave SSH**, no por contraseña.

### 3. Instalar Docker en el servidor

Conectado por SSH al VPS recién creado:

```bash
curl -fsSL https://get.docker.com | sh
```

(Instala Docker Engine + el plugin de `docker compose`, documentado en
[docs.docker.com](https://docs.docker.com/engine/install/).)

### 4. Subir el proyecto al servidor

```bash
git clone <url-del-repo> dr-axon
cd dr-axon
```

Crear `apps/api/.env` a mano en el servidor (no se clona con el repo, está
gitignoreado) con las mismas 4 variables que en local:
`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET`, `PORT`.

### 5. Apuntar el dominio al servidor

En el panel DNS del dominio (Cloudflare u otro), un registro **A** apuntando
al IP del VPS. Puede tardar unos minutos en propagarse.

### 6. Agregar HTTPS real

`apps/web/nginx.conf` hoy sirve solo HTTP (pensado para probarlo local en
`:8080`) — **no exponer así a internet**. Antes de levantarlo en el VPS, hay
que sumar certificado TLS. Dos caminos:

- **Más simple**: reemplazar el servicio `web` de `docker-compose.yml` por
  [Caddy](https://caddyserver.com/) en vez de nginx — HTTPS automático con
  Let's Encrypt con un Caddyfile de pocas líneas, sin certbot ni renovación
  manual.
- **Alternativa**: mantener nginx y correr `certbot` aparte para emitir y
  renovar el certificado, apuntando nginx a los archivos que genera.

### 7. Levantarlo

```bash
docker compose up -d --build
```

### 8. Probar

Abrir el dominio en el navegador, loguearse, navegar un par de rutas
(`/tracker`, `/microacciones`) y confirmar que todo responde igual que en
local.

### 9. Seguridad mínima del servidor

```bash
ufw allow OpenSSH
ufw allow 80,443/tcp
ufw enable
```

Firewall activo + login SSH solo por clave (paso 2) — lo mínimo antes de
dejar el servidor expuesto a internet.

## Precios aproximados para arrancar

| Servicio | Opción | Precio |
|---|---|---|
| VPS | Hetzner (plan más chico) | ~€6–6.50/mes |
| VPS | DigitalOcean (1 GB RAM) | ~$6/mes |
| Dominio | Cloudflare Registrar, `.com` | ~$10.50/año (sube a ~$11.20 desde nov. 2026) |
| Dominio | Cloudflare Registrar, `.app` | ~$8.20 primer año, ~$14.20/año después |
| HTTPS | Let's Encrypt (Caddy o certbot) | Gratis |
| Base de datos | Turso, plan gratis (5 GB, 500M lecturas/mes) | Gratis — alcanza de sobra para una beta de un solo usuario |

**Total aproximado: ~$6–7/mes de servidor + ~$10–11 una vez al año de
dominio.**

Fuentes de precios (consultadas en octubre 2026, pueden variar):
[Hetzner Cloud](https://www.hetzner.com/cloud/) ·
[DigitalOcean Droplets](https://www.digitalocean.com/pricing/droplets) ·
[Turso Pricing](https://turso.tech/pricing) ·
[Cloudflare Registrar](https://domainoffer.net/registrar/cloudflare)

## Más adelante

- App móvil nativa (fuera de alcance de este documento).
- Backups automáticos del VPS (snapshot) si se vuelve algo crítico.
- Notificaciones push reales (hoy "Revisión del día"/recordatorios de WOOP
  son banners dentro de la app, no push — ver `README.md`).

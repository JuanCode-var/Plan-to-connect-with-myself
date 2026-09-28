# Design: add-habit-tracker-app

## Contexto
App personal, un solo usuario, corre 100% local. Prioridad: abrir la app y marcar el
día en pocos segundos, desde celular o computador en la misma red local o simplemente
`localhost`. No se necesita nube, login ni multiusuario.

## Stack y decisiones clave
| Decisión | Elección | Por qué |
|---|---|---|
| Estructura | Monorepo npm workspaces: `apps/web` + `apps/api` | Frontend y backend separados; cada uno con su propio `tsconfig` y ciclo de build. |
| Frontend | React 18 + TypeScript vía Vite, `react-router-dom` | Rápido de levantar, sin el runtime de servidor de Next.js; el usuario ya lo usa normalmente. |
| Data fetching | `@tanstack/react-query` | Da caché, revalidación y actualización optimista "gratis" para el toggle de las celdas sin escribir esa lógica a mano. |
| Backend | Node.js + Express + TypeScript, API REST bajo `/api` | Reemplaza las Server Actions de Next.js; endpoints simples y explícitos, fáciles de probar con curl/Postman. |
| Estilos | Tailwind CSS (plugin oficial de Vite) | Rápido de iterar, fácil de tematizar por categoría de hábito. |
| Base de datos | SQLite vía Prisma, archivo en `apps/api/data/dev.db` | Cero configuración, corre local sin servicios externos, suficiente para un solo usuario. |
| Gráficos | Recharts | Se integra bien con React, cubre barras y líneas que necesita el dashboard. |
| Linter | oxlint | Mucho más rápido que ESLint, un solo binario, sin plugins que mantener; corre en `apps/web` y `apps/api`. |
| Autenticación | Ninguna | App local de un solo usuario; fuera de alcance. |

## Estructura de carpetas
```
/
├── package.json              # workspaces: ["apps/web", "apps/api"]
├── .oxlintrc.json
├── apps/
│   ├── web/                   # Vite + React + TS
│   │   ├── vite.config.ts     # proxy /api -> http://localhost:4000
│   │   └── src/
│   │       ├── pages/         # Tracker, Habits, Journal, Dashboard
│   │       ├── components/
│   │       └── api/           # fetch clients + hooks de react-query
│   └── api/                   # Express + TS + Prisma
│       ├── src/
│       │   ├── routes/        # habits.ts, tracking.ts, journal.ts, dashboard.ts
│       │   ├── services/      # lógica de negocio (cálculo de %, resumen)
│       │   └── server.ts
│       └── prisma/
│           ├── schema.prisma
│           └── seed.ts
```

## Endpoints de la API (`apps/api`)
| Método | Ruta | Capability | Uso |
|---|---|---|---|
| GET | `/api/habits` | habit-catalog | Listar hábitos (activos por defecto). |
| POST | `/api/habits` | habit-catalog | Crear hábito. |
| PATCH | `/api/habits/:id` | habit-catalog | Editar especificación / pausar (`active: false`). |
| GET | `/api/cycles` | daily-tracking | Listar ciclos. |
| POST | `/api/cycles` | daily-tracking | Crear ciclo nuevo. |
| GET | `/api/cycles/:id/logs` | daily-tracking | Matriz de logs del ciclo (hábitos x días). |
| PUT | `/api/logs/:habitId/:date` | daily-tracking | Fijar estado de una celda (`DONE`/`PENDING`/`NA`). |
| GET | `/api/journal` | emotional-log | Listar entradas (filtros `?from=&to=&emotion=`). |
| POST | `/api/journal` | emotional-log | Crear entrada. |
| GET | `/api/dashboard/:cycleId` | summary-dashboard | Indicadores + series para los gráficos del ciclo. |
| GET | `/api/dashboard/compare` | summary-dashboard | % general de cada ciclo, para la comparación entre ciclos. |

## Modelo de datos (Prisma)

```prisma
// apps/api/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./data/dev.db"
}

enum HabitCategory {
  PRIORIDAD_MAXIMA
  SUPLEMENTO
  OPCIONAL
  HABITO_BASE
  CONDICIONAL
  AUTOCONOCIMIENTO
}

enum HabitMoment {
  MANANA
  DIA
  NOCHE
  CIERRE_DEL_DIA
}

enum LogStatus {
  DONE
  PENDING
  NA
}

model Habit {
  id            String        @id @default(cuid())
  name          String
  moment        HabitMoment
  specification String
  category      HabitCategory
  sortOrder     Int
  active        Boolean       @default(true)
  createdAt     DateTime      @default(now())
  logs          HabitLog[]
}

model Cycle {
  id        String     @id @default(cuid())
  name      String
  startDate DateTime
  endDate   DateTime
  createdAt DateTime   @default(now())
  logs      HabitLog[]
}

model HabitLog {
  id       String    @id @default(cuid())
  habitId  String
  habit    Habit     @relation(fields: [habitId], references: [id])
  cycleId  String
  cycle    Cycle     @relation(fields: [cycleId], references: [id])
  date     DateTime
  status   LogStatus @default(PENDING)

  @@unique([habitId, date])
  @@index([cycleId, date])
}

model EmotionalEntry {
  id        String   @id @default(cuid())
  date      DateTime
  emotion   String
  situation String?
  feeling   String?
  impulse   String?
  decision  String?
  learning  String?
  createdAt DateTime @default(now())

  @@index([date])
}
```

Notas de diseño del modelo:
- `Cycle` reemplaza el "30 días fijos" del Excel: cada ciclo tiene su propio rango de
  fechas, así se pueden crear ciclos nuevos sin perder el historial de los anteriores.
- `Habit.active = false` en vez de borrar: si el usuario pausa/retira un hábito, su
  historial (`HabitLog`) se conserva para el dashboard histórico.
- `LogStatus.NA` reemplaza la celda vacía del Excel ("no aplica" ese día, ej. melatonina).
- `HabitLog` único por `(habitId, date)`: no depende de a qué ciclo "pertenece" la fecha
  para evitar duplicados si los ciclos llegaran a superponerse.

## Rutas del frontend (`react-router-dom`, en `apps/web`)
- `/` → redirige a `/tracker`.
- `/tracker` → **daily-tracking**: matriz hábito x día del ciclo activo (o el
  seleccionado), con toggle de estado por celda.
- `/habits` → **habit-catalog**: lista/alta/edición/pausa de hábitos + bloque de
  advertencias sobre suplementos.
- `/journal` → **emotional-log**: lista + formulario de registro emocional.
- `/dashboard` → **summary-dashboard**: indicadores + gráficos del ciclo activo.

Cada página consume la API de `apps/api` a través de hooks de `@tanstack/react-query`
definidos en `apps/web/src/api/` (por ejemplo `useHabits()`, `useCycleLogs(cycleId)`,
`useSetLogStatus()`).

## Manejo de estado de las celdas (UX del checkbox)
Reemplaza el problema del Excel (dropdown de 3 clics). En la app:
- Cada celda es un botón real (`<button>`), no un input de texto.
- Un clic izquierdo alterna `PENDING → DONE → PENDING` (dos estados de uso diario).
- Un clic derecho (o long-press en móvil) abre un menú pequeño con la opción
  "Marcar como no aplica" (`NA`), para el caso ocasional (ej. melatonina).
- Colores: `DONE` = verde sólido con ✓; `PENDING` = contorno gris vacío; `NA` = gris
  apagado con —. El fondo de toda la fila lleva el tinte suave de la categoría del
  hábito (igual que en el Excel rediseñado), para que la fila se perciba como una
  sola unidad y no como dos tablas pegadas.
- El clic dispara una mutación de React Query (`PUT /api/logs/:habitId/:date`) con
  actualización optimista: la celda cambia de color al instante y, si la petición
  falla, React Query revierte el estado visual y muestra un aviso corto.

## Fuera de alcance
Notificaciones/recordatorios, exportar a Excel/PDF, multiusuario, despliegue remoto.
Se pueden proponer como changes futuros si se necesitan.

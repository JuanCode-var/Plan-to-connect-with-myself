import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

// Singleton de PrismaClient. En desarrollo, ts-node-dev recarga el módulo en
// caliente en cada cambio de archivo; sin este patrón, cada recarga crearía una
// nueva instancia de PrismaClient (y una nueva pool de conexiones) sin cerrar la
// anterior, agotando las conexiones disponibles.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// La app se conecta siempre a Turso (no al dev.db local) para que todas las
// máquinas que clonen el repo vean los mismos datos — ver "Configurar una
// máquina nueva" en el README. TURSO_DATABASE_URL/TURSO_AUTH_TOKEN viven en
// apps/api/.env (nunca se suben al repo, ver .gitignore).
function createPrismaClient(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error(
      "Faltan TURSO_DATABASE_URL y/o TURSO_AUTH_TOKEN en apps/api/.env. Ver 'Configurar una máquina nueva' en el README para obtenerlos.",
    );
  }
  // `timestampFormat: "unixepoch-ms"` a propósito (no es el default del
  // adapter, que es "iso8601"): las columnas DateTime de la base ya tienen
  // filas escritas como entero (epoch ms) desde la migración inicial a
  // Turso. Si una versión del cliente escribiera fechas como texto ISO y
  // otra como entero en la misma columna, SQLite compara por "storage
  // class" (todo TEXT ordena después de todo INTEGER sin importar la fecha
  // real), rompiendo filtros de rango (`gte`/`lte`) de forma silenciosa.
  const adapter = new PrismaLibSQL({ url, authToken }, { timestampFormat: "unixepoch-ms" });
  return new PrismaClient({ adapter });
}

export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

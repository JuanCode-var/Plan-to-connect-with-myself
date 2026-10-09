import { createClient } from "@libsql/client";
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
  const libsql = createClient({ url, authToken });
  const adapter = new PrismaLibSQL(libsql);
  return new PrismaClient({ adapter });
}

export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

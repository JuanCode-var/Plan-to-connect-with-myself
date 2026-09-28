import { PrismaClient } from "@prisma/client";

// Singleton de PrismaClient. En desarrollo, ts-node-dev recarga el módulo en
// caliente en cada cambio de archivo; sin este patrón, cada recarga crearía una
// nueva instancia de PrismaClient (y una nueva pool de conexiones) sin cerrar la
// anterior, agotando las conexiones disponibles a la base SQLite.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

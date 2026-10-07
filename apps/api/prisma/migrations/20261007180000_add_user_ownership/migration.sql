-- Aislar los datos por cuenta: antes ninguna tabla tenía dueño y cualquier
-- cuenta logueada veía/editaba los mismos hábitos, ciclos, diario y metas.
-- Se agrega `userId` a Habit, Cycle, Goal, EmotionalEntry (obligatorio) y
-- LibraryEntry (opcional: NULL = contenido semilla compartido). HabitLog y
-- GoalStep NO llevan `userId` propio — su dueño se verifica siempre a
-- través de su padre ya validado (Habit/Cycle, Goal).
--
-- SQLite no soporta agregar una columna NOT NULL con FOREIGN KEY vía ALTER
-- TABLE ADD COLUMN, así que cada tabla se reconstruye (patrón estándar que
-- el propio motor de migraciones de Prisma genera para SQLite). Al momento
-- de esta migración había una sola cuenta real
-- (cmum2v5yw00009zmusry2b49u, manuel-torres34@hotmail.com) — todo lo
-- existente se le asigna a ella.

PRAGMA foreign_keys=OFF;

-- Habit --------------------------------------------------------------
CREATE TABLE "new_Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "moment" TEXT NOT NULL,
    "specification" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Habit" ("id","name","moment","specification","category","priority","sortOrder","active","createdAt","userId")
SELECT "id","name","moment","specification","category","priority","sortOrder","active","createdAt",'cmum2v5yw00009zmusry2b49u' FROM "Habit";
DROP TABLE "Habit";
ALTER TABLE "new_Habit" RENAME TO "Habit";
CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");

-- Cycle --------------------------------------------------------------
CREATE TABLE "new_Cycle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Cycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Cycle" ("id","name","startDate","endDate","createdAt","userId")
SELECT "id","name","startDate","endDate","createdAt",'cmum2v5yw00009zmusry2b49u' FROM "Cycle";
DROP TABLE "Cycle";
ALTER TABLE "new_Cycle" RENAME TO "Cycle";
CREATE INDEX "Cycle_userId_idx" ON "Cycle"("userId");

-- Goal ----------------------------------------------------------------
CREATE TABLE "new_Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "why" TEXT,
    "visualization" TEXT,
    "specification" TEXT NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "followUpNotes" TEXT,
    "celebration" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Goal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Goal" ("id","cycleId","title","why","visualization","specification","targetDate","status","followUpNotes","celebration","sortOrder","createdAt","userId")
SELECT "id","cycleId","title","why","visualization","specification","targetDate","status","followUpNotes","celebration","sortOrder","createdAt",'cmum2v5yw00009zmusry2b49u' FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
CREATE INDEX "Goal_cycleId_idx" ON "Goal"("cycleId");
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- LibraryEntry ----------------------------------------------------------
-- userId queda NULL para el contenido SEED (compartido); las entradas
-- source='USER' existentes se asignan a la única cuenta real de hoy.
CREATE TABLE "new_LibraryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT,
    "author" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pinnedUntil" DATETIME,
    "userId" TEXT,
    CONSTRAINT "LibraryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LibraryEntry" ("id","section","source","title","author","content","createdAt","pinnedUntil","userId")
SELECT "id","section","source","title","author","content","createdAt","pinnedUntil",
       CASE WHEN "source" = 'USER' THEN 'cmum2v5yw00009zmusry2b49u' ELSE NULL END
FROM "LibraryEntry";
DROP TABLE "LibraryEntry";
ALTER TABLE "new_LibraryEntry" RENAME TO "LibraryEntry";
CREATE INDEX "LibraryEntry_section_idx" ON "LibraryEntry"("section");
CREATE INDEX "LibraryEntry_userId_idx" ON "LibraryEntry"("userId");

-- EmotionalEntry ----------------------------------------------------------
CREATE TABLE "new_EmotionalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "emotion" TEXT,
    "situation" TEXT,
    "feeling" TEXT,
    "impulse" TEXT,
    "decision" TEXT,
    "learning" TEXT,
    "knowledge" TEXT,
    "gratitude" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "EmotionalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EmotionalEntry" ("id","date","emotion","situation","feeling","impulse","decision","learning","knowledge","gratitude","createdAt","userId")
SELECT "id","date","emotion","situation","feeling","impulse","decision","learning","knowledge","gratitude","createdAt",'cmum2v5yw00009zmusry2b49u' FROM "EmotionalEntry";
DROP TABLE "EmotionalEntry";
ALTER TABLE "new_EmotionalEntry" RENAME TO "EmotionalEntry";
CREATE INDEX "EmotionalEntry_date_idx" ON "EmotionalEntry"("date");
CREATE INDEX "EmotionalEntry_userId_idx" ON "EmotionalEntry"("userId");

PRAGMA foreign_keys=ON;

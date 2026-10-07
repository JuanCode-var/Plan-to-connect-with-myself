-- Metas del ciclo activo (sección "Metas", técnica de 5 fases + 3 pasos de
-- Brian Tracy): CreateTable para Goal y GoalStep.

CREATE TABLE "Goal" (
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
    CONSTRAINT "Goal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Goal_cycleId_idx" ON "Goal"("cycleId");

CREATE TABLE "GoalStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalStep_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "GoalStep_goalId_idx" ON "GoalStep"("goalId");

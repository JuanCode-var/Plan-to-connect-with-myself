-- AlterTable
ALTER TABLE "WoopPlan" ADD COLUMN "lastResultDate" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LearningApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "learningId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "microActionId" TEXT,
    CONSTRAINT "LearningApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LearningApplication_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LearningApplication_learningId_fkey" FOREIGN KEY ("learningId") REFERENCES "Learning" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LearningApplication_microActionId_fkey" FOREIGN KEY ("microActionId") REFERENCES "MicroAction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LearningApplication" ("createdAt", "date", "habitId", "id", "learningId", "response", "type", "userId") SELECT "createdAt", "date", "habitId", "id", "learningId", "response", "type", "userId" FROM "LearningApplication";
DROP TABLE "LearningApplication";
ALTER TABLE "new_LearningApplication" RENAME TO "LearningApplication";
CREATE INDEX "LearningApplication_userId_date_idx" ON "LearningApplication"("userId", "date");
CREATE INDEX "LearningApplication_microActionId_idx" ON "LearningApplication"("microActionId");
CREATE TABLE "new_MicroAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "learningId" TEXT,
    "compassId" TEXT,
    "text" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "origin" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLikelyNote" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "MicroAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MicroAction_learningId_fkey" FOREIGN KEY ("learningId") REFERENCES "Learning" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MicroAction_compassId_fkey" FOREIGN KEY ("compassId") REFERENCES "Compass" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MicroAction" ("compassId", "completed", "completedAt", "createdAt", "date", "id", "learningId", "origin", "text", "userId") SELECT "compassId", "completed", "completedAt", "createdAt", "date", "id", "learningId", "origin", "text", "userId" FROM "MicroAction";
DROP TABLE "MicroAction";
ALTER TABLE "new_MicroAction" RENAME TO "MicroAction";
CREATE INDEX "MicroAction_userId_date_idx" ON "MicroAction"("userId", "date");
CREATE INDEX "MicroAction_learningId_idx" ON "MicroAction"("learningId");
CREATE INDEX "MicroAction_compassId_idx" ON "MicroAction"("compassId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

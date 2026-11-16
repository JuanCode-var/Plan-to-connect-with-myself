-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LearningApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "habitId" TEXT,
    "context" TEXT,
    "learningId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "microActionId" TEXT,
    CONSTRAINT "LearningApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LearningApplication_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LearningApplication_learningId_fkey" FOREIGN KEY ("learningId") REFERENCES "Learning" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LearningApplication_microActionId_fkey" FOREIGN KEY ("microActionId") REFERENCES "MicroAction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LearningApplication" ("createdAt", "date", "habitId", "id", "learningId", "microActionId", "response", "type", "userId") SELECT "createdAt", "date", "habitId", "id", "learningId", "microActionId", "response", "type", "userId" FROM "LearningApplication";
DROP TABLE "LearningApplication";
ALTER TABLE "new_LearningApplication" RENAME TO "LearningApplication";
CREATE INDEX "LearningApplication_userId_date_idx" ON "LearningApplication"("userId", "date");
CREATE INDEX "LearningApplication_microActionId_idx" ON "LearningApplication"("microActionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

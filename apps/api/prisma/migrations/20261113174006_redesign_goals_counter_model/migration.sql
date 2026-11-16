/*
  Warnings:

  - You are about to drop the `GoalStep` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `celebration` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `followUpNotes` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `specification` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Goal` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "GoalStep_goalId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GoalStep";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "area" TEXT,
    "why" TEXT,
    "visualization" TEXT,
    "targetCount" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'meta cumplida',
    "targetDate" DATETIME NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "achievedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Goal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Goal" ("createdAt", "cycleId", "id", "sortOrder", "targetDate", "title", "userId", "visualization", "why") SELECT "createdAt", "cycleId", "id", "sortOrder", "targetDate", "title", "userId", "visualization", "why" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
CREATE INDEX "Goal_cycleId_idx" ON "Goal"("cycleId");
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

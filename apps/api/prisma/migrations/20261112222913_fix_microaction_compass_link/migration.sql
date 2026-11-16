/*
  Warnings:

  - You are about to drop the column `identityId` on the `MicroAction` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "MicroAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MicroAction_learningId_fkey" FOREIGN KEY ("learningId") REFERENCES "Learning" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MicroAction_compassId_fkey" FOREIGN KEY ("compassId") REFERENCES "Compass" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MicroAction" ("completed", "completedAt", "createdAt", "date", "id", "learningId", "origin", "text", "userId") SELECT "completed", "completedAt", "createdAt", "date", "id", "learningId", "origin", "text", "userId" FROM "MicroAction";
DROP TABLE "MicroAction";
ALTER TABLE "new_MicroAction" RENAME TO "MicroAction";
CREATE INDEX "MicroAction_userId_date_idx" ON "MicroAction"("userId", "date");
CREATE INDEX "MicroAction_learningId_idx" ON "MicroAction"("learningId");
CREATE INDEX "MicroAction_compassId_idx" ON "MicroAction"("compassId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

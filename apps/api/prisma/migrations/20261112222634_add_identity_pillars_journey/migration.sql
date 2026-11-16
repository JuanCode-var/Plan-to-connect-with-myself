-- AlterTable
ALTER TABLE "Compass" ADD COLUMN "lastFullPillarsJourneyAt" DATETIME;
ALTER TABLE "Compass" ADD COLUMN "pillarAutoconocimientoSealedAt" DATETIME;
ALTER TABLE "Compass" ADD COLUMN "pillarPropositoSealedAt" DATETIME;
ALTER TABLE "Compass" ADD COLUMN "pillarValoresSealedAt" DATETIME;

-- CreateTable
CREATE TABLE "IdentityDailyProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compassId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "strengthsUsed" TEXT,
    "valuesLived" TEXT,
    "beliefsReprogrammed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdentityDailyProgress_compassId_fkey" FOREIGN KEY ("compassId") REFERENCES "Compass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MicroAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "learningId" TEXT,
    "identityId" TEXT,
    "text" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "origin" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MicroAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MicroAction_learningId_fkey" FOREIGN KEY ("learningId") REFERENCES "Learning" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MicroAction_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MicroAction" ("completed", "completedAt", "createdAt", "date", "id", "learningId", "origin", "text", "userId") SELECT "completed", "completedAt", "createdAt", "date", "id", "learningId", "origin", "text", "userId" FROM "MicroAction";
DROP TABLE "MicroAction";
ALTER TABLE "new_MicroAction" RENAME TO "MicroAction";
CREATE INDEX "MicroAction_userId_date_idx" ON "MicroAction"("userId", "date");
CREATE INDEX "MicroAction_learningId_idx" ON "MicroAction"("learningId");
CREATE INDEX "MicroAction_identityId_idx" ON "MicroAction"("identityId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "IdentityDailyProgress_compassId_idx" ON "IdentityDailyProgress"("compassId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityDailyProgress_compassId_date_key" ON "IdentityDailyProgress"("compassId", "date");

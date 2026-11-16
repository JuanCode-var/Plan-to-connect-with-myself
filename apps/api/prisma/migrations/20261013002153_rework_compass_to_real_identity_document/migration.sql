/*
  Warnings:

  - You are about to drop the `CompassQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `lastWeeklyReviewAt` on the `Compass` table. All the data in the column will be lost.
  - You are about to drop the column `selfMessageText` on the `Compass` table. All the data in the column will be lost.
  - You are about to drop the column `strengthsText` on the `Compass` table. All the data in the column will be lost.
  - You are about to drop the column `struggleText` on the `Compass` table. All the data in the column will be lost.
  - You are about to drop the column `valuesText` on the `Compass` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `CompassReflection` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CompassQuestion";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Weakness" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compassId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "counterMessage" TEXT,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "Weakness_compassId_fkey" FOREIGN KEY ("compassId") REFERENCES "Compass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Compass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "uniqueness" TEXT,
    "enjoyWithoutBeingAsked" TEXT,
    "strengths" TEXT,
    "coreValues" TEXT,
    "limitingBeliefs" TEXT,
    "beliefsToReprogram" TEXT,
    "empoweringBeliefs" TEXT,
    "cause" TEXT,
    "impact" TEXT,
    "howToLiveDays" TEXT,
    "identityOnboardingCompletedAt" DATETIME,
    "lastReviewedAt" DATETIME,
    "messagesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Compass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Compass" ("createdAt", "id", "lastReviewedAt", "messagesEnabled", "userId") SELECT "createdAt", "id", "lastReviewedAt", "messagesEnabled", "userId" FROM "Compass";
DROP TABLE "Compass";
ALTER TABLE "new_Compass" RENAME TO "Compass";
CREATE UNIQUE INDEX "Compass_userId_key" ON "Compass"("userId");
CREATE TABLE "new_CompassReflection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compassId" TEXT NOT NULL,
    "context" TEXT,
    "answer" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompassReflection_compassId_fkey" FOREIGN KEY ("compassId") REFERENCES "Compass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CompassReflection" ("answer", "compassId", "context", "createdAt", "date", "id") SELECT "answer", "compassId", "context", "createdAt", "date", "id" FROM "CompassReflection";
DROP TABLE "CompassReflection";
ALTER TABLE "new_CompassReflection" RENAME TO "CompassReflection";
CREATE INDEX "CompassReflection_compassId_idx" ON "CompassReflection"("compassId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Weakness_compassId_idx" ON "Weakness"("compassId");

-- CreateTable
CREATE TABLE "CompassReflection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compassId" TEXT NOT NULL,
    "questionId" TEXT,
    "context" TEXT,
    "answer" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompassReflection_compassId_fkey" FOREIGN KEY ("compassId") REFERENCES "Compass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Compass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "valuesText" TEXT,
    "strengthsText" TEXT,
    "struggleText" TEXT,
    "selfMessageText" TEXT,
    "lastReviewedAt" DATETIME,
    "messagesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Compass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Compass" ("createdAt", "id", "lastReviewedAt", "selfMessageText", "strengthsText", "struggleText", "userId", "valuesText") SELECT "createdAt", "id", "lastReviewedAt", "selfMessageText", "strengthsText", "struggleText", "userId", "valuesText" FROM "Compass";
DROP TABLE "Compass";
ALTER TABLE "new_Compass" RENAME TO "Compass";
CREATE UNIQUE INDEX "Compass_userId_key" ON "Compass"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CompassReflection_compassId_idx" ON "CompassReflection"("compassId");

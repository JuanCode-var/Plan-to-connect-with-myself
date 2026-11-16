-- AlterTable
ALTER TABLE "Compass" ADD COLUMN "lastWeeklyReviewAt" DATETIME;

-- CreateTable
CREATE TABLE "CompassQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompassReflection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compassId" TEXT NOT NULL,
    "questionId" TEXT,
    "context" TEXT,
    "answer" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompassReflection_compassId_fkey" FOREIGN KEY ("compassId") REFERENCES "Compass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompassReflection_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CompassQuestion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CompassReflection" ("answer", "compassId", "context", "createdAt", "date", "id", "questionId") SELECT "answer", "compassId", "context", "createdAt", "date", "id", "questionId" FROM "CompassReflection";
DROP TABLE "CompassReflection";
ALTER TABLE "new_CompassReflection" RENAME TO "CompassReflection";
CREATE INDEX "CompassReflection_compassId_idx" ON "CompassReflection"("compassId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

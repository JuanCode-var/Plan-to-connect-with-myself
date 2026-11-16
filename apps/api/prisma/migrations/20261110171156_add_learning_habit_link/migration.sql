-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Learning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "keyIdea" TEXT,
    "source" TEXT,
    "area" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "habitId" TEXT,
    CONSTRAINT "Learning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Learning_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Learning" ("archived", "area", "createdAt", "id", "keyIdea", "source", "title", "userId") SELECT "archived", "area", "createdAt", "id", "keyIdea", "source", "title", "userId" FROM "Learning";
DROP TABLE "Learning";
ALTER TABLE "new_Learning" RENAME TO "Learning";
CREATE INDEX "Learning_userId_idx" ON "Learning"("userId");
CREATE INDEX "Learning_habitId_idx" ON "Learning"("habitId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

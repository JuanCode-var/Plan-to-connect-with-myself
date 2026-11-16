-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "moment" TEXT NOT NULL,
    "specification" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "identityId" TEXT,
    "minimalVersion" TEXT,
    "identityMessagesEnabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Habit_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Habit" ("active", "category", "createdAt", "id", "moment", "name", "priority", "sortOrder", "specification", "userId") SELECT "active", "category", "createdAt", "id", "moment", "name", "priority", "sortOrder", "specification", "userId" FROM "Habit";
DROP TABLE "Habit";
ALTER TABLE "new_Habit" RENAME TO "Habit";
CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");
CREATE INDEX "Habit_identityId_idx" ON "Habit"("identityId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

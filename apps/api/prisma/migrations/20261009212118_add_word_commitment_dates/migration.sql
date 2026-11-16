/*
  Warnings:

  - Added the required column `startDate` to the `WordCommitment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetDate` to the `WordCommitment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WordCommitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vaultId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WordCommitment_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "WordVault" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WordCommitment" ("createdAt", "id", "sortOrder", "text", "vaultId") SELECT "createdAt", "id", "sortOrder", "text", "vaultId" FROM "WordCommitment";
DROP TABLE "WordCommitment";
ALTER TABLE "new_WordCommitment" RENAME TO "WordCommitment";
CREATE INDEX "WordCommitment_vaultId_idx" ON "WordCommitment"("vaultId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

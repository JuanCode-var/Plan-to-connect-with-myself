-- CreateTable
CREATE TABLE "WordVault" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pinHash" TEXT,
    "signatureDataUrl" TEXT,
    "signedAt" DATETIME,
    CONSTRAINT "WordVault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WordCommitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vaultId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WordCommitment_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "WordVault" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LibraryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT,
    "author" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pinnedUntil" DATETIME,
    "userId" TEXT,
    CONSTRAINT "LibraryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LibraryEntry" ("author", "content", "createdAt", "id", "pinnedUntil", "section", "source", "title", "userId") SELECT "author", "content", "createdAt", "id", "pinnedUntil", "section", "source", "title", "userId" FROM "LibraryEntry";
DROP TABLE "LibraryEntry";
ALTER TABLE "new_LibraryEntry" RENAME TO "LibraryEntry";
CREATE INDEX "LibraryEntry_section_idx" ON "LibraryEntry"("section");
CREATE INDEX "LibraryEntry_userId_idx" ON "LibraryEntry"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "WordVault_userId_key" ON "WordVault"("userId");

-- CreateIndex
CREATE INDEX "WordCommitment_vaultId_idx" ON "WordCommitment"("vaultId");

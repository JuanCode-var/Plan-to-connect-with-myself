-- CreateTable
CREATE TABLE "Compass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "valuesText" TEXT,
    "strengthsText" TEXT,
    "struggleText" TEXT,
    "selfMessageText" TEXT,
    "lastReviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Compass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Identity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compassId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "why" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Identity_compassId_fkey" FOREIGN KEY ("compassId") REFERENCES "Compass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Compass_userId_key" ON "Compass"("userId");

-- CreateIndex
CREATE INDEX "Identity_compassId_idx" ON "Identity"("compassId");

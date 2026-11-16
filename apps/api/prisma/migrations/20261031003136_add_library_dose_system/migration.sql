-- AlterTable
ALTER TABLE "User" ADD COLUMN "readingFontSize" INTEGER;

-- CreateTable
CREATE TABLE "LibrarySchool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "area" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "LibrarySchoolChallengeDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "LibrarySchoolChallengeDay_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "LibrarySchool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SchoolChallengeProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "currentDay" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SchoolChallengeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SchoolChallengeProgress_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "LibrarySchool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookReadingProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "tab" TEXT NOT NULL DEFAULT 'IDEA',
    "currentIdeaIndex" INTEGER NOT NULL DEFAULT 0,
    "percent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NUEVO',
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BookReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BookReadingProgress_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LibraryEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dose" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "sourceEntryId" TEXT,
    "sourceSchoolId" TEXT,
    "hookTemplate" TEXT NOT NULL,
    "hookQuestion" TEXT NOT NULL,
    "hookOptionsJson" TEXT NOT NULL,
    "hookAnswer" TEXT NOT NULL,
    "guessQuestion" TEXT NOT NULL,
    "guessMin" INTEGER NOT NULL,
    "guessMax" INTEGER NOT NULL,
    "guessStep" INTEGER NOT NULL,
    "guessRealValue" INTEGER NOT NULL,
    "guessExplanation" TEXT NOT NULL,
    "holdInstruction" TEXT NOT NULL,
    "holdCompletionText" TEXT NOT NULL,
    "rewardEntryId" TEXT NOT NULL,
    "actionsJson" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dose_sourceEntryId_fkey" FOREIGN KEY ("sourceEntryId") REFERENCES "LibraryEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Dose_sourceSchoolId_fkey" FOREIGN KEY ("sourceSchoolId") REFERENCES "LibrarySchool" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Dose_rewardEntryId_fkey" FOREIGN KEY ("rewardEntryId") REFERENCES "LibraryEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoseProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "doseId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DoseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DoseProgress_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnlockedQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UnlockedQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UnlockedQuote_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LibraryEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "area" TEXT,
    "resumen" TEXT,
    "idea" TEXT,
    "ideasJson" TEXT,
    "schoolId" TEXT,
    CONSTRAINT "LibraryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LibraryEntry_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "LibrarySchool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LibraryEntry" ("author", "content", "createdAt", "id", "pinnedUntil", "section", "source", "title", "userId") SELECT "author", "content", "createdAt", "id", "pinnedUntil", "section", "source", "title", "userId" FROM "LibraryEntry";
DROP TABLE "LibraryEntry";
ALTER TABLE "new_LibraryEntry" RENAME TO "LibraryEntry";
CREATE INDEX "LibraryEntry_section_idx" ON "LibraryEntry"("section");
CREATE INDEX "LibraryEntry_userId_idx" ON "LibraryEntry"("userId");
CREATE INDEX "LibraryEntry_schoolId_idx" ON "LibraryEntry"("schoolId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "LibrarySchoolChallengeDay_schoolId_day_key" ON "LibrarySchoolChallengeDay"("schoolId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolChallengeProgress_userId_schoolId_key" ON "SchoolChallengeProgress"("userId", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "BookReadingProgress_userId_entryId_key" ON "BookReadingProgress"("userId", "entryId");

-- CreateIndex
CREATE INDEX "Dose_area_idx" ON "Dose"("area");

-- CreateIndex
CREATE INDEX "Dose_sourceEntryId_idx" ON "Dose"("sourceEntryId");

-- CreateIndex
CREATE INDEX "Dose_sourceSchoolId_idx" ON "Dose"("sourceSchoolId");

-- CreateIndex
CREATE INDEX "DoseProgress_userId_date_idx" ON "DoseProgress"("userId", "date");

-- CreateIndex
CREATE INDEX "DoseProgress_userId_doseId_idx" ON "DoseProgress"("userId", "doseId");

-- CreateIndex
CREATE UNIQUE INDEX "UnlockedQuote_userId_entryId_key" ON "UnlockedQuote"("userId", "entryId");

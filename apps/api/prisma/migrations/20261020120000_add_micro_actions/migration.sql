-- CreateTable
CREATE TABLE "Learning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "keyIdea" TEXT,
    "source" TEXT,
    "area" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Learning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MicroAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "learningId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "origin" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MicroAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MicroAction_learningId_fkey" FOREIGN KEY ("learningId") REFERENCES "Learning" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearningApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "learningId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LearningApplication_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LearningApplication_learningId_fkey" FOREIGN KEY ("learningId") REFERENCES "Learning" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WoopPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "desire" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "obstacle" TEXT NOT NULL,
    "planIf" TEXT NOT NULL,
    "planThen" TEXT NOT NULL,
    "identityId" TEXT,
    "sourceInsightType" TEXT,
    "sourceInsightSummary" TEXT,
    "reminderWeekday" INTEGER,
    "reminderTime" TEXT,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "timesWorked" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WoopPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WoopPlan_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Learning_userId_idx" ON "Learning"("userId");

-- CreateIndex
CREATE INDEX "MicroAction_userId_date_idx" ON "MicroAction"("userId", "date");

-- CreateIndex
CREATE INDEX "MicroAction_learningId_idx" ON "MicroAction"("learningId");

-- CreateIndex
CREATE INDEX "LearningApplication_userId_date_idx" ON "LearningApplication"("userId", "date");

-- CreateIndex
CREATE INDEX "WoopPlan_userId_idx" ON "WoopPlan"("userId");

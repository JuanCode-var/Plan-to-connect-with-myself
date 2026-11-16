-- CreateTable
CREATE TABLE "NeuralAreaStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "impulsosDeVida" INTEGER NOT NULL DEFAULT 0,
    "activeDays" INTEGER NOT NULL DEFAULT 0,
    "lastImpulseDate" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NeuralAreaStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NeuralDailyState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "coreState" TEXT NOT NULL,
    "impulses" INTEGER NOT NULL,
    CONSTRAINT "NeuralDailyState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NeuralAreaStat_userId_area_key" ON "NeuralAreaStat"("userId", "area");

-- CreateIndex
CREATE UNIQUE INDEX "NeuralDailyState_userId_date_key" ON "NeuralDailyState"("userId", "date");

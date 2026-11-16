-- CreateTable
CREATE TABLE "WordCommitmentMonth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commitmentId" TEXT NOT NULL,
    "monthIndex" INTEGER NOT NULL,
    "sealed" BOOLEAN NOT NULL,
    "fallReportedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WordCommitmentMonth_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "WordCommitment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WordCommitmentMonth_commitmentId_idx" ON "WordCommitmentMonth"("commitmentId");

-- CreateIndex
CREATE UNIQUE INDEX "WordCommitmentMonth_commitmentId_monthIndex_key" ON "WordCommitmentMonth"("commitmentId", "monthIndex");

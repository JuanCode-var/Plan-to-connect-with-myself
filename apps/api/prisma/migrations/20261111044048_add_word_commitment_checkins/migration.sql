-- AlterTable
ALTER TABLE "WordCommitment" ADD COLUMN "result" TEXT;
ALTER TABLE "WordCommitment" ADD COLUMN "resultConfirmedAt" DATETIME;

-- CreateTable
CREATE TABLE "WordCommitmentCheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commitmentId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "honored" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WordCommitmentCheckIn_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "WordCommitment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WordCommitmentCheckIn_commitmentId_idx" ON "WordCommitmentCheckIn"("commitmentId");

-- CreateIndex
CREATE UNIQUE INDEX "WordCommitmentCheckIn_commitmentId_date_key" ON "WordCommitmentCheckIn"("commitmentId", "date");

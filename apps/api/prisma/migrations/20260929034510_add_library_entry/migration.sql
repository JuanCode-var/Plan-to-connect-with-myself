-- CreateTable
CREATE TABLE "LibraryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT,
    "author" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "LibraryEntry_section_idx" ON "LibraryEntry"("section");

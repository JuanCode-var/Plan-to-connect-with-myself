-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmotionalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "emotion" TEXT,
    "situation" TEXT,
    "feeling" TEXT,
    "impulse" TEXT,
    "decision" TEXT,
    "learning" TEXT,
    "knowledge" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_EmotionalEntry" ("createdAt", "date", "decision", "emotion", "feeling", "id", "impulse", "knowledge", "learning", "situation") SELECT "createdAt", "date", "decision", "emotion", "feeling", "id", "impulse", "knowledge", "learning", "situation" FROM "EmotionalEntry";
DROP TABLE "EmotionalEntry";
ALTER TABLE "new_EmotionalEntry" RENAME TO "EmotionalEntry";
CREATE INDEX "EmotionalEntry_date_idx" ON "EmotionalEntry"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

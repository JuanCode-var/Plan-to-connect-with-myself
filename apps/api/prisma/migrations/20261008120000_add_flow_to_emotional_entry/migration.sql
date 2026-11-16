-- Cuarta sección del Diario: minutos en flow state + actividad opcional.
-- Columnas nullable, sin FK — ALTER TABLE ADD COLUMN alcanza, no hace falta
-- reconstruir la tabla como en migraciones anteriores.
ALTER TABLE "EmotionalEntry" ADD COLUMN "flowMinutes" INTEGER;
ALTER TABLE "EmotionalEntry" ADD COLUMN "flowActivity" TEXT;

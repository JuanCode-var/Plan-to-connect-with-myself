-- Días de la semana en que el hábito aplica (CSV "0,1,2"..."6", null =
-- todos los días). Columna nullable, sin FK — ALTER TABLE ADD COLUMN
-- alcanza, no hace falta reconstruir la tabla.
ALTER TABLE "Habit" ADD COLUMN "activeWeekdays" TEXT;

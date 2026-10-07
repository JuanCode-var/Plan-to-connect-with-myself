-- Separar "categoría" en dos campos independientes: antes un solo valor de
-- 6 opciones (PRIORIDAD_MAXIMA/SUPLEMENTO/OPCIONAL/HABITO_BASE/CONDICIONAL/
-- AUTOCONOCIMIENTO) mezclaba urgencia y área de vida. Ahora:
--   - category: área de vida (FISICO/ECONOMICO/MENTAL/EMOCIONAL/HABILIDADES/ESPIRITUAL)
--   - priority: urgencia (ALTA/MEDIA/BAJA), columna nueva

-- 1) Columna nueva con default temporal 'MEDIA' (SQLite exige default en una
--    columna NOT NULL agregada a una tabla con filas existentes). Se
--    sobreescribe fila por fila en el paso 2 según la categoría vieja.
ALTER TABLE "Habit" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'MEDIA';

-- 2) Prioridad: mapeo determinístico desde la categoría vieja (la misma
--    tabla que antes vivía en HABIT_CATEGORY_PRIORITY del frontend).
UPDATE "Habit" SET "priority" = 'ALTA' WHERE "category" = 'PRIORIDAD_MAXIMA';
UPDATE "Habit" SET "priority" = 'MEDIA' WHERE "category" IN ('HABITO_BASE', 'CONDICIONAL', 'AUTOCONOCIMIENTO');
UPDATE "Habit" SET "priority" = 'BAJA' WHERE "category" IN ('SUPLEMENTO', 'OPCIONAL');

-- 3) Categoría: no hay traducción automática posible (la vieja medía
--    urgencia, no área de vida), así que esto es un remapeo manual, hecho
--    una sola vez para los datos reales de esta cuenta a esta fecha.
--    Default seguro primero (FISICO, el área más común) para cualquier
--    hábito viejo que no matchee ningún nombre reconocido abajo...
UPDATE "Habit" SET "category" = 'FISICO'
WHERE "category" IN ('PRIORIDAD_MAXIMA', 'SUPLEMENTO', 'OPCIONAL', 'HABITO_BASE', 'CONDICIONAL', 'AUTOCONOCIMIENTO');

-- ...y acá se corrige por nombre para los que claramente son de otra área
-- (todo lo que no aparece abajo — agua, creatina, melena de león, levadura,
-- cero alcohol, sueño, melatonina, ejercicio — se queda en FISICO).
UPDATE "Habit" SET "category" = 'ECONOMICO'
WHERE "name" IN ('Cero apuestas', 'Trabajar económicamente, día a día.');

UPDATE "Habit" SET "category" = 'MENTAL'
WHERE "name" IN ('Pasar menos de 2 horas en el celular.', '0 FAP', 'Cambia tus creencias', 'Vamos a trabajar en el subconsciente.', 'Trabajar en el intelecto.');

UPDATE "Habit" SET "category" = 'EMOCIONAL'
WHERE "name" IN ('Registro emocional y autoconocimiento', 'Escribir 3 cosas por las que me encuentro agradecido el día de hoy.');

UPDATE "Habit" SET "category" = 'HABILIDADES'
WHERE "name" IN ('Full enfoque 4 horas al trabajo.', 'Trabajar en el proyecto NeuroTica');

UPDATE "Habit" SET "category" = 'ESPIRITUAL'
WHERE "name" IN ('Vamos a trabajar espiritualmente');

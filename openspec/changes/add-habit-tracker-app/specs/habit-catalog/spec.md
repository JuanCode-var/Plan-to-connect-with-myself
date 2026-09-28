## ADDED Requirements

### Requirement: Catálogo de hábitos
El sistema DEBE mantener un catálogo de hábitos, cada uno con nombre, momento del día
(Mañana, Día, Noche, Cierre del día), especificación diaria, categoría (Prioridad
máxima, Suplemento, Opcional, Hábito base, Condicional, Autoconocimiento) y un estado
activo/pausado.

#### Scenario: Ver catálogo completo
- **WHEN** el usuario abre `/habits`
- **THEN** el sistema muestra todos los hábitos activos agrupados por momento del día,
  cada uno con su especificación completa visible (no truncada) y una insignia de
  color según su categoría.

#### Scenario: Crear un hábito nuevo
- **WHEN** el usuario completa el formulario de nuevo hábito (nombre, momento,
  especificación, categoría) y confirma
- **THEN** el sistema crea el hábito con `active = true` y lo incluye automáticamente
  en la matriz de seguimiento del ciclo activo a partir de la fecha de creación.

#### Scenario: Editar la especificación de un hábito
- **WHEN** el usuario edita el texto de especificación de un hábito existente
- **THEN** el sistema guarda el nuevo texto y lo refleja en `/habits` y en el tooltip
  o detalle de la celda en `/tracker`, sin alterar los registros (`HabitLog`) ya
  guardados de días anteriores.

#### Scenario: Pausar un hábito
- **WHEN** el usuario pausa un hábito
- **THEN** el sistema marca `active = false`, deja de mostrarlo en nuevas filas de
  `/tracker` a partir de esa fecha, pero conserva su historial completo y sigue
  contándolo en el dashboard histórico.

### Requirement: Datos semilla del catálogo
El sistema DEBE incluir un script de seed que crea los 12 hábitos actuales del plan
Dr. Axón (Luz natural al despertar, Creatina monohidratada, Melena de león, Levadura
de cerveza, Cero apuestas, Cero alcohol, Entrenamiento o movimiento, Bloque de estudio,
Preparar el sueño, Reservar ventana de sueño 7-9h, Melatonina condicional, Registro
emocional y autoconocimiento) con su momento, especificación y categoría exactos, en
ese orden.

#### Scenario: Ejecutar el seed en un proyecto nuevo
- **WHEN** se ejecuta `npx prisma db seed` sobre una base de datos vacía
- **THEN** el sistema crea los 12 hábitos descritos arriba y un primer ciclo llamado
  "Ciclo 1" con `startDate = 2026-09-14` y `endDate = 2026-10-13`.

### Requirement: Advertencias sobre suplementos
El sistema DEBE mostrar, de forma permanente y visible (no oculta detrás de un tooltip
opcional) en `/habits`, un bloque de advertencias sobre suplementos:
- El Neurobion (150 mg de vitamina B6) no se incluye como hábito diario automático ni
  debe usarse prolongadamente sin valoración profesional.
- La melatonina es condicional: no combinar con alcohol, no usar para compensar
  trasnochos.
- La creatina se registra como 3 g diarios, no como dosis de energía inmediata.
- Melena de león y levadura de cerveza son opcionales; evidencia limitada en humanos.
- Los suplementos no sustituyen sueño, alimentación, tratamiento de salud mental ni
  ayuda profesional para ludopatía o consumo problemático de alcohol.
- La app es una herramienta de seguimiento personal, no un diagnóstico ni tratamiento
  médico o psicológico.

#### Scenario: Advertencias siempre visibles
- **WHEN** el usuario abre `/habits`
- **THEN** el bloque de advertencias se muestra sin necesidad de clic adicional
  (puede estar colapsado por defecto, pero visible el título y el texto disponible
  con un solo clic, nunca enterrado en un menú de configuración).

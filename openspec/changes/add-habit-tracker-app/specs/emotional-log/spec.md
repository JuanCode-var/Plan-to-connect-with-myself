## ADDED Requirements

### Requirement: Registro emocional diario
El sistema DEBE permitir crear una entrada de registro emocional con fecha, emoción
principal (de una lista predefinida: Ansiedad, Tristeza, Vacío, Agotamiento,
Frustración, Culpa, Desmotivación, Otra), qué ocurrió, qué sentí, qué impulso
apareció, qué decisión tomé y qué aprendí.

#### Scenario: Crear una entrada desde /journal
- **WHEN** el usuario completa el formulario de registro emocional con al menos la
  fecha y la emoción principal, y confirma
- **THEN** el sistema guarda la entrada y la muestra al inicio de la lista de
  `/journal` (orden descendente por fecha).

#### Scenario: Campos narrativos opcionales
- **WHEN** el usuario guarda una entrada sin completar "qué aprendí"
- **THEN** el sistema la guarda igualmente (los campos narrativos distintos de fecha
  y emoción son opcionales, no bloquean el guardado).

### Requirement: Historial consultable
El sistema DEBE permitir filtrar el historial de registros emocionales por rango de
fechas y por emoción principal.

#### Scenario: Filtrar por emoción
- **WHEN** el usuario selecciona "Ansiedad" en el filtro de emoción de `/journal`
- **THEN** el sistema muestra únicamente las entradas cuya emoción principal sea
  "Ansiedad", ordenadas por fecha descendente.

### Requirement: Atajo desde el tracker diario
El sistema DEBE ofrecer, desde `/tracker`, un acceso directo para crear la entrada de
registro emocional del día actual sin tener que navegar manualmente a `/journal` y
volver a seleccionar la fecha.

#### Scenario: Registrar el día desde el tracker
- **WHEN** el usuario hace clic en el atajo "Registro emocional de hoy" en `/tracker`
- **THEN** el sistema abre el formulario de `/journal` con la fecha de hoy
  preseleccionada.

## ADDED Requirements

### Requirement: Ciclos de seguimiento
El sistema DEBE organizar el seguimiento diario en "ciclos", cada uno con nombre,
fecha de inicio y fecha de fin. Debe existir siempre un ciclo activo (el de fecha de
fin más próxima o futura respecto a hoy).

#### Scenario: Crear un nuevo ciclo al terminar el actual
- **WHEN** el usuario crea un nuevo ciclo indicando nombre y fecha de inicio (la app
  sugiere el día siguiente al `endDate` del ciclo anterior, y una duración por defecto
  de 30 días)
- **THEN** el sistema crea el ciclo y lo convierte en el ciclo activo mostrado por
  defecto en `/tracker` y `/dashboard`.

### Requirement: Matriz hábito x día
El sistema DEBE mostrar, para el ciclo seleccionado, una matriz con un hábito activo
por fila (agrupado visualmente por momento del día) y una columna por cada día del
ciclo, replicando la estructura horizontal del checklist original (hábitos en filas,
días en columnas, nunca al revés).

#### Scenario: Ver la matriz del ciclo activo
- **WHEN** el usuario abre `/tracker`
- **THEN** el sistema muestra las columnas de encabezado (número de día y fecha
  `dd/mm`), fila por cada hábito activo con su nombre y, al fondo de la fila, un
  tinte de color suave correspondiente a la categoría del hábito.

### Requirement: Marcado de estado por celda
Cada celda hábito x día DEBE representar uno de tres estados: `PENDING` (por
defecto), `DONE` o `NA`, y DEBE poder cambiarse en un máximo de un clic para el caso
de uso diario (`PENDING ⇄ DONE`).

#### Scenario: Marcar un hábito como cumplido
- **WHEN** el usuario hace clic izquierdo sobre una celda en estado `PENDING`
- **THEN** el sistema cambia el estado a `DONE` inmediatamente (sin recargar la
  página) y la celda se pinta en verde con un ✓.

#### Scenario: Revertir un marcado
- **WHEN** el usuario hace clic izquierdo sobre una celda en estado `DONE`
- **THEN** el sistema la regresa a `PENDING`.

#### Scenario: Marcar un día como no aplicable
- **WHEN** el usuario hace clic derecho (o long-press en móvil) sobre una celda y
  selecciona "No aplica"
- **THEN** el sistema guarda el estado `NA` para esa celda y la excluye del
  denominador de los porcentajes de cumplimiento de esa fila/columna.

### Requirement: Persistencia inmediata
Cada cambio de estado de una celda DEBE guardarse en la base de datos en el momento
del clic (Server Action), sin requerir un botón "Guardar" separado.

#### Scenario: Cerrar la app justo después de marcar
- **WHEN** el usuario marca una celda como `DONE` y cierra la pestaña inmediatamente
- **THEN** al volver a abrir `/tracker` la celda sigue mostrando `DONE`.

### Requirement: Porcentajes en vivo
El sistema DEBE calcular y mostrar, sin recargar la página, el % de cumplimiento por
hábito (fila) y el % de cumplimiento por día (columna), excluyendo del cálculo las
celdas en estado `NA`.

#### Scenario: Porcentaje por hábito se actualiza al marcar
- **WHEN** el usuario marca como `DONE` un día pendiente de un hábito
- **THEN** el porcentaje de esa fila se recalcula y se refleja en la UI sin recargar
  la página.

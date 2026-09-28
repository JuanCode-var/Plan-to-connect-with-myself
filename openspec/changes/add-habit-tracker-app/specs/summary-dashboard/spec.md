## ADDED Requirements

### Requirement: Indicadores generales del ciclo activo
El sistema DEBE mostrar en `/dashboard`, para el ciclo seleccionado: total de días
marcados como cumplidos, total de días pendientes, total de celdas "no aplica",
porcentaje de cumplimiento general (excluyendo "no aplica" del denominador), días sin
apuestas, días sin alcohol, días con entrenamiento, días con estudio y días con
registro emocional.

#### Scenario: Ver indicadores del ciclo activo
- **WHEN** el usuario abre `/dashboard` sin seleccionar un ciclo específico
- **THEN** el sistema calcula y muestra todos los indicadores usando el ciclo activo
  por defecto (el de fecha de fin más próxima o futura).

#### Scenario: Ver indicadores de un ciclo pasado
- **WHEN** el usuario selecciona un ciclo anterior en el selector de `/dashboard`
- **THEN** el sistema recalcula todos los indicadores usando únicamente los
  `HabitLog` de ese ciclo.

### Requirement: Gráfico de cumplimiento por hábito
El sistema DEBE mostrar un gráfico de barras con el porcentaje de cumplimiento de
cada hábito activo del ciclo seleccionado, destacando visualmente los hábitos de
categoría "Prioridad máxima".

#### Scenario: Barra de un hábito de prioridad máxima
- **WHEN** se renderiza el gráfico de cumplimiento por hábito
- **THEN** las barras de "Cero apuestas" y "Cero alcohol" usan un color distintivo
  (rojo) respecto a las demás categorías.

### Requirement: Gráfico de tendencia diaria
El sistema DEBE mostrar un gráfico de línea con el porcentaje de cumplimiento por día
a lo largo del ciclo seleccionado (eje X = día del ciclo, eje Y = % cumplimiento).

#### Scenario: Tendencia con datos parciales
- **WHEN** el ciclo activo aún no ha llegado a su `endDate` (está en curso)
- **THEN** el gráfico de tendencia muestra únicamente los días transcurridos hasta
  hoy, sin proyectar ni rellenar con ceros los días futuros.

### Requirement: Comparación entre ciclos
El sistema DEBE permitir comparar el porcentaje de cumplimiento general entre los
distintos ciclos ya creados, para ver evolución en el tiempo.

#### Scenario: Ver evolución entre ciclos
- **WHEN** existen dos o más ciclos con al menos un día registrado
- **THEN** `/dashboard` muestra un gráfico o tabla adicional con el % de
  cumplimiento general de cada ciclo, ordenados cronológicamente.

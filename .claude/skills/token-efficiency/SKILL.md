---
name: token-efficiency
description: Reduce el consumo de tokens en conversaciones e integraciones de Claude Code aplicando exploración dirigida, ediciones puntuales y comunicación concisa, en lugar de leer archivos completos, volcar salidas largas de bash o escribir respuestas verbosas. Usa esta skill SIEMPRE que la tarea implique leer o editar código, ejecutar comandos, trabajar en un repositorio, o cuando la conversación empiece a acumular mucho contexto — no solo cuando el usuario mencione explícitamente "tokens" o "eficiencia". Aplica por defecto en cualquier sesión de trabajo técnico, no solo cuando se pida.
---

# Eficiencia de tokens

## Por qué importa

Cada archivo leído completo, cada log de bash volcado sin filtrar, y cada respuesta con preámbulos y repeticiones consume tokens que no aportan valor a la tarea. El objetivo no es dar respuestas más pobres — es llegar al mismo resultado (o uno mejor) gastando menos contexto en cosas que no importan, para dejar más espacio a lo que sí importa: el código, el razonamiento, y la memoria útil de la sesión.

El ahorro real varía mucho según la tarea (un repo grande con muchos archivos se beneficia más que un script de 20 líneas), así que trata estas técnicas como hábitos por defecto, no como una promesa de un porcentaje fijo en cada interacción.

## 1. Explora antes de leer completo

Antes de abrir un archivo entero, ubica lo relevante:

- Usa `grep -n "patron" archivo` o `grep -rn "patron" directorio/` para encontrar la línea exacta antes de ver el archivo completo.
- Usa `find` o `glob` para localizar archivos por nombre en vez de listar directorios completos con `ls -R`.
- Si ya sabes qué función o clase buscas, `grep -n "def nombre_funcion"` te da el número de línea para pedir solo ese rango.

**Evita:** `view` de un archivo de 2000 líneas cuando solo necesitas una función.
**Prefiere:** `grep -n "nombre_funcion" archivo.py` → luego `view` con `view_range` acotado a esas líneas ± contexto razonable.

## 2. Lee solo el rango que necesitas

La herramienta `view` acepta `view_range`. Úsalo siempre que:
- El archivo supere ~200 líneas y sepas (por el grep anterior) dónde está lo relevante.
- Solo necesites confirmar el contexto inmediato alrededor de un cambio, no el archivo entero.

Solo lee el archivo completo cuando genuinamente necesitas entender su estructura global (por ejemplo, antes de una refactorización grande) — no por defecto.

## 3. Edita, no reescribas

Para modificar código existente, usa `str_replace` con el fragmento mínimo necesario, no reescribas el archivo completo con `create_file` sobre un archivo ya existente.

- Un cambio de una línea debe ser una llamada a `str_replace` con esa línea (y suficiente contexto para que `old_str` sea único), no un `cat > archivo.py << EOF` con todo el contenido.
- Si vas a hacer varios cambios pequeños en el mismo archivo, agrúpalos mentalmente pero aplícalos como ediciones puntuales, no como una reescritura total.
- Reescribe el archivo completo solo cuando la mayoría de sus líneas van a cambiar — ahí reescribir es más simple que encadenar diez `str_replace`.

## 4. Filtra la salida de bash antes de que llegue a tu contexto

Los comandos que devuelven mucho texto son la fuente #1 de tokens desperdiciados.

- Logs largos: `comando | tail -50` o `comando | grep -i error` en vez de volcar todo.
- Archivos grandes desde bash: `head -n 50 archivo`, `wc -l archivo` para saber el tamaño antes de decidir cuánto leer.
- Resultados de tests: pide solo el resumen (`pytest -q`, `npm test -- --silent`) en vez del output verboso completo, salvo que estés depurando un fallo específico y necesites el detalle.
- `git diff` o `git log`: acótalos (`git log --oneline -10`, `git diff -- archivo.py`) en vez de pedir el historial completo del repo.

## 5. Agrupa llamadas a herramientas en el mismo turno

Si sabes que vas a necesitar leer tres archivos o correr dos comandos independientes, dispáralos en el mismo turno en vez de uno por uno esperando cada resultado antes de pedir el siguiente. Esto no reduce tokens por sí solo, pero reduce turnos de ida y vuelta, que sí acumulan overhead (contexto repetido, preámbulos, etc.).

## 6. No releas lo que ya viste en la sesión

Si ya leíste un archivo o el resultado de un comando en este mismo hilo de conversación, ese contenido sigue en tu contexto. No lo vuelvas a pedir "para confirmar" salvo que sepas que cambió (por ejemplo, después de una edición tuya o del usuario). Antes de releer, pregúntate: ¿esto pudo haber cambiado desde la última vez que lo vi?

## 7. Resume y parafrasea, no cites bloques largos

Cuando expliques qué hace un archivo, un log, o un resultado, describe el comportamiento relevante en una o dos frases en lugar de reproducir el bloque completo en tu respuesta. Reservar la cita textual para fragmentos realmente cortos y necesarios (una línea de error puntual, por ejemplo).

## 8. Sé directo en las respuestas al usuario

- No repitas la pregunta del usuario antes de responder.
- No expliques qué vas a hacer y luego lo hagas y luego resumas lo que hiciste — elige uno: normalmente basta con hacerlo y reportar el resultado.
- Evita frases de relleno ("Claro, con gusto te ayudo con eso", "Es una excelente pregunta") cuando el usuario ya está en medio de una tarea técnica iterativa.
- En tareas de varios pasos, un resumen final breve (qué cambió y por qué) es más útil que narrar cada paso intermedio en detalle.

## 9. Gestiona el contexto de la sesión activamente

- Cuando termines una subtarea claramente delimitada y vayas a empezar algo no relacionado, sugiere o usa `/compact` para comprimir el historial en vez de dejar que crezca sin control.
- Si vas a cambiar de tema por completo (no solo de subtarea dentro del mismo proyecto), considera `/clear` y retomar con `--continue` o `--resume` si necesitas volver luego — ver la skill de gestión de sesiones si existe en este entorno.
- No dejes que el "razonamiento en voz alta" se alargue en tareas simples y mecánicas; reserva el razonamiento extenso para decisiones genuinamente ambiguas o de alto impacto (arquitectura, trade-offs, bugs difíciles de rastrear).

## 10. Planifica antes de ejecutar para evitar idas y vueltas

Antes de lanzarte a editar, dedica un momento a entender el alcance real del cambio (qué archivos toca, qué dependencias tiene). Un plan corto al inicio evita rondas de "ah, también hay que cambiar esto otro" que cada una implica releer contexto y repetir explicaciones.

## Checklist rápido antes de cada acción

Antes de leer un archivo → ¿ya usé grep/find para ubicar lo que necesito, o estoy leyendo "para ver qué hay"?
Antes de correr un comando → ¿puedo acotar o filtrar la salida de antemano?
Antes de reescribir un archivo → ¿un str_replace puntual alcanza?
Antes de responder → ¿estoy repitiendo algo que el usuario ya sabe o que ya dije?
Antes de razonar largo → ¿esta decisión realmente lo necesita?

Ninguna de estas reglas debe sacrificar corrección: si dudas entre "leer un poco más de contexto" o "arriesgarme a editar con información incompleta", lee un poco más. La eficiencia sirve para no desperdiciar tokens en trabajo redundante, nunca para justificar cambios apresurados o mal informados.

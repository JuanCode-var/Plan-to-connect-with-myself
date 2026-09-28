## ADDED Requirements

### Requirement: Registro de cuenta
El sistema DEBE permitir crear una cuenta con nombre, email y contraseña de al menos
6 caracteres, rechazando el registro si el email ya existe.

#### Scenario: Registrar una cuenta nueva
- **WHEN** el usuario completa el formulario de `/register` con nombre, email y
  contraseña válidos y confirma
- **THEN** el sistema crea la cuenta, guarda la contraseña con hash (nunca en texto
  plano), inicia sesión automáticamente y lo lleva a la app.

#### Scenario: Email ya registrado
- **WHEN** el usuario intenta registrarse con un email que ya tiene cuenta
- **THEN** el sistema rechaza el registro con un error claro, sin crear una segunda
  cuenta.

### Requirement: Inicio de sesión
El sistema DEBE permitir iniciar sesión con email y contraseña, y DEBE responder con
el mismo mensaje genérico tanto si el email no existe como si la contraseña es
incorrecta, para no confirmar qué emails están registrados.

#### Scenario: Iniciar sesión con credenciales correctas
- **WHEN** el usuario completa `/login` con el email y la contraseña de una cuenta
  existente
- **THEN** el sistema inicia sesión y lo lleva a la ruta que quería ver originalmente
  (o a `/tracker` si llegó directamente a `/login`).

#### Scenario: Contraseña incorrecta o email inexistente
- **WHEN** el usuario completa `/login` con una contraseña incorrecta, o con un email
  que no tiene cuenta
- **THEN** el sistema muestra el mismo mensaje de error genérico en ambos casos, sin
  iniciar sesión.

### Requirement: Puerta de entrada a la app
El sistema DEBE requerir una sesión válida para acceder a `/tracker`, `/habits`,
`/journal` y `/dashboard`, redirigiendo a `/login` en caso contrario y volviendo a la
ruta pedida después de iniciar sesión.

#### Scenario: Acceso sin sesión
- **WHEN** un usuario sin sesión válida intenta abrir cualquiera de las 4 vistas
- **THEN** el sistema lo redirige a `/login` sin mostrar ningún dato de la app.

#### Scenario: Volver a la ruta pedida tras iniciar sesión
- **WHEN** un usuario sin sesión intenta abrir `/dashboard`, es redirigido a
  `/login`, e inicia sesión correctamente
- **THEN** el sistema lo lleva a `/dashboard` (la ruta que pidió originalmente), no a
  una página de inicio genérica.

### Requirement: Cierre de sesión
El sistema DEBE permitir cerrar sesión desde cualquier vista de la app.

#### Scenario: Cerrar sesión
- **WHEN** el usuario hace clic en "Cerrar sesión"
- **THEN** el sistema invalida el token guardado localmente y lo redirige a
  `/login`.

### Requirement: Los datos siguen siendo compartidos, no por cuenta
El sistema NO DEBE particionar `Habit`, `Cycle`, `HabitLog` ni `EmotionalEntry` por
cuenta de usuario — el login identifica quién usa la app, no separa su información.

#### Scenario: Dos cuentas ven los mismos datos
- **WHEN** dos cuentas distintas inician sesión (en momentos distintos, en el mismo
  dispositivo local) y abren `/tracker`
- **THEN** ambas ven exactamente los mismos hábitos, ciclos y registros — ninguno es
  específico de una cuenta.

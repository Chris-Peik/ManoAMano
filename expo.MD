# Documentación del Proyecto y Plan de Revisión de Código

Este documento detalla la funcionalidad de los módulos principales del sistema y los permisos necesarios para acceder a ellos.

## 1. Módulo de Pacientes (`src/modules/pacientes`)
Este módulo es el núcleo de la gestión clínica, permitiendo el control de ingresos, altas y el expediente digital de los pacientes.

### Funciones Principales:
*   **Visualización de Pacientes:** Lista de pacientes activos (hospitalizados) e inactivos (altas). Muestra estado de triage, alertas (signos vitales pendientes, sin cama) y enfermero asignado.
*   **Gestión de Ingresos:** Registro de nuevos pacientes y reingresos (nuevas admisiones).
*   **Expediente Clínico:** Acceso a detalles completos como signos vitales, diagnósticos, historial y administración de camas.
*   **Asignación de Personal:** Vinculación de enfermeros responsables a cada paciente.

### Accesos y Permisos:
*   **Ver Pacientes:** Todos los usuarios autenticados.
*   **Registrar Paciente/Ingreso:** `Jefe de Piso`, `Jefe de Pediatría`, `Coordinador`, `Médico`.
*   **Gestionar Roles (Asignar Enfermero/Editar):** `Jefe de Piso`, `Jefe de Pediatría`, `Coordinador`.
*   **Dar de Baja (Eliminar):** `Jefe de Piso`, `Jefe de Pediatría`, `Coordinador`.

---

## 2. Módulo de Inventario (`src/modules/inventario`)
Gestiona el stock de medicamentos y materiales por piso, controlando el flujo de suministros.

### Funciones Principales:
*   **Control de Stock:** Visualización de existencias y alertas de stock bajo (semáforo).
*   **Movimientos de Entrada (Resurtir):** Agregar stock al inventario.
*   **Movimientos de Salida:** Registro de uso de material/medicamento (administración a paciente, merma).
*   **Devoluciones:** Retorno de ítems previamente retirados o no utilizados.
*   **Catálogo:** Gestión de la lista base de medicamentos y materiales.

### Accesos y Permisos:
*   **Ver Inventario:** Todos los usuarios.
*   **Administrar (Resurtir, Editar/Eliminar ítems):** `Coordinador`, `Jefe de Piso`, `Jefe de Pediatría`.
*   **Registrar Salidas (Dispensing):** `Enfermero`, `Jefe de Piso`, `Jefe de Pediatría`, `Coordinador`, `Médico`.
*   **Registrar Devoluciones:** `Enfermero`, `Coordinador`, `Jefe de Piso`, `Jefe de Pediatría`.

---

## 3. Módulo de Capacitación (`src/modules/capacitacion`)
Plataforma para el desarrollo profesional continuo del personal de enfermería.

### Funciones Principales:
*   **Catálogo de Cursos:** Listado de capacitaciones disponibles con fechas y cupos.
*   **Inscripción:** Auto-inscripción de enfermeros a cursos abiertos.
*   **Evidencias:** Carga de comprobantes o evidencias de finalización de cursos.
*   **Gestión Académica:** Creación y edición de cursos.

### Accesos y Permisos:
*   **Ver/Inscribirse/Subir Evidencia:** Todos los usuarios (Rol `Enfermero` y superiores).
*   **Gestionar Cursos (Crear/Editar):** `Capacitación`, `Coordinador`.

---

## 4. Módulo de Reportes (`src/modules/reportes`)
Sistema de bitácora para incidencias y reportes operativos de turno.

### Funciones Principales:
*   **Gestión de Incidentes:** Registro y seguimiento de eventos adversos (Código Azul, Caídas, etc.) con clasificación de gravedad.
*   **Reporte Diario:** Bitácora de turno que incluye resumen, novedades y pendientes por piso.

### Accesos y Permisos:
*   **Registrar Incidente:** Todos los usuarios pueden reportar un incidente.
*   **Crear Reporte Diario:** `Jefe de Piso`, `Jefe de Pediatría`, `Coordinador`.
*   **Editar/Eliminar Registros:** `Jefe de Piso`, `Jefe de Pediatría`, `Coordinador`.

---

## 5. Módulo de Roles (`src/modules/rol`)
Calendario y programación de turnos para el personal de enfermería.

### Funciones Principales:
*   **Visualización de Roles:** Calendario interactivo con asignaciones por día.
*   **Gestión de Periodos:** Creación de nuevos roles (ej. Roles semanales o mensuales).
*   **Asignación:** Programación de enfermeros a turnos y áreas específicas dentro de un rol.

### Accesos y Permisos:
*   **Ver Roles:** Todos los usuarios.
*   **Gestionar (Crear, Editar, Asignar, Eliminar):** `Jefe de Piso`, `Jefe de Pediatría`, `Coordinador`.

---

## 6. Módulo de Personal (`src/modules/personal`)
Administración de recursos humanos (enfermería).

### Funciones Principales:
*   **Directorio:** Listado del personal con información de contacto y cargo.
*   **Gestión de Cuentas:** Registro de nuevos enfermeros y edición de perfiles (incluyendo credenciales).
*   **Baja de Personal:** Eliminación de cuentas de usuario.

### Accesos y Permisos:
*   **Ver Directorio:** Todos los usuarios.
*   **Administrar (Crear, Editar, Eliminar):** Exclusivo para el cargo **Coordinador General**.

---

### Resumen de Roles Críticos
*   **Coordinador General:** Acceso total a administración de personal, inventarios, roles y pacientes.
*   **Jefe de Piso / Pediatría:** Gestión operativa (pacientes, roles, inventarios diaria, reportes), sin acceso a la administración de cuentas de usuario.
*   **Enfermero:** Acceso operativo (atención a pacientes, uso de inventario, capacitación), lectura de roles y directorio.

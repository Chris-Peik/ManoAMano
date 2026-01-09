-- =====================================================
-- POLÍTICAS RLS PARA SISTEMA DE ENFERMERÍA
-- Ejecutar en Supabase SQL Editor
-- Esto permite acceso completo a todas las tablas
-- =====================================================

-- 1. ENFERMERO
ALTER TABLE "Enfermero" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Enfermero" ON "Enfermero";
CREATE POLICY "Permitir todo Enfermero" ON "Enfermero" FOR ALL USING (true) WITH CHECK (true);

-- 2. CARGO
ALTER TABLE "Cargo" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Cargo" ON "Cargo";
CREATE POLICY "Permitir todo Cargo" ON "Cargo" FOR ALL USING (true) WITH CHECK (true);

-- 3. ÁREA
ALTER TABLE "Área" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Área" ON "Área";
CREATE POLICY "Permitir todo Área" ON "Área" FOR ALL USING (true) WITH CHECK (true);

-- 4. TURNO
ALTER TABLE "Turno" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Turno" ON "Turno";
CREATE POLICY "Permitir todo Turno" ON "Turno" FOR ALL USING (true) WITH CHECK (true);

-- 5. ASIGNACION
ALTER TABLE "Asignacion" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Asignacion" ON "Asignacion";
CREATE POLICY "Permitir todo Asignacion" ON "Asignacion" FOR ALL USING (true) WITH CHECK (true);

-- 6. ROL DE ENFERMERÍA
ALTER TABLE "RolEnfermeria" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo RolEnfermeria" ON "RolEnfermeria";
CREATE POLICY "Permitir todo RolEnfermeria" ON "RolEnfermeria" FOR ALL USING (true) WITH CHECK (true);

-- 7. DETALLE ROL
ALTER TABLE "DetalleRol" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo DetalleRol" ON "DetalleRol";
CREATE POLICY "Permitir todo DetalleRol" ON "DetalleRol" FOR ALL USING (true) WITH CHECK (true);

-- 8. PACIENTE
ALTER TABLE "Paciente" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Paciente" ON "Paciente";
CREATE POLICY "Permitir todo Paciente" ON "Paciente" FOR ALL USING (true) WITH CHECK (true);

-- 9. PISO
ALTER TABLE "Piso" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Piso" ON "Piso";
CREATE POLICY "Permitir todo Piso" ON "Piso" FOR ALL USING (true) WITH CHECK (true);

-- 10. HABITACIÓN
ALTER TABLE "Habitación" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Habitación" ON "Habitación";
CREATE POLICY "Permitir todo Habitación" ON "Habitación" FOR ALL USING (true) WITH CHECK (true);

-- 11. CAMA
ALTER TABLE "Cama" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Cama" ON "Cama";
CREATE POLICY "Permitir todo Cama" ON "Cama" FOR ALL USING (true) WITH CHECK (true);

-- 12. REGISTRO DE ENFERMERÍA
ALTER TABLE "Registro_Enfermeria" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Registro_Enfermeria" ON "Registro_Enfermeria";
CREATE POLICY "Permitir todo Registro_Enfermeria" ON "Registro_Enfermeria" FOR ALL USING (true) WITH CHECK (true);

-- 13. SIGNOS VITALES
ALTER TABLE "Signos_Vitales" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Signos_Vitales" ON "Signos_Vitales";
CREATE POLICY "Permitir todo Signos_Vitales" ON "Signos_Vitales" FOR ALL USING (true) WITH CHECK (true);

-- 14. MEDICAMENTO
ALTER TABLE "Medicamento" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Medicamento" ON "Medicamento";
CREATE POLICY "Permitir todo Medicamento" ON "Medicamento" FOR ALL USING (true) WITH CHECK (true);

-- 15. INVENTARIO PISO
ALTER TABLE "InventarioPiso" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo InventarioPiso" ON "InventarioPiso";
CREATE POLICY "Permitir todo InventarioPiso" ON "InventarioPiso" FOR ALL USING (true) WITH CHECK (true);

-- 16. MOVIMIENTO INVENTARIO
ALTER TABLE "MovimientoInventario" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo MovimientoInventario" ON "MovimientoInventario";
CREATE POLICY "Permitir todo MovimientoInventario" ON "MovimientoInventario" FOR ALL USING (true) WITH CHECK (true);

-- 17. CURSO CAPACITACION
ALTER TABLE "CursoCapacitacion" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo CursoCapacitacion" ON "CursoCapacitacion";
CREATE POLICY "Permitir todo CursoCapacitacion" ON "CursoCapacitacion" FOR ALL USING (true) WITH CHECK (true);

-- 18. INSCRIPCION CURSO
ALTER TABLE "InscripcionCurso" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo InscripcionCurso" ON "InscripcionCurso";
CREATE POLICY "Permitir todo InscripcionCurso" ON "InscripcionCurso" FOR ALL USING (true) WITH CHECK (true);

-- 19. EVIDENCIA CHARLA
ALTER TABLE "EvidenciaCharla" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo EvidenciaCharla" ON "EvidenciaCharla";
CREATE POLICY "Permitir todo EvidenciaCharla" ON "EvidenciaCharla" FOR ALL USING (true) WITH CHECK (true);

-- 20. PARTICIPANTE CHARLA
ALTER TABLE "ParticipanteCharla" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo ParticipanteCharla" ON "ParticipanteCharla";
CREATE POLICY "Permitir todo ParticipanteCharla" ON "ParticipanteCharla" FOR ALL USING (true) WITH CHECK (true);

-- 21. INCIDENTE
ALTER TABLE "Incidente" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Incidente" ON "Incidente";
CREATE POLICY "Permitir todo Incidente" ON "Incidente" FOR ALL USING (true) WITH CHECK (true);

-- 22. REPORTE DIARIO
ALTER TABLE "ReporteDiario" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo ReporteDiario" ON "ReporteDiario";
CREATE POLICY "Permitir todo ReporteDiario" ON "ReporteDiario" FOR ALL USING (true) WITH CHECK (true);

-- 23. ADMINISTRACION MEDICAMENTO
ALTER TABLE "Administracion_Medicamento" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Administracion_Medicamento" ON "Administracion_Medicamento";
CREATE POLICY "Permitir todo Administracion_Medicamento" ON "Administracion_Medicamento" FOR ALL USING (true) WITH CHECK (true);

-- 24. DIAGNOSTICO
ALTER TABLE "Diagnostico" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Diagnostico" ON "Diagnostico";
CREATE POLICY "Permitir todo Diagnostico" ON "Diagnostico" FOR ALL USING (true) WITH CHECK (true);

-- 25. CUIDADOS
ALTER TABLE "Cuidados" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Cuidados" ON "Cuidados";
CREATE POLICY "Permitir todo Cuidados" ON "Cuidados" FOR ALL USING (true) WITH CHECK (true);

-- 26. PADECIMIENTO
ALTER TABLE "Padecimiento" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Padecimiento" ON "Padecimiento";
CREATE POLICY "Permitir todo Padecimiento" ON "Padecimiento" FOR ALL USING (true) WITH CHECK (true);

-- 27. ESPECIALIDAD
ALTER TABLE "Especialidad" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Especialidad" ON "Especialidad";
CREATE POLICY "Permitir todo Especialidad" ON "Especialidad" FOR ALL USING (true) WITH CHECK (true);

-- 28. TRIAJE
ALTER TABLE "Triaje" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Triaje" ON "Triaje";
CREATE POLICY "Permitir todo Triaje" ON "Triaje" FOR ALL USING (true) WITH CHECK (true);

-- 29. INGRESO  
ALTER TABLE "Ingreso" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Ingreso" ON "Ingreso";
CREATE POLICY "Permitir todo Ingreso" ON "Ingreso" FOR ALL USING (true) WITH CHECK (true);

-- 30. ROLES (sistema)
ALTER TABLE "Roles" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo Roles" ON "Roles";
CREATE POLICY "Permitir todo Roles" ON "Roles" FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- LISTO! Todas las tablas ahora permiten acceso completo
-- =====================================================

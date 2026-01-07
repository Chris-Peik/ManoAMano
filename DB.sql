-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Administracion_Medicamento (
  ID integer NOT NULL DEFAULT nextval('"Administracion_Medicamento_ID_seq"'::regclass),
  Medicamento_ID integer NOT NULL,
  Nombre character varying NOT NULL,
  Fecha_hora timestamp without time zone NOT NULL,
  Dosis numeric NOT NULL,
  Via character varying NOT NULL,
  Observaciones character varying,
  CONSTRAINT Administracion_Medicamento_pkey PRIMARY KEY (ID),
  CONSTRAINT fk_Medicamento_ID_Administracion_Medicamento FOREIGN KEY (Medicamento_ID) REFERENCES public.Medicamento(ID)
);
CREATE TABLE public.Asignacion (
  ID integer NOT NULL DEFAULT nextval('"Asignacion_ID_seq"'::regclass),
  ID_Enfermero integer NOT NULL,
  ID_Area integer NOT NULL,
  ID_Turno integer NOT NULL,
  Fecha_modificacion timestamp without time zone NOT NULL,
  Es_fija boolean NOT NULL,
  fechaInicio timestamp without time zone DEFAULT now(),
  CONSTRAINT Asignacion_pkey PRIMARY KEY (ID),
  CONSTRAINT fk_Enfermero_ID_Asignacion FOREIGN KEY (ID_Enfermero) REFERENCES public.Enfermero(ID),
  CONSTRAINT fk_Área_ID_Asignacion FOREIGN KEY (ID_Area) REFERENCES public.Área(ID),
  CONSTRAINT fk_Turno_ID_Asignacion FOREIGN KEY (ID_Turno) REFERENCES public.Turno(ID)
);
CREATE TABLE public.Cama (
  ID integer NOT NULL DEFAULT nextval('"Cama_ID_seq"'::regclass),
  numero integer NOT NULL UNIQUE,
  idHabitacion integer NOT NULL,
  idPaciente integer UNIQUE,
  fechaAsignacionPaciente timestamp without time zone,
  fechaSalidaPaciente timestamp without time zone,
  CONSTRAINT Cama_pkey PRIMARY KEY (ID),
  CONSTRAINT fk_Habitación_ID_Cama FOREIGN KEY (idHabitacion) REFERENCES public.Habitación(ID),
  CONSTRAINT fk_Paciente_ID_Cama FOREIGN KEY (idPaciente) REFERENCES public.Paciente(ID)
);
CREATE TABLE public.Cargo (
  ID integer NOT NULL DEFAULT nextval('"Cargo_ID_seq"'::regclass),
  Nombre_Cargo character varying NOT NULL,
  Descripcion character varying,
  CONSTRAINT Cargo_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.Cuidados (
  ID integer NOT NULL DEFAULT nextval('"Cuidados_ID_seq"'::regclass),
  Descripcion character varying NOT NULL,
  Completado boolean NOT NULL,
  CONSTRAINT Cuidados_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.CursoCapacitacion (
  id integer NOT NULL DEFAULT nextval('"CursoCapacitacion_id_seq"'::regclass),
  nombre character varying NOT NULL,
  descripcion text,
  fechaInicio date NOT NULL,
  fechaFin date,
  cupoMaximo integer,
  instructor character varying,
  estado character varying DEFAULT 'ABIERTO'::character varying,
  CONSTRAINT CursoCapacitacion_pkey PRIMARY KEY (id)
);
CREATE TABLE public.DetalleRol (
  id integer NOT NULL DEFAULT nextval('"DetalleRol_id_seq"'::regclass),
  idRol integer,
  idEnfermero integer,
  idTurno integer,
  idArea integer,
  fecha date NOT NULL,
  CONSTRAINT DetalleRol_pkey PRIMARY KEY (id),
  CONSTRAINT DetalleRol_idRol_fkey FOREIGN KEY (idRol) REFERENCES public.RolEnfermeria(id),
  CONSTRAINT DetalleRol_idEnfermero_fkey FOREIGN KEY (idEnfermero) REFERENCES public.Enfermero(ID),
  CONSTRAINT DetalleRol_idTurno_fkey FOREIGN KEY (idTurno) REFERENCES public.Turno(ID),
  CONSTRAINT DetalleRol_idArea_fkey FOREIGN KEY (idArea) REFERENCES public.Área(ID)
);
CREATE TABLE public.Diagnostico (
  ID integer NOT NULL DEFAULT nextval('"Diagnostico_ID_seq"'::regclass),
  ID_Registro integer NOT NULL,
  ID_Padecimiento integer NOT NULL,
  ID_Cuidados integer NOT NULL,
  CONSTRAINT Diagnostico_pkey PRIMARY KEY (ID),
  CONSTRAINT fk_Registro_Enfermeria_ID_Diagnostico FOREIGN KEY (ID_Registro) REFERENCES public.Registro_Enfermeria(ID),
  CONSTRAINT fk_Padecimiento_ID_Historial FOREIGN KEY (ID_Padecimiento) REFERENCES public.Padecimiento(ID),
  CONSTRAINT fk_Diagnostico_ID_Cuidados_Cuidados FOREIGN KEY (ID_Cuidados) REFERENCES public.Cuidados(ID)
);
CREATE TABLE public.Enfermero (
  ID integer NOT NULL DEFAULT nextval('"Enfermero_ID_seq"'::regclass),
  nombre character varying NOT NULL,
  apellidoMaterno character varying,
  apellidoPaterno character varying NOT NULL,
  idCargo integer NOT NULL,
  licencia bigint NOT NULL UNIQUE,
  idSupervisor integer NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  CONSTRAINT Enfermero_pkey PRIMARY KEY (ID),
  CONSTRAINT fk_Enfermero_ID_Cargo_Cargo FOREIGN KEY (idCargo) REFERENCES public.Cargo(ID),
  CONSTRAINT fk_enfermero_cargo FOREIGN KEY (idCargo) REFERENCES public.Cargo(ID),
  CONSTRAINT fk_enfermero_supervisor FOREIGN KEY (idSupervisor) REFERENCES public.Enfermero(ID)
);
CREATE TABLE public.Especialidad (
  ID integer NOT NULL DEFAULT nextval('"Especialidad_ID_seq"'::regclass),
  Descripción character varying NOT NULL,
  CONSTRAINT Especialidad_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.EvidenciaCharla (
  id integer NOT NULL DEFAULT nextval('"EvidenciaCharla_id_seq"'::regclass),
  titulo character varying NOT NULL,
  descripcion text,
  fecha date NOT NULL,
  urlArchivo character varying,
  idEnfermeroRegistra integer,
  CONSTRAINT EvidenciaCharla_pkey PRIMARY KEY (id),
  CONSTRAINT EvidenciaCharla_idEnfermeroRegistra_fkey FOREIGN KEY (idEnfermeroRegistra) REFERENCES public.Enfermero(ID)
);
CREATE TABLE public.Habitación (
  ID integer NOT NULL DEFAULT nextval('"Habitación_ID_seq"'::regclass),
  Número integer NOT NULL UNIQUE,
  ID_Piso integer NOT NULL,
  Capacidad integer NOT NULL,
  CONSTRAINT Habitación_pkey PRIMARY KEY (ID),
  CONSTRAINT fk_Piso_ID_Habitación FOREIGN KEY (ID_Piso) REFERENCES public.Piso(ID)
);
CREATE TABLE public.Incidente (
  id integer NOT NULL DEFAULT nextval('"Incidente_id_seq"'::regclass),
  idEnfermeroReporta integer,
  idPaciente integer,
  idPiso integer,
  tipo character varying NOT NULL,
  gravedad character varying NOT NULL,
  descripcion text NOT NULL,
  accionesTomadas text,
  fechaHora timestamp without time zone NOT NULL,
  estado character varying DEFAULT 'ABIERTO'::character varying,
  CONSTRAINT Incidente_pkey PRIMARY KEY (id),
  CONSTRAINT Incidente_idEnfermeroReporta_fkey FOREIGN KEY (idEnfermeroReporta) REFERENCES public.Enfermero(ID),
  CONSTRAINT Incidente_idPaciente_fkey FOREIGN KEY (idPaciente) REFERENCES public.Paciente(ID),
  CONSTRAINT Incidente_idPiso_fkey FOREIGN KEY (idPiso) REFERENCES public.Piso(ID)
);
CREATE TABLE public.Ingreso (
  ID integer NOT NULL DEFAULT nextval('"Ingreso_ID_seq"'::regclass),
  ID_Paciente integer NOT NULL,
  ID_Triaje integer NOT NULL,
  Motivo character varying,
  CONSTRAINT Ingreso_pkey PRIMARY KEY (ID),
  CONSTRAINT fk_Paciente_ID_Ingreso FOREIGN KEY (ID_Paciente) REFERENCES public.Paciente(ID),
  CONSTRAINT fk_Triaje_ID_Ingreso FOREIGN KEY (ID_Triaje) REFERENCES public.Triaje(ID)
);
CREATE TABLE public.InscripcionCurso (
  id integer NOT NULL DEFAULT nextval('"InscripcionCurso_id_seq"'::regclass),
  idCurso integer,
  idEnfermero integer,
  fechaInscripcion timestamp without time zone DEFAULT now(),
  completado boolean DEFAULT false,
  CONSTRAINT InscripcionCurso_pkey PRIMARY KEY (id),
  CONSTRAINT InscripcionCurso_idCurso_fkey FOREIGN KEY (idCurso) REFERENCES public.CursoCapacitacion(id),
  CONSTRAINT InscripcionCurso_idEnfermero_fkey FOREIGN KEY (idEnfermero) REFERENCES public.Enfermero(ID)
);
CREATE TABLE public.InventarioPiso (
  id integer NOT NULL DEFAULT nextval('"InventarioPiso_id_seq"'::regclass),
  idPiso integer,
  idMedicamento integer,
  cantidad integer NOT NULL,
  cantidadMinima integer DEFAULT 10,
  fechaActualizacion timestamp without time zone DEFAULT now(),
  CONSTRAINT InventarioPiso_pkey PRIMARY KEY (id),
  CONSTRAINT InventarioPiso_idPiso_fkey FOREIGN KEY (idPiso) REFERENCES public.Piso(ID),
  CONSTRAINT InventarioPiso_idMedicamento_fkey FOREIGN KEY (idMedicamento) REFERENCES public.Medicamento(ID)
);
CREATE TABLE public.Medicamento (
  ID integer NOT NULL DEFAULT nextval('"Medicamento_ID_seq"'::regclass),
  Nombre character varying NOT NULL,
  Formula character varying NOT NULL,
  Presentacion character varying NOT NULL,
  CONSTRAINT Medicamento_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.MovimientoInventario (
  id integer NOT NULL DEFAULT nextval('"MovimientoInventario_id_seq"'::regclass),
  idInventario integer,
  tipo character varying NOT NULL,
  cantidad integer NOT NULL,
  motivo character varying,
  idEnfermero integer,
  fecha timestamp without time zone DEFAULT now(),
  CONSTRAINT MovimientoInventario_pkey PRIMARY KEY (id),
  CONSTRAINT MovimientoInventario_idInventario_fkey FOREIGN KEY (idInventario) REFERENCES public.InventarioPiso(id),
  CONSTRAINT MovimientoInventario_idEnfermero_fkey FOREIGN KEY (idEnfermero) REFERENCES public.Enfermero(ID)
);
CREATE TABLE public.Paciente (
  ID integer NOT NULL DEFAULT nextval('"Paciente_ID_seq"'::regclass),
  Nombre character varying NOT NULL,
  A_Paterno character varying NOT NULL,
  A_Materno character varying,
  F_nacimiento date NOT NULL,
  Sexo character varying NOT NULL,
  Identificación character varying NOT NULL,
  Peso numeric NOT NULL,
  Altura numeric NOT NULL,
  CONSTRAINT Paciente_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.Padecimiento (
  ID integer NOT NULL DEFAULT nextval('"Padecimiento_ID_seq"'::regclass),
  Descripción character varying NOT NULL,
  CONSTRAINT Padecimiento_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.ParticipanteCharla (
  id integer NOT NULL DEFAULT nextval('"ParticipanteCharla_id_seq"'::regclass),
  idEvidencia integer,
  idEnfermero integer,
  CONSTRAINT ParticipanteCharla_pkey PRIMARY KEY (id),
  CONSTRAINT ParticipanteCharla_idEvidencia_fkey FOREIGN KEY (idEvidencia) REFERENCES public.EvidenciaCharla(id),
  CONSTRAINT ParticipanteCharla_idEnfermero_fkey FOREIGN KEY (idEnfermero) REFERENCES public.Enfermero(ID)
);
CREATE TABLE public.Piso (
  ID integer NOT NULL DEFAULT nextval('"Piso_ID_seq"'::regclass),
  Número integer NOT NULL UNIQUE,
  ID_Especialidad integer NOT NULL,
  CONSTRAINT Piso_pkey PRIMARY KEY (ID),
  CONSTRAINT fk_Piso_ID_Especialidad_Especialidad FOREIGN KEY (ID_Especialidad) REFERENCES public.Especialidad(ID)
);
CREATE TABLE public.Registro_Enfermeria (
  ID integer NOT NULL DEFAULT nextval('"Registro_Enfermeria_ID_seq"'::regclass),
  idPaciente integer NOT NULL,
  idAdministracionMed integer,
  idAsignacion integer NOT NULL,
  fecha timestamp without time zone NOT NULL,
  observaciones character varying,
  firmado boolean NOT NULL,
  idSignosVitales integer NOT NULL,
  CONSTRAINT Registro_Enfermeria_pkey PRIMARY KEY (ID),
  CONSTRAINT fk_Registro_Enfermeria_ID_Paciente_Paciente FOREIGN KEY (idPaciente) REFERENCES public.Paciente(ID),
  CONSTRAINT fk_Asignacion_ID_Registro_Enfermeria FOREIGN KEY (idAsignacion) REFERENCES public.Asignacion(ID),
  CONSTRAINT fk_Registro_Enfermeria_ID_Signos_Vitales_Signos_Vitales FOREIGN KEY (idSignosVitales) REFERENCES public.Signos_Vitales(ID),
  CONSTRAINT fk_Registro_Enfermeria_ID_Admisitracion_Med FOREIGN KEY (idAdministracionMed) REFERENCES public.Administracion_Medicamento(ID)
);
CREATE TABLE public.ReporteDiario (
  id integer NOT NULL DEFAULT nextval('"ReporteDiario_id_seq"'::regclass),
  idPiso integer,
  idTurno integer,
  fecha date NOT NULL,
  idEnfermeroResponsable integer,
  resumen text,
  novedades text,
  pendientes text,
  fechaCreacion timestamp without time zone DEFAULT now(),
  CONSTRAINT ReporteDiario_pkey PRIMARY KEY (id),
  CONSTRAINT ReporteDiario_idPiso_fkey FOREIGN KEY (idPiso) REFERENCES public.Piso(ID),
  CONSTRAINT ReporteDiario_idTurno_fkey FOREIGN KEY (idTurno) REFERENCES public.Turno(ID),
  CONSTRAINT ReporteDiario_idEnfermeroResponsable_fkey FOREIGN KEY (idEnfermeroResponsable) REFERENCES public.Enfermero(ID)
);
CREATE TABLE public.RolEnfermeria (
  id integer NOT NULL DEFAULT nextval('"RolEnfermeria_id_seq"'::regclass),
  nombre character varying NOT NULL,
  fechaInicio date NOT NULL,
  fechaFin date NOT NULL,
  creadoPor integer,
  fechaCreacion timestamp without time zone DEFAULT now(),
  CONSTRAINT RolEnfermeria_pkey PRIMARY KEY (id),
  CONSTRAINT RolEnfermeria_creadoPor_fkey FOREIGN KEY (creadoPor) REFERENCES public.Enfermero(ID)
);
CREATE TABLE public.Roles (
  Rol_ID integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  Nombre_Rol text NOT NULL UNIQUE,
  Dashboard_Path text,
  CONSTRAINT Roles_pkey PRIMARY KEY (Rol_ID)
);
CREATE TABLE public.Signos_Vitales (
  ID integer NOT NULL DEFAULT nextval('"Signos_Vitales_ID_seq"'::regclass),
  Glucosa numeric NOT NULL,
  Presion_sist numeric NOT NULL,
  Presion_dias numeric NOT NULL,
  Temperatura numeric NOT NULL,
  Oxigeno numeric NOT NULL,
  Evacuaciones integer NOT NULL,
  Mls_orina numeric NOT NULL,
  Hora_medicion timestamp without time zone NOT NULL,
  Observaciones character varying,
  CONSTRAINT Signos_Vitales_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.Triaje (
  ID integer NOT NULL DEFAULT nextval('"Triaje_ID_seq"'::regclass),
  Nivel integer,
  Descripcion character varying,
  CONSTRAINT Triaje_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.Turno (
  ID integer NOT NULL DEFAULT nextval('"Turno_ID_seq"'::regclass),
  Nombre character varying NOT NULL,
  Hora_inicio time without time zone NOT NULL,
  Hora_fin time without time zone NOT NULL,
  CONSTRAINT Turno_pkey PRIMARY KEY (ID)
);
CREATE TABLE public.Área (
  ID integer NOT NULL DEFAULT nextval('"Área_ID_seq"'::regclass),
  Nombre character varying NOT NULL,
  Descripcion character varying,
  CONSTRAINT Área_pkey PRIMARY KEY (ID)
);
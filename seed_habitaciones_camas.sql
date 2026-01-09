-- Script para generar habitaciones y camas
-- Ejecutar en Supabase SQL Editor
-- Asume que ya existen Pisos con IDs 1, 2, 3, 4, 5

-- Primero crear pisos si no existen (5 pisos con especialidad 1)
INSERT INTO "Piso" ("Número", "ID_Especialidad") VALUES
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1)
ON CONFLICT ("Número") DO NOTHING;

-- Crear Habitaciones: 4 habitaciones por piso
-- Piso 1: Habitaciones 101, 102, 103, 104
-- Piso 2: Habitaciones 201, 202, 203, 204
-- etc.

INSERT INTO "Habitación" ("Número", "ID_Piso", "Capacidad") VALUES
-- Piso 1
(101, 1, 4), (102, 1, 4), (103, 1, 4), (104, 1, 4),
-- Piso 2
(201, 2, 4), (202, 2, 4), (203, 2, 4), (204, 2, 4),
-- Piso 3
(301, 3, 4), (302, 3, 4), (303, 3, 4), (304, 3, 4),
-- Piso 4
(401, 4, 4), (402, 4, 4), (403, 4, 4), (404, 4, 4),
-- Piso 5
(501, 5, 4), (502, 5, 4), (503, 5, 4), (504, 5, 4)
ON CONFLICT ("Número") DO NOTHING;

-- Crear Camas: 4 camas por habitación
-- Numeración: PisoHabitacionCama (ej: Piso 1, Hab 01, Cama 1 = 1011)

INSERT INTO "Cama" ("numero", "idHabitacion") VALUES
-- Habitación 101 (ID esperado: 1)
(1011, 1), (1012, 1), (1013, 1), (1014, 1),
-- Habitación 102 (ID esperado: 2)
(1021, 2), (1022, 2), (1023, 2), (1024, 2),
-- Habitación 103 (ID esperado: 3)
(1031, 3), (1032, 3), (1033, 3), (1034, 3),
-- Habitación 104 (ID esperado: 4)
(1041, 4), (1042, 4), (1043, 4), (1044, 4),
-- Habitación 201 (ID esperado: 5)
(2011, 5), (2012, 5), (2013, 5), (2014, 5),
-- Habitación 202 (ID esperado: 6)
(2021, 6), (2022, 6), (2023, 6), (2024, 6),
-- Habitación 203 (ID esperado: 7)
(2031, 7), (2032, 7), (2033, 7), (2034, 7),
-- Habitación 204 (ID esperado: 8)
(2041, 8), (2042, 8), (2043, 8), (2044, 8),
-- Habitación 301 (ID esperado: 9)
(3011, 9), (3012, 9), (3013, 9), (3014, 9),
-- Habitación 302 (ID esperado: 10)
(3021, 10), (3022, 10), (3023, 10), (3024, 10),
-- Habitación 303 (ID esperado: 11)
(3031, 11), (3032, 11), (3033, 11), (3034, 11),
-- Habitación 304 (ID esperado: 12)
(3041, 12), (3042, 12), (3043, 12), (3044, 12),
-- Habitación 401 (ID esperado: 13)
(4011, 13), (4012, 13), (4013, 13), (4014, 13),
-- Habitación 402 (ID esperado: 14)
(4021, 14), (4022, 14), (4023, 14), (4024, 14),
-- Habitación 403 (ID esperado: 15)
(4031, 15), (4032, 15), (4033, 15), (4034, 15),
-- Habitación 404 (ID esperado: 16)
(4041, 16), (4042, 16), (4043, 16), (4044, 16),
-- Habitación 501 (ID esperado: 17)
(5011, 17), (5012, 17), (5013, 17), (5014, 17),
-- Habitación 502 (ID esperado: 18)
(5021, 18), (5022, 18), (5023, 18), (5024, 18),
-- Habitación 503 (ID esperado: 19)
(5031, 19), (5032, 19), (5033, 19), (5034, 19),
-- Habitación 504 (ID esperado: 20)
(5041, 20), (5042, 20), (5043, 20), (5044, 20)
ON CONFLICT ("numero") DO NOTHING;

-- Resumen:
-- 5 Pisos
-- 20 Habitaciones (4 por piso)
-- 80 Camas (4 por habitación)

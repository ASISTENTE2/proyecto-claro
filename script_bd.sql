-- Script para verificar la estructura y el contenido de la base de datos Gestion_empresa
-- Desarrollado por Darian Yupanqui para Claro Perú S.A.C.

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS Gestion_empresa;

-- Seleccionar la base de datos para operar en ella
USE Gestion_empresa;

-- Seleccionar todos los registros de la tabla 'employees'
SELECT * FROM employees;

-- Seleccionar todos los registros de la tabla 'machines'
SELECT * FROM machines;

-- Seleccionar todos los registros de la tabla 'usage_records' (uso_maquinas)
-- Nota: En tu modelo de datos, 'uso_maquinas' se mapea a 'usage_records'
SELECT * FROM usage_records;

-- Seleccionar todos los registros de la tabla 'users'
SELECT * FROM users;

-- Seleccionar todos los registros de la tabla 'reports'
SELECT * FROM reports;
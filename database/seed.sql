-- ============================================================
-- SCRIPT DE DATOS DE PRUEBA (SEED) - "GalloLeTe"
-- ============================================================
-- ⚠️ ESTE SCRIPT VACIA LA BASE DE DATOS y la llena de datos de prueba.
--    Es solo para una INSTALACION NUEVA. La forma correcta de ejecutarlo es:
--
--        npm run init-db
--
--    NO lo importes desde phpMyAdmin cuando ya hay clientes reales registrados,
--    porque borraria sus membresias, pagos y rutinas.
-- ============================================================

USE gallolete_db;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- PROTECCION: cancela el seed si la base ya tiene clientes reales.
-- Si solo existe el cliente de prueba (id_cliente = 1) deja pasar.
-- El nombre de la tabla "que falta" es el mensaje: no hay que adivinar por que
-- se detuvo. Para forzar el borrado a mano, ejecuta primero npm run init-db.
-- ------------------------------------------------------------
SET @glx_guard = (SELECT IF(COUNT(*) > 0,
  'SELECT 1 FROM glx_seed_bloqueado_datos_reales_use_npm_init_db',
  'SELECT 1') FROM clientes WHERE id_cliente <> 1);
PREPARE glx_stmt FROM @glx_guard;
EXECUTE glx_stmt;
DEALLOCATE PREPARE glx_stmt;

-- ------------------------------------------------------------
-- Limpiar tablas
-- Se usa DELETE y no TRUNCATE: TRUNCATE es DDL, por eso MySQL lo rechaza con
-- el error #1701 sobre `rutinas` (esta referenciada por la clave foranea
-- fk_re_rutina de `rutina_ejercicios`) sin mirar FOREIGN_KEY_CHECKS.
-- DELETE es DML y si respeta el SET FOREIGN_KEY_CHECKS = 0 de arriba.
-- ------------------------------------------------------------
DELETE FROM rutina_ejercicios;
DELETE FROM rutinas;
DELETE FROM pagos;
DELETE FROM membresias;
DELETE FROM usuarios;
DELETE FROM entrenadores;
DELETE FROM clientes;
DELETE FROM ejercicios;

-- DELETE no reinicia el contador, y el seed inserta ids fijos: se vuelve a 1
-- para que la instalacion quede identica sin importar cuantas veces se corra.
ALTER TABLE clientes AUTO_INCREMENT = 1;
ALTER TABLE entrenadores AUTO_INCREMENT = 1;
ALTER TABLE usuarios AUTO_INCREMENT = 1;
ALTER TABLE ejercicios AUTO_INCREMENT = 1;
ALTER TABLE membresias AUTO_INCREMENT = 1;
ALTER TABLE pagos AUTO_INCREMENT = 1;
ALTER TABLE rutinas AUTO_INCREMENT = 1;
ALTER TABLE rutina_ejercicios AUTO_INCREMENT = 1;

-- 1. CLIENTE ÚNICO (JesusP171)
INSERT INTO clientes (id_cliente, documento, nombre, apellido, fecha_nacimiento, genero, telefono, correo, direccion, estado) VALUES
(1, '1098765432', 'Jesus', 'Perez', '2000-01-01', 'Masculino', '3000000000', 'jesusp171@gmail.com', 'Calle Principal # 1-23', 'activo');

-- 2. ENTRENADOR ÚNICO (Carlos Mendoza)
INSERT INTO entrenadores (id_entrenador, nombre, apellido, documento, telefono, correo, especialidad, horario, estado) VALUES
(1, 'Carlos', 'Mendoza', '91234567', '3157778899', 'carlos.mendoza@gallolete.com', 'Musculación y Hipertrofia', 'Mañana (6:00 AM - 2:00 PM)', 'activo');

-- 3. USUARIOS PERMITIDOS (admin, carlos_entrenador, maria_recep, JesusP171)
-- Personal (acceso desde el botón desplegable "Iniciar Sesión ▾"):
--   admin             -> admin2026
--   carlos_entrenador -> entrenador2026
--   maria_recep       -> recepcion2026
-- Cliente: su cuenta se crea desde "Crear cuenta" (el sistema ya no expone contraseñas de prueba).
INSERT INTO usuarios (nombre_usuario, correo, password, rol, id_cliente, id_entrenador, estado) VALUES
('admin', 'admin@gallolete.com', '$2a$10$7uyz2Oz3h9XtFLyLxK0yTeAwM8u14zZH6Pm/93wzKqmrPCJCaqB1u', 'Administrador', NULL, NULL, 'activo'),
('carlos_entrenador', 'carlos@gallolete.com', '$2a$10$MRCE.kxnXS7ieiVONbs7Reww8W83kiNOtj3nY1MKUBiUohdZXxDnW', 'Entrenador', NULL, 1, 'activo'),
('maria_recep', 'maria@gallolete.com', '$2a$10$Hd6vlhCPg93VevxlecVRQOXtqoP3.HsC/q2Jh/lCnuT/mHYORsGwK', 'Recepcionista', NULL, NULL, 'activo'),
('JesusP171', 'jesusp171@gmail.com', '$2a$10$KmplkLLbDnFbRSTmdfUw4uH4fDbAnDK2ACxuojtTqRIoZknUyrK.K', 'Cliente', 1, NULL, 'activo');

-- 4. EJERCICIOS DE PRUEBA
INSERT INTO ejercicios (id_ejercicio, nombre, descripcion, grupo_muscular, nivel) VALUES
(1, 'Press de Banca Plano', 'Ejercicio compuesto para pectoral mayor con barra.', 'Pecho', 'Intermedio'),
(2, 'Sentadilla Libre con Barra', 'Ejercicio fundamental para cuadriceps y glúteos.', 'Pierna', 'Intermedio'),
(3, 'Dominadas', 'Tracción vertical para el dorsal ancho.', 'Espalda', 'Avanzado'),
(4, 'Press Militar con Mancuernas', 'Empuje vertical para hombros.', 'Hombros', 'Principiante'),
(5, 'Curl de Biceps con Barra', 'Aislamiento de bíceps.', 'Brazos', 'Principiante');

-- (Nota: Se eliminaron los pagos iniciales para que Ingresos Totales empiece limpio en $0)

SET FOREIGN_KEY_CHECKS = 1;

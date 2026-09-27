-- ============================================================
-- SCRIPT DE DATOS DE PRUEBA (SEED) - "GalloLeTe"
-- ============================================================

USE gallolete_db;
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar tablas
TRUNCATE TABLE rutina_ejercicios;
TRUNCATE TABLE rutinas;
TRUNCATE TABLE pagos;
TRUNCATE TABLE membresias;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE entrenadores;
TRUNCATE TABLE clientes;

-- 1. CLIENTE ÚNICO (JesusP171)
INSERT INTO clientes (id_cliente, documento, nombre, apellido, fecha_nacimiento, genero, telefono, correo, direccion, estado) VALUES
(1, '1098765432', 'Jesus', 'Perez', '2000-01-01', 'Masculino', '3000000000', 'jesusp171@gmail.com', 'Calle Principal # 1-23', 'activo');

-- 2. ENTRENADOR ÚNICO (Carlos Mendoza)
INSERT INTO entrenadores (id_entrenador, nombre, apellido, documento, telefono, correo, especialidad, horario, estado) VALUES
(1, 'Carlos', 'Mendoza', '91234567', '3157778899', 'carlos.mendoza@gallolete.com', 'Musculación y Hipertrofia', 'Mañana (6:00 AM - 2:00 PM)', 'activo');

-- 3. USUARIOS PERMITIDOS (admin, carlos_entrenador, maria_recep, JesusP171)
-- La contraseña en texto plano para todos es: admin123
INSERT INTO usuarios (nombre_usuario, correo, password, rol, id_cliente, id_entrenador, estado) VALUES
('admin', 'admin@gallolete.com', '$2a$10$z7.1w0YJ5uXJqVj.18x4h.rFz2x3a/C5c0j1k2l3m4n5o6p7q8r9s', 'Administrador', NULL, NULL, 'activo'),
('carlos_entrenador', 'carlos@gallolete.com', '$2a$10$z7.1w0YJ5uXJqVj.18x4h.rFz2x3a/C5c0j1k2l3m4n5o6p7q8r9s', 'Entrenador', NULL, 1, 'activo'),
('maria_recep', 'maria@gallolete.com', '$2a$10$z7.1w0YJ5uXJqVj.18x4h.rFz2x3a/C5c0j1k2l3m4n5o6p7q8r9s', 'Recepcionista', NULL, NULL, 'activo'),
('JesusP171', 'jesusp171@gmail.com', '$2a$10$z7.1w0YJ5uXJqVj.18x4h.rFz2x3a/C5c0j1k2l3m4n5o6p7q8r9s', 'Cliente', 1, NULL, 'activo');

-- 4. EJERCICIOS DE PRUEBA
INSERT INTO ejercicios (id_ejercicio, nombre, descripcion, grupo_muscular, nivel) VALUES
(1, 'Press de Banca Plano', 'Ejercicio compuesto para pectoral mayor con barra.', 'Pecho', 'Intermedio'),
(2, 'Sentadilla Libre con Barra', 'Ejercicio fundamental para cuadriceps y glúteos.', 'Pierna', 'Intermedio'),
(3, 'Dominadas', 'Tracción vertical para el dorsal ancho.', 'Espalda', 'Avanzado'),
(4, 'Press Militar con Mancuernas', 'Empuje vertical para hombros.', 'Hombros', 'Principiante'),
(5, 'Curl de Biceps con Barra', 'Aislamiento de bíceps.', 'Brazos', 'Principiante');

-- (Nota: Se eliminaron los pagos iniciales para que Ingresos Totales empiece limpio en $0)

SET FOREIGN_KEY_CHECKS = 1;

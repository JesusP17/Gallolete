-- ============================================================
-- SCRIPT DE DATOS DE PRUEBA (SEED) - "GalloLeTe"
-- ============================================================

USE gallolete_db;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. CLIENTES DE PRUEBA
INSERT INTO clientes (id_cliente, documento, nombre, apellido, fecha_nacimiento, genero, telefono, correo, direccion, estado) VALUES
(1, '1012345678', 'Juan', 'Pérez', '1995-05-15', 'Masculino', '3001234567', 'juan.perez@gmail.com', 'Calle 10 # 15-20', 'activo'),
(2, '1023456789', 'Laura', 'Gómez', '1998-08-22', 'Femenino', '3119876543', 'laura.gomez@hotmail.com', 'Carrera 45 # 12-30', 'activo'),
(3, '1034567890', 'Pedro', 'Rodríguez', '1990-12-01', 'Masculino', '3205551234', 'pedro.rod@gmail.com', 'Avenida 6 # 8-40', 'activo')
ON DUPLICATE KEY UPDATE id_cliente=id_cliente;

-- 2. ENTRENADORES DE PRUEBA (Deben crearse antes que los usuarios de entrenadores)
INSERT INTO entrenadores (id_entrenador, nombre, apellido, documento, telefono, correo, especialidad, horario, estado) VALUES
(1, 'Carlos', 'Mendoza', '91234567', '3157778899', 'carlos.mendoza@gallolete.com', 'Musculación y Hipertrofia', 'Mañana (6:00 AM - 2:00 PM)', 'activo'),
(2, 'Sofia', 'Martínez', '92345678', '3164445566', 'sofia.martinez@gallolete.com', 'Crossfit y Cardio', 'Tarde (2:00 PM - 10:00 PM)', 'activo')
ON DUPLICATE KEY UPDATE id_entrenador=id_entrenador;

-- 3. USUARIOS DE PRUEBA (Para los 4 Roles: Administrador, Entrenador, Recepcionista, Cliente)
-- La contraseña en texto plano para todos es: admin123
INSERT INTO usuarios (nombre_usuario, correo, password, rol, id_cliente, id_entrenador, estado) VALUES
('admin', 'admin@gallolete.com', '$2a$10$z7.1w0YJ5uXJqVj.18x4h.rFz2x3a/C5c0j1k2l3m4n5o6p7q8r9s', 'Administrador', NULL, NULL, 'activo'),
('carlos_entrenador', 'carlos@gallolete.com', '$2a$10$z7.1w0YJ5uXJqVj.18x4h.rFz2x3a/C5c0j1k2l3m4n5o6p7q8r9s', 'Entrenador', NULL, 1, 'activo'),
('maria_recep', 'maria@gallolete.com', '$2a$10$z7.1w0YJ5uXJqVj.18x4h.rFz2x3a/C5c0j1k2l3m4n5o6p7q8r9s', 'Recepcionista', NULL, NULL, 'activo'),
('juan_cliente', 'juan.perez@gmail.com', '$2a$10$z7.1w0YJ5uXJqVj.18x4h.rFz2x3a/C5c0j1k2l3m4n5o6p7q8r9s', 'Cliente', 1, NULL, 'activo')
ON DUPLICATE KEY UPDATE id_usuario=id_usuario;

-- 4. MEMBRESIAS DE PRUEBA
INSERT INTO membresias (id_membresia, id_cliente, tipo, fecha_inicio, fecha_fin, precio, estado, metodo_pago) VALUES
(1, 1, 'Mensual VIP', '2026-09-01', '2026-10-01', 120000.00, 'activa', 'Tarjeta'),
(2, 2, 'Trimestral', '2026-06-01', '2026-09-01', 300000.00, 'vencida', 'Efectivo'),
(3, 3, 'Anual', '2026-01-01', '2026-12-31', 950000.00, 'activa', 'Transferencia')
ON DUPLICATE KEY UPDATE id_membresia=id_membresia;

-- 5. EJERCICIOS DE PRUEBA
INSERT INTO ejercicios (id_ejercicio, nombre, descripcion, grupo_muscular, nivel) VALUES
(1, 'Press de Banca Plano', 'Ejercicio compuesto para pectoral mayor con barra.', 'Pecho', 'Intermedio'),
(2, 'Sentadilla Libre con Barra', 'Ejercicio fundamental para cuadriceps y glúteos.', 'Pierna', 'Intermedio'),
(3, 'Dominadas', 'Tracción vertical para el dorsal ancho.', 'Espalda', 'Avanzado'),
(4, 'Press Militar con Mancuernas', 'Empuje vertical para hombros.', 'Hombros', 'Principiante'),
(5, 'Curl de Biceps con Barra', 'Aislamiento de bíceps.', 'Brazos', 'Principiante')
ON DUPLICATE KEY UPDATE id_ejercicio=id_ejercicio;

-- 6. RUTINAS DE PRUEBA
INSERT INTO rutinas (id_rutina, id_cliente, id_entrenador, nombre_rutina, objetivo, nivel, fecha_inicio, fecha_fin, observaciones, estado) VALUES
(1, 1, 1, 'Rutina de Volumen Pecho-Espalda', 'Aumento de masa muscular hipertrofia', 'Intermedio', '2026-09-05', '2026-10-05', 'Mantener buena técnica en press', 'activa')
ON DUPLICATE KEY UPDATE id_rutina=id_rutina;

-- 7. DETALLE DE EJERCICIOS EN RUTINA
INSERT INTO rutina_ejercicios (id_rutina_ejercicio, id_rutina, id_ejercicio, series, repeticiones, peso, descanso, observaciones) VALUES
(1, 1, 1, 4, 10, 60.00, '90 segundos', 'Subir peso progresivamente'),
(2, 1, 3, 4, 8, 0.00, '60 segundos', 'Usar peso corporal')
ON DUPLICATE KEY UPDATE id_rutina_ejercicio=id_rutina_ejercicio;

-- 8. PAGOS DE PRUEBA
INSERT INTO pagos (id_pago, id_cliente, id_membresia, fecha_pago, valor, metodo_pago, estado, referencia) VALUES
(1, 1, 1, '2026-09-01 08:30:00', 120000.00, 'Tarjeta', 'completado', 'REF-987654'),
(2, 2, 2, '2026-06-01 10:15:00', 300000.00, 'Efectivo', 'completado', 'REF-123456')
ON DUPLICATE KEY UPDATE id_pago=id_pago;

SET FOREIGN_KEY_CHECKS = 1;

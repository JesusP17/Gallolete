-- ============================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS Y TABLAS - "GalloLeTe"
-- Sistema de Gestión para Gimnasio (Con 4 Roles y Vistas Personalizadas)
-- ============================================================

-- Eliminar la base de datos si ya existe para asegurar que se apliquen todos los cambios de columnas y roles
DROP DATABASE IF EXISTS gallolete_db;

CREATE DATABASE gallolete_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gallolete_db;

-- 1. TABLA CLIENTES
CREATE TABLE clientes (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  documento VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  fecha_nacimiento DATE NULL,
  genero VARCHAR(20) NULL,
  telefono VARCHAR(20) NULL,
  correo VARCHAR(100) NULL,
  direccion TEXT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo'
);

-- 2. TABLA MEMBRESIAS
CREATE TABLE membresias (
  id_membresia INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NULL,
  tipo VARCHAR(50) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  estado ENUM('activa', 'vencida', 'cancelada') DEFAULT 'activa',
  metodo_pago VARCHAR(50) DEFAULT 'Pendiente',
  imagen LONGTEXT NULL,
  CONSTRAINT fk_membresias_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE
);

-- 3. TABLA ENTRENADORES
CREATE TABLE entrenadores (
  id_entrenador INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  documento VARCHAR(20) NOT NULL UNIQUE,
  telefono VARCHAR(20) NULL,
  correo VARCHAR(100) NULL,
  especialidad VARCHAR(100) NULL,
  horario VARCHAR(100) NULL,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo'
);

-- 4. TABLA RUTINAS
CREATE TABLE rutinas (
  id_rutina INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  id_entrenador INT NOT NULL,
  nombre_rutina VARCHAR(100) NOT NULL,
  objetivo TEXT NULL,
  nivel VARCHAR(30) DEFAULT 'Principiante',
  fecha_inicio DATE NULL,
  fecha_fin DATE NULL,
  observaciones TEXT NULL,
  estado ENUM('activa', 'inactiva', 'completada') DEFAULT 'activa',
  CONSTRAINT fk_rutinas_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
  CONSTRAINT fk_rutinas_entrenador FOREIGN KEY (id_entrenador) REFERENCES entrenadores(id_entrenador) ON DELETE CASCADE
);

-- 5. TABLA EJERCICIOS
CREATE TABLE ejercicios (
  id_ejercicio INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  grupo_muscular VARCHAR(50) NOT NULL,
  nivel VARCHAR(30) DEFAULT 'General'
);

-- 6. TABLA RUTINA_EJERCICIOS
CREATE TABLE rutina_ejercicios (
  id_rutina_ejercicio INT AUTO_INCREMENT PRIMARY KEY,
  id_rutina INT NOT NULL,
  id_ejercicio INT NOT NULL,
  series INT NOT NULL DEFAULT 3,
  repeticiones INT NOT NULL DEFAULT 12,
  peso DECIMAL(8, 2) DEFAULT 0.00,
  descanso VARCHAR(30) DEFAULT '60 segundos',
  observaciones TEXT NULL,
  CONSTRAINT fk_re_rutina FOREIGN KEY (id_rutina) REFERENCES rutinas(id_rutina) ON DELETE CASCADE,
  CONSTRAINT fk_re_ejercicio FOREIGN KEY (id_ejercicio) REFERENCES ejercicios(id_ejercicio) ON DELETE CASCADE
);

-- 7. TABLA PAGOS
CREATE TABLE pagos (
  id_pago INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  id_membresia INT NULL,
  fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
  valor DECIMAL(10, 2) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
  estado ENUM('completado', 'pendiente', 'rechazado') DEFAULT 'completado',
  referencia VARCHAR(100) NULL,
  CONSTRAINT fk_pagos_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
  CONSTRAINT fk_pagos_membresia FOREIGN KEY (id_membresia) REFERENCES membresias(id_membresia) ON DELETE SET NULL
);

-- 8. TABLA USUARIOS (Soporta los 4 Roles: Administrador, Entrenador, Recepcionista, Cliente)
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NULL,
  id_entrenador INT NULL,
  nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('Administrador', 'Entrenador', 'Recepcionista', 'Cliente') NOT NULL DEFAULT 'Recepcionista',
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  CONSTRAINT fk_usuarios_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE SET NULL,
  CONSTRAINT fk_usuarios_entrenador FOREIGN KEY (id_entrenador) REFERENCES entrenadores(id_entrenador) ON DELETE SET NULL
);

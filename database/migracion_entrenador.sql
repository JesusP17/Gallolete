-- ============================================================
-- Migracion: modulo del entrenador (F1 a F6)
-- Gallolete - 2026
-- ============================================================

-- 1) Vinculo directo entrenador <-> cliente.
--    Antes el vinculo solo existia a traves de rutinas, asi que un
--    cliente recien asignado sin rutina era invisible para su entrenador.
--    Se puede dejar NULL (clientes aun sin entrenador asignado).
ALTER TABLE clientes
  ADD COLUMN id_entrenador INT NULL,
  ADD CONSTRAINT fk_clientes_entrenador
    FOREIGN KEY (id_entrenador) REFERENCES entrenadores(id_entrenador)
    ON DELETE SET NULL;

CREATE INDEX idx_clientes_entrenador ON clientes (id_entrenador);

-- 2) F5 - Asistencias.
--    id_rutina queda NULL si la rutina se borra: el historial de
--    asistencia no debe desaparecer con la rutina.
CREATE TABLE asistencias (
  id_asistencia   INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente      INT NOT NULL,
  id_entrenador   INT NOT NULL,
  id_rutina       INT NULL,
  fecha           DATE NOT NULL,
  hora_entrada    TIME NULL,
  hora_salida     TIME NULL,
  observaciones   VARCHAR(255) NULL,
  FOREIGN KEY (id_cliente)    REFERENCES clientes(id_cliente)      ON DELETE CASCADE,
  FOREIGN KEY (id_entrenador) REFERENCES entrenadores(id_entrenador) ON DELETE CASCADE,
  FOREIGN KEY (id_rutina)     REFERENCES rutinas(id_rutina)         ON DELETE SET NULL
);

CREATE INDEX idx_asistencias_cliente    ON asistencias (id_cliente, fecha);
CREATE INDEX idx_asistencias_entrenador ON asistencias (id_entrenador, fecha);

-- 3) F6 - Registro de progreso.
--    Misma idea: el historial de medidas sobrevive a la rutina.
CREATE TABLE registros_progreso (
  id_registro         INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente          INT NOT NULL,
  id_entrenador       INT NOT NULL,
  id_rutina           INT NULL,
  fecha               DATE NOT NULL,
  peso                DECIMAL(5,2) NULL,
  pecho               DECIMAL(5,2) NULL,
  cintura             DECIMAL(5,2) NULL,
  cadera              DECIMAL(5,2) NULL,
  brazo               DECIMAL(5,2) NULL,
  pierna              DECIMAL(5,2) NULL,
  grasa_porcentaje    DECIMAL(5,2) NULL,
  comentarios         VARCHAR(255) NULL,
  FOREIGN KEY (id_cliente)    REFERENCES clientes(id_cliente)        ON DELETE CASCADE,
  FOREIGN KEY (id_entrenador) REFERENCES entrenadores(id_entrenador) ON DELETE CASCADE,
  FOREIGN KEY (id_rutina)     REFERENCES rutinas(id_rutina)           ON DELETE SET NULL
);

CREATE INDEX idx_progresos_cliente ON registros_progreso (id_cliente, fecha);

const db = require('../config/database');

class RutinaModel {
  static async obtenerTodas(idCliente = null) {
    const query = `
      SELECT r.*, 
             CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.documento AS cliente_documento,
             CONCAT(e.nombre, ' ', e.apellido) AS entrenador_nombre,
             e.especialidad AS entrenador_especialidad, e.horario AS entrenador_horario, e.correo AS entrenador_correo
      FROM rutinas r
      JOIN clientes c ON r.id_cliente = c.id_cliente
      JOIN entrenadores e ON r.id_entrenador = e.id_entrenador
      ${idCliente ? 'WHERE r.id_cliente = ?' : ''}
      ORDER BY r.id_rutina DESC
    `;
    const [filas] = await db.query(query, idCliente ? [idCliente] : []);
    return filas;
  }

  static async obtenerPorId(id) {
    const query = `
      SELECT r.*, 
             CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.documento AS cliente_documento,
             CONCAT(e.nombre, ' ', e.apellido) AS entrenador_nombre,
             e.especialidad AS entrenador_especialidad, e.horario AS entrenador_horario, e.correo AS entrenador_correo
      FROM rutinas r
      JOIN clientes c ON r.id_cliente = c.id_cliente
      JOIN entrenadores e ON r.id_entrenador = e.id_entrenador
      WHERE r.id_rutina = ?
    `;
    const [filas] = await db.query(query, [id]);
    if (!filas[0]) return null;

    const rutina = filas[0];
    rutina.ejercicios = await this.obtenerEjerciciosDeRutina(id);
    return rutina;
  }

  static async obtenerEjerciciosDeRutina(idRutina) {
    const query = `
      SELECT re.*, ej.nombre AS ejercicio_nombre, ej.grupo_muscular, ej.nivel AS ejercicio_nivel
      FROM rutina_ejercicios re
      JOIN ejercicios ej ON re.id_ejercicio = ej.id_ejercicio
      WHERE re.id_rutina = ?
      ORDER BY re.id_rutina_ejercicio ASC
    `;
    const [filas] = await db.query(query, [idRutina]);
    return filas;
  }

  static async crear(datos) {
    const { id_cliente, id_entrenador, nombre_rutina, objetivo, nivel, fecha_inicio, fecha_fin, observaciones, estado } = datos;
    const [resultado] = await db.query(
      `INSERT INTO rutinas (id_cliente, id_entrenador, nombre_rutina, objetivo, nivel, fecha_inicio, fecha_fin, observaciones, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_cliente, id_entrenador, nombre_rutina, objetivo || null, nivel || 'Principiante', fecha_inicio || null, fecha_fin || null, observaciones || null, estado || 'activa']
    );
    return this.obtenerPorId(resultado.insertId);
  }

  static async actualizar(id, datos) {
    const { id_cliente, id_entrenador, nombre_rutina, objetivo, nivel, fecha_inicio, fecha_fin, observaciones, estado } = datos;
    await db.query(
      `UPDATE rutinas
       SET id_cliente = ?, id_entrenador = ?, nombre_rutina = ?, objetivo = ?, nivel = ?, fecha_inicio = ?, fecha_fin = ?, observaciones = ?, estado = ?
       WHERE id_rutina = ?`,
      [id_cliente, id_entrenador, nombre_rutina, objetivo || null, nivel || 'Principiante', fecha_inicio || null, fecha_fin || null, observaciones || null, estado || 'activa', id]
    );
    return this.obtenerPorId(id);
  }

  static async eliminar(id) {
    const [resultado] = await db.query('DELETE FROM rutinas WHERE id_rutina = ?', [id]);
    return resultado.affectedRows > 0;
  }

  static async agregarEjercicio(datos) {
    const { id_rutina, id_ejercicio, series, repeticiones, peso, descanso, observaciones } = datos;
    const [resultado] = await db.query(
      `INSERT INTO rutina_ejercicios (id_rutina, id_ejercicio, series, repeticiones, peso, descanso, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_rutina, id_ejercicio, series || 3, repeticiones || 12, peso || 0, descanso || '60 segundos', observaciones || null]
    );
    return { id_rutina_ejercicio: resultado.insertId, ...datos };
  }

  static async eliminarEjercicio(idRutinaEjercicio) {
    const [resultado] = await db.query('DELETE FROM rutina_ejercicios WHERE id_rutina_ejercicio = ?', [idRutinaEjercicio]);
    return resultado.affectedRows > 0;
  }
}

module.exports = RutinaModel;

const db = require('../config/database');

class EntrenadorModel {
  static async obtenerTodos() {
    const [filas] = await db.query('SELECT * FROM entrenadores ORDER BY id_entrenador DESC');
    return filas;
  }

  static async obtenerPorId(id) {
    const [filas] = await db.query('SELECT * FROM entrenadores WHERE id_entrenador = ?', [id]);
    return filas[0] || null;
  }

  static async crear(datos) {
    const { nombre, apellido, documento, telefono, correo, especialidad, horario, estado } = datos;
    const [resultado] = await db.query(
      `INSERT INTO entrenadores (nombre, apellido, documento, telefono, correo, especialidad, horario, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, documento, telefono || null, correo || null, especialidad || null, horario || null, estado || 'activo']
    );
    return { id_entrenador: resultado.insertId, ...datos };
  }

  static async actualizar(id, datos) {
    const { nombre, apellido, documento, telefono, correo, especialidad, horario, estado } = datos;
    await db.query(
      `UPDATE entrenadores
       SET nombre = ?, apellido = ?, documento = ?, telefono = ?, correo = ?, especialidad = ?, horario = ?, estado = ?
       WHERE id_entrenador = ?`,
      [nombre, apellido, documento, telefono || null, correo || null, especialidad || null, horario || null, estado || 'activo', id]
    );
    return this.obtenerPorId(id);
  }

  static async eliminar(id) {
    const [resultado] = await db.query('DELETE FROM entrenadores WHERE id_entrenador = ?', [id]);
    return resultado.affectedRows > 0;
  }
}

module.exports = EntrenadorModel;

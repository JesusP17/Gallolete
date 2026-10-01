const db = require('../config/database');

class EjercicioModel {
  static async obtenerTodos() {
    const [filas] = await db.query('SELECT * FROM ejercicios ORDER BY id_ejercicio DESC');
    return filas;
  }

  static async obtenerPorId(id) {
    const [filas] = await db.query('SELECT * FROM ejercicios WHERE id_ejercicio = ?', [id]);
    return filas[0] || null;
  }

  static async crear(datos) {
    const { nombre, descripcion, grupo_muscular, nivel } = datos;
    const [resultado] = await db.query(
      `INSERT INTO ejercicios (nombre, descripcion, grupo_muscular, nivel)
       VALUES (?, ?, ?, ?)`,
      [nombre, descripcion || null, grupo_muscular, nivel || 'General']
    );
    return { id_ejercicio: resultado.insertId, ...datos };
  }

  static async actualizar(id, datos) {
    const { nombre, descripcion, grupo_muscular, nivel } = datos;
    await db.query(
      `UPDATE ejercicios
       SET nombre = ?, descripcion = ?, grupo_muscular = ?, nivel = ?
       WHERE id_ejercicio = ?`,
      [nombre, descripcion || null, grupo_muscular, nivel || 'General', id]
    );
    return this.obtenerPorId(id);
  }

  static async eliminar(id) {
    const [resultado] = await db.query('DELETE FROM ejercicios WHERE id_ejercicio = ?', [id]);
    return resultado.affectedRows > 0;
  }
}

module.exports = EjercicioModel;

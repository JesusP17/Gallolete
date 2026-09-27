const db = require('../config/database');

class ClienteModel {
  static async obtenerTodos() {
    const [filas] = await db.query('SELECT * FROM clientes ORDER BY id_cliente DESC');
    return filas;
  }

  static async obtenerPorId(id) {
    const [filas] = await db.query('SELECT * FROM clientes WHERE id_cliente = ?', [id]);
    return filas[0] || null;
  }

  static async obtenerPorDocumento(documento) {
    const [filas] = await db.query('SELECT * FROM clientes WHERE documento = ?', [documento]);
    return filas[0] || null;
  }

  static async crear(datos) {
    const { documento, nombre, apellido, fecha_nacimiento, genero, telefono, correo, direccion, estado } = datos;
    const [resultado] = await db.query(
      `INSERT INTO clientes (documento, nombre, apellido, fecha_nacimiento, genero, telefono, correo, direccion, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [documento, nombre, apellido, fecha_nacimiento || null, genero || null, telefono || null, correo || null, direccion || null, estado || 'activo']
    );
    return { id_cliente: resultado.insertId, ...datos };
  }

  static async actualizar(id, datos) {
    const { documento, nombre, apellido, fecha_nacimiento, genero, telefono, correo, direccion, estado } = datos;
    await db.query(
      `UPDATE clientes 
       SET documento = ?, nombre = ?, apellido = ?, fecha_nacimiento = ?, genero = ?, telefono = ?, correo = ?, direccion = ?, estado = ?
       WHERE id_cliente = ?`,
      [documento, nombre, apellido, fecha_nacimiento || null, genero || null, telefono || null, correo || null, direccion || null, estado || 'activo', id]
    );

    if (estado) {
      await db.query('UPDATE usuarios SET estado = ? WHERE id_cliente = ?', [estado, id]);
    }

    return this.obtenerPorId(id);
  }

  static async eliminar(id) {
    const [resultado] = await db.query('DELETE FROM clientes WHERE id_cliente = ?', [id]);
    return resultado.affectedRows > 0;
  }
}

module.exports = ClienteModel;

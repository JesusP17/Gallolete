const db = require('../config/database');

class MembresiaModel {
  static async obtenerTodas() {
    const query = `
      SELECT m.*, CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.documento AS cliente_documento
      FROM membresias m
      JOIN clientes c ON m.id_cliente = c.id_cliente
      ORDER BY m.id_membresia DESC
    `;
    const [filas] = await db.query(query);
    return filas;
  }

  static async obtenerPorId(id) {
    const query = `
      SELECT m.*, CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.documento AS cliente_documento
      FROM membresias m
      JOIN clientes c ON m.id_cliente = c.id_cliente
      WHERE m.id_membresia = ?
    `;
    const [filas] = await db.query(query, [id]);
    return filas[0] || null;
  }

  static async obtenerPorCliente(idCliente) {
    const [filas] = await db.query('SELECT * FROM membresias WHERE id_cliente = ? ORDER BY id_membresia DESC', [idCliente]);
    return filas;
  }

  static async crear(datos) {
    const { id_cliente, tipo, fecha_inicio, fecha_fin, precio, estado, metodo_pago } = datos;
    const [resultado] = await db.query(
      `INSERT INTO membresias (id_cliente, tipo, fecha_inicio, fecha_fin, precio, estado, metodo_pago)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_cliente, tipo, fecha_inicio, fecha_fin, precio, estado || 'activa', metodo_pago || 'Efectivo']
    );
    return this.obtenerPorId(resultado.insertId);
  }

  static async actualizar(id, datos) {
    const { id_cliente, tipo, fecha_inicio, fecha_fin, precio, estado, metodo_pago } = datos;
    await db.query(
      `UPDATE membresias
       SET id_cliente = ?, tipo = ?, fecha_inicio = ?, fecha_fin = ?, precio = ?, estado = ?, metodo_pago = ?
       WHERE id_membresia = ?`,
      [id_cliente, tipo, fecha_inicio, fecha_fin, precio, estado, metodo_pago, id]
    );
    return this.obtenerPorId(id);
  }

  static async eliminar(id) {
    const [resultado] = await db.query('DELETE FROM membresias WHERE id_membresia = ?', [id]);
    return resultado.affectedRows > 0;
  }

  // Actualización automática del estado de membresías según la fecha actual
  static async actualizarEstados() {
    const hoy = new Date().toISOString().split('T')[0];
    await db.query(
      `UPDATE membresias SET estado = 'vencida' WHERE fecha_fin < ? AND estado = 'activa'`,
      [hoy]
    );
  }
}

module.exports = MembresiaModel;

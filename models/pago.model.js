const db = require('../config/database');

class PagoModel {
  static async obtenerTodos() {
    const query = `
      SELECT p.*, 
             CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.documento AS cliente_documento,
             m.tipo AS membresia_tipo
      FROM pagos p
      JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN membresias m ON p.id_membresia = m.id_membresia
      ORDER BY p.id_pago DESC
    `;
    const [filas] = await db.query(query);
    return filas;
  }

  static async obtenerPorId(id) {
    const query = `
      SELECT p.*, 
             CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.documento AS cliente_documento,
             m.tipo AS membresia_tipo
      FROM pagos p
      JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN membresias m ON p.id_membresia = m.id_membresia
      WHERE p.id_pago = ?
    `;
    const [filas] = await db.query(query, [id]);
    return filas[0] || null;
  }

  static async crear(datos) {
    const { id_cliente, id_membresia, fecha_pago, valor, metodo_pago, estado, referencia } = datos;
    const [resultado] = await db.query(
      `INSERT INTO pagos (id_cliente, id_membresia, fecha_pago, valor, metodo_pago, estado, referencia)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_cliente, id_membresia || null, fecha_pago || new Date(), valor, metodo_pago || 'Efectivo', estado || 'completado', referencia || `REF-${Date.now()}`]
    );
    return this.obtenerPorId(resultado.insertId);
  }

  static async actualizar(id, datos) {
    const { id_cliente, id_membresia, fecha_pago, valor, metodo_pago, estado, referencia } = datos;
    await db.query(
      `UPDATE pagos
       SET id_cliente = ?, id_membresia = ?, fecha_pago = ?, valor = ?, metodo_pago = ?, estado = ?, referencia = ?
       WHERE id_pago = ?`,
      [id_cliente, id_membresia || null, fecha_pago, valor, metodo_pago, estado, referencia, id]
    );
    return this.obtenerPorId(id);
  }

  static async eliminar(id) {
    const [resultado] = await db.query('DELETE FROM pagos WHERE id_pago = ?', [id]);
    return resultado.affectedRows > 0;
  }
}

module.exports = PagoModel;

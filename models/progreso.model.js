const db = require('../config/database');

const CAMPOS = `
  p.*,
  CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.documento AS cliente_documento,
  CONCAT(e.nombre, ' ', e.apellido) AS entrenador_nombre,
  r.nombre_rutina
`;

const JOINS = `
  FROM registros_progreso p
  JOIN clientes c ON p.id_cliente = c.id_cliente
  JOIN entrenadores e ON p.id_entrenador = e.id_entrenador
  LEFT JOIN rutinas r ON p.id_rutina = r.id_rutina
`;

class ProgresoModel {
  static async obtenerTodos(filtros = {}) {
    const where = [];
    const params = [];

    if (filtros.id_cliente) { where.push('p.id_cliente = ?'); params.push(filtros.id_cliente); }
    if (filtros.id_entrenador) { where.push('p.id_entrenador = ?'); params.push(filtros.id_entrenador); }
    if (filtros.id_rutina) { where.push('p.id_rutina = ?'); params.push(filtros.id_rutina); }
    if (filtros.fecha) { where.push('p.fecha = ?'); params.push(filtros.fecha); }
    if (filtros.desde) { where.push('p.fecha >= ?'); params.push(filtros.desde); }
    if (filtros.hasta) { where.push('p.fecha <= ?'); params.push(filtros.hasta); }

    const sql = `SELECT ${CAMPOS} ${JOINS}
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY p.fecha DESC, p.id_registro DESC`;

    const [filas] = await db.query(sql, params);
    return filas;
  }

  static async obtenerPorId(id) {
    const [filas] = await db.query(`SELECT ${CAMPOS} ${JOINS} WHERE p.id_registro = ?`, [id]);
    return filas[0] || null;
  }

  // Cambio de cada medida entre el registro mas reciente y el anterior,
  // para ver si el cliente sube o baja sin tener que compararlos a mano.
  static async obtenerEvolucion(idCliente, limite = 10) {
    const [filas] = await db.query(
      'SELECT * FROM registros_progreso WHERE id_cliente = ? ORDER BY fecha DESC, id_registro DESC LIMIT ?',
      [idCliente, limite]
    );
    return filas;
  }

  static async crear(datos) {
    const { id_cliente, id_entrenador, id_rutina, fecha, peso, pecho, cintura, cadera, brazo, pierna, grasa_porcentaje, comentarios } = datos;
    const [resultado] = await db.query(
      `INSERT INTO registros_progreso
        (id_cliente, id_entrenador, id_rutina, fecha, peso, pecho, cintura, cadera, brazo, pierna, grasa_porcentaje, comentarios)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_cliente, id_entrenador, id_rutina || null, fecha,
        peso ?? null, pecho ?? null, cintura ?? null, cadera ?? null, brazo ?? null, pierna ?? null,
        grasa_porcentaje ?? null, comentarios || null]
    );
    return this.obtenerPorId(resultado.insertId);
  }

  static async eliminar(id) {
    const [resultado] = await db.query('DELETE FROM registros_progreso WHERE id_registro = ?', [id]);
    return resultado.affectedRows > 0;
  }
}

module.exports = ProgresoModel;

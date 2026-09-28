const db = require('../config/database');

const CAMPOS = `
  a.*,
  CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.documento AS cliente_documento,
  CONCAT(e.nombre, ' ', e.apellido) AS entrenador_nombre,
  r.nombre_rutina
`;

const JOINS = `
  FROM asistencias a
  JOIN clientes c ON a.id_cliente = c.id_cliente
  JOIN entrenadores e ON a.id_entrenador = e.id_entrenador
  LEFT JOIN rutinas r ON a.id_rutina = r.id_rutina
`;

class AsistenciaModel {
  static async obtenerTodas(filtros = {}) {
    const where = [];
    const params = [];

    if (filtros.id_cliente) { where.push('a.id_cliente = ?'); params.push(filtros.id_cliente); }
    if (filtros.id_entrenador) { where.push('a.id_entrenador = ?'); params.push(filtros.id_entrenador); }
    if (filtros.id_rutina) { where.push('a.id_rutina = ?'); params.push(filtros.id_rutina); }
    if (filtros.fecha) { where.push('a.fecha = ?'); params.push(filtros.fecha); }
    if (filtros.desde) { where.push('a.fecha >= ?'); params.push(filtros.desde); }
    if (filtros.hasta) { where.push('a.fecha <= ?'); params.push(filtros.hasta); }

    const sql = `SELECT ${CAMPOS} ${JOINS}
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY a.fecha DESC, a.hora_entrada DESC`;

    const [filas] = await db.query(sql, params);
    return filas;
  }

  static async obtenerPorId(id) {
    const [filas] = await db.query(`SELECT ${CAMPOS} ${JOINS} WHERE a.id_asistencia = ?`, [id]);
    return filas[0] || null;
  }

  // Evita doble registro: el mismo cliente no puede tener dos asistencias
  // el mismo dia, salvo que se indique una nueva entrada de forma explicita.
  static async yaRegistradoHoy(idCliente, fecha) {
    const [filas] = await db.query(
      'SELECT COUNT(*) AS total FROM asistencias WHERE id_cliente = ? AND fecha = ?',
      [idCliente, fecha]
    );
    return filas[0].total > 0;
  }

  static async crear(datos) {
    const { id_cliente, id_entrenador, id_rutina, fecha, hora_entrada, hora_salida, observaciones } = datos;
    const [resultado] = await db.query(
      `INSERT INTO asistencias (id_cliente, id_entrenador, id_rutina, fecha, hora_entrada, hora_salida, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_cliente, id_entrenador, id_rutina || null, fecha, hora_entrada || null, hora_salida || null, observaciones || null]
    );
    return this.obtenerPorId(resultado.insertId);
  }

  static async registrarSalida(id, horaSalida) {
    const [resultado] = await db.query(
      'UPDATE asistencias SET hora_salida = ? WHERE id_asistencia = ?',
      [horaSalida, id]
    );
    return resultado.affectedRows > 0;
  }

  static async eliminar(id) {
    const [resultado] = await db.query('DELETE FROM asistencias WHERE id_asistencia = ?', [id]);
    return resultado.affectedRows > 0;
  }
}

module.exports = AsistenciaModel;

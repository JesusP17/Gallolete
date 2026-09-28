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

  static async obtenerPorDocumento(documento) {
    const [filas] = await db.query('SELECT * FROM entrenadores WHERE documento = ?', [documento]);
    return filas[0] || null;
  }

  static async contarRutinas(id) {
    const [filas] = await db.query('SELECT COUNT(*) AS total FROM rutinas WHERE id_entrenador = ?', [id]);
    return filas[0].total;
  }

  // F1 + F3: clientes del entrenador, con su membresia y cuantos dias le quedan.
  // Entra como cliente suyo si esta asignado directamente o si tiene alguna rutina suya.
  static async obtenerMisClientes(idEntrenador) {
    const query = `
      SELECT c.id_cliente, c.nombre, c.apellido, c.documento, c.telefono, c.correo,
             c.fecha_nacimiento, c.estado,
             (SELECT COUNT(*) FROM rutinas r
               WHERE r.id_cliente = c.id_cliente AND r.id_entrenador = ?) AS total_rutinas,
             (SELECT GROUP_CONCAT(r.nombre_rutina ORDER BY r.nombre_rutina SEPARATOR ' | ')
                FROM rutinas r
               WHERE r.id_cliente = c.id_cliente AND r.id_entrenador = ?) AS rutinas,
             (SELECT m.tipo FROM membresias m
               WHERE m.id_cliente = c.id_cliente
               ORDER BY (m.estado = 'activa') DESC, m.fecha_fin DESC LIMIT 1) AS membresia_tipo,
             (SELECT m.estado FROM membresias m
               WHERE m.id_cliente = c.id_cliente
               ORDER BY (m.estado = 'activa') DESC, m.fecha_fin DESC LIMIT 1) AS membresia_estado,
             (SELECT m.fecha_fin FROM membresias m
               WHERE m.id_cliente = c.id_cliente
               ORDER BY (m.estado = 'activa') DESC, m.fecha_fin DESC LIMIT 1) AS membresia_fin,
             (SELECT COUNT(*) FROM asistencias a
               WHERE a.id_cliente = c.id_cliente) AS total_asistencias,
             (SELECT MAX(p.fecha) FROM registros_progreso p
               WHERE p.id_cliente = c.id_cliente) AS ultimo_progreso
      FROM clientes c
      WHERE c.id_entrenador = ?
         OR EXISTS (SELECT 1 FROM rutinas r
                     WHERE r.id_cliente = c.id_cliente AND r.id_entrenador = ?)
      ORDER BY c.nombre ASC, c.apellido ASC
    `;
    const [filas] = await db.query(query, [idEntrenador, idEntrenador, idEntrenador, idEntrenador]);

    const hoy = new Date();
    return filas.map(fila => {
      const fin = fila.membresia_fin ? new Date(fila.membresia_fin) : null;
      const diasRestantes = fin ? Math.ceil((fin - hoy) / 86400000) : null;
      return {
        ...fila,
        total_rutinas: Number(fila.total_rutinas),
        total_asistencias: Number(fila.total_asistencias),
        rutinas: fila.rutinas ? fila.rutinas.split(' | ') : [],
        membresia_al_dia: fila.membresia_estado === 'activa' && diasRestantes !== null && diasRestantes >= 0,
        dias_restantes_membresia: diasRestantes
      };
    });
  }

  // F2: solo las rutinas de este entrenador.
  static async obtenerMisRutinas(idEntrenador) {
    const query = `
      SELECT r.*, CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre, c.documento AS cliente_documento,
             (SELECT COUNT(*) FROM rutina_ejercicios re WHERE re.id_rutina = r.id_rutina) AS total_ejercicios
      FROM rutinas r
      JOIN clientes c ON r.id_cliente = c.id_cliente
      WHERE r.id_entrenador = ?
      ORDER BY r.id_rutina DESC
    `;
    const [filas] = await db.query(query, [idEntrenador]);
    return filas.map(fila => ({ ...fila, total_ejercicios: Number(fila.total_ejercicios) }));
  }

  // F4: resumen para el panel del entrenador.
  static async obtenerEstadisticas(idEntrenador) {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM clientes c WHERE c.id_entrenador = ?) AS clientes_asignados,
        (SELECT COUNT(DISTINCT r.id_cliente) FROM rutinas r WHERE r.id_entrenador = ?) AS clientes_con_rutina,
        (SELECT COUNT(*) FROM rutinas r WHERE r.id_entrenador = ?) AS total_rutinas,
        (SELECT COUNT(*) FROM rutinas r WHERE r.id_entrenador = ? AND r.estado = 'activa') AS rutinas_activas,
        (SELECT COUNT(*) FROM rutina_ejercicios re
           JOIN rutinas r ON r.id_rutina = re.id_rutina
          WHERE r.id_entrenador = ?) AS total_ejercicios,
        (SELECT COUNT(*) FROM asistencias a WHERE a.id_entrenador = ?) AS total_asistencias,
        (SELECT COUNT(*) FROM registros_progreso p WHERE p.id_entrenador = ?) AS registros_progreso
    `;
    const [filas] = await db.query(query, [
      idEntrenador, idEntrenador, idEntrenador, idEntrenador, idEntrenador, idEntrenador, idEntrenador
    ]);

    const resumen = filas[0];
    for (const clave of ['clientes_asignados', 'clientes_con_rutina', 'total_rutinas', 'rutinas_activas', 'total_ejercicios', 'total_asistencias', 'registros_progreso']) {
      resumen[clave] = Number(resumen[clave]);
    }

    const [porEstado] = await db.query(
      `SELECT c.estado, COUNT(DISTINCT c.id_cliente) AS total
         FROM clientes c
         JOIN rutinas r ON r.id_cliente = c.id_cliente
        WHERE r.id_entrenador = ?
        GROUP BY c.estado`,
      [idEntrenador]
    );

    const clientesPorEstado = {};
    for (const fila of porEstado) clientesPorEstado[fila.estado] = Number(fila.total);

    return { ...resumen, clientes_por_estado: clientesPorEstado };
  }

  static async asignarCliente(idEntrenador, idCliente) {
    const [resultado] = await db.query('UPDATE clientes SET id_entrenador = ? WHERE id_cliente = ?', [idEntrenador, idCliente]);
    return resultado.affectedRows > 0;
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
      [nombre, apellido, documento, telefono || null, correo || null, especialidad || null, horario || null, estado, id]
    );
    return this.obtenerPorId(id);
  }

  static async eliminar(id) {
    const [resultado] = await db.query('DELETE FROM entrenadores WHERE id_entrenador = ?', [id]);
    return resultado.affectedRows > 0;
  }
}

module.exports = EntrenadorModel;

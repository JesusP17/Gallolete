const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UsuarioModel {
  static async obtenerTodos() {
    const query = `
      SELECT u.id_usuario, u.id_cliente, u.id_entrenador, u.nombre_usuario, u.correo, u.rol, u.estado,
             CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
             CONCAT(e.nombre, ' ', e.apellido) AS entrenador_nombre
      FROM usuarios u
      LEFT JOIN clientes c ON u.id_cliente = c.id_cliente
      LEFT JOIN entrenadores e ON u.id_entrenador = e.id_entrenador
      ORDER BY u.id_usuario DESC
    `;
    const [filas] = await db.query(query);
    return filas;
  }

  static async obtenerPorId(id) {
    const query = `
      SELECT u.id_usuario, u.id_cliente, u.id_entrenador, u.nombre_usuario, u.correo, u.rol, u.estado,
             CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre,
             CONCAT(e.nombre, ' ', e.apellido) AS entrenador_nombre
      FROM usuarios u
      LEFT JOIN clientes c ON u.id_cliente = c.id_cliente
      LEFT JOIN entrenadores e ON u.id_entrenador = e.id_entrenador
      WHERE u.id_usuario = ?
    `;
    const [filas] = await db.query(query, [id]);
    return filas[0] || null;
  }

  static async obtenerPorCorreoONombre(identificador) {
    const [filas] = await db.query(
      'SELECT * FROM usuarios WHERE correo = ? OR nombre_usuario = ?',
      [identificador, identificador]
    );
    return filas[0] || null;
  }

  static async crear(datos) {
    const { nombre_usuario, correo, password, rol, id_cliente, id_entrenador, estado } = datos;
    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(password, salt);

    const [resultado] = await db.query(
      `INSERT INTO usuarios (nombre_usuario, correo, password, rol, id_cliente, id_entrenador, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre_usuario, correo, passwordHashed, rol || 'Recepcionista', id_cliente || null, id_entrenador || null, estado || 'activo']
    );

    return this.obtenerPorId(resultado.insertId);
  }

  static async actualizar(id, datos) {
    // Se arma el SET solo con los campos que llegan, para que un PUT parcial
    // no vacie las columnas ausentes.
    const asignaciones = [];
    const valores = [];

    const agregar = (columna, valor) => { asignaciones.push(`${columna} = ?`); valores.push(valor); };

    for (const campo of ['nombre_usuario', 'correo', 'rol', 'estado']) {
      if (datos[campo] !== undefined) agregar(campo, datos[campo]);
    }
    for (const campo of ['id_cliente', 'id_entrenador']) {
      if (datos[campo] !== undefined) agregar(campo, datos[campo] === '' ? null : datos[campo]);
    }
    if (datos.password && String(datos.password).trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      agregar('password', await bcrypt.hash(datos.password, salt));
    }

    if (asignaciones.length === 0) return this.obtenerPorId(id);

    valores.push(id);
    await db.query(
      `UPDATE usuarios SET ${asignaciones.join(', ')} WHERE id_usuario = ?`,
      valores
    );

    return this.obtenerPorId(id);
  }

  static async eliminar(id) {
    const [resultado] = await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
    return resultado.affectedRows > 0;
  }

  static async verificarPassword(passwordPlana, passwordEncriptada) {
    if (typeof passwordPlana !== 'string' || typeof passwordEncriptada !== 'string') return false;
    return await bcrypt.compare(passwordPlana, passwordEncriptada);
  }
}

module.exports = UsuarioModel;

const UsuarioModel = require('../models/usuario.model');

const ROLES_VALIDOS = ['Administrador', 'Entrenador', 'Recepcionista', 'Cliente'];

const obtenerUsuarios = async (req, res, next) => {
  try {
    const usuarios = await UsuarioModel.obtenerTodos();
    res.json({ ok: true, usuarios });
  } catch (error) {
    next(error);
  }
};

const obtenerUsuarioPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await UsuarioModel.obtenerPorId(id);
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }
    res.json({ ok: true, usuario });
  } catch (error) {
    next(error);
  }
};

const crearUsuario = async (req, res, next) => {
  try {
    const { nombre_usuario, correo, password, rol } = req.body;
    if (!nombre_usuario || !correo || !password || !rol) {
      return res.status(400).json({ ok: false, mensaje: 'Nombre de usuario, correo, contraseña y rol son obligatorios.' });
    }

    if (!ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ ok: false, mensaje: `Rol inválido. Los roles permitidos son: ${ROLES_VALIDOS.join(', ')}.` });
    }

    const nuevoUsuario = await UsuarioModel.crear(req.body);
    res.status(201).json({ ok: true, mensaje: 'Usuario registrado exitosamente.', usuario: nuevoUsuario });
  } catch (error) {
    next(error);
  }
};

const actualizarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existe = await UsuarioModel.obtenerPorId(id);
    if (!existe) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    // Evita escalada de privilegios: rol, vinculaciones y estado solo los cambia un Administrador
    const camposPermitidos = ['nombre_usuario', 'correo', 'password'];
    if (req.usuario && req.usuario.rol === 'Administrador') {
      camposPermitidos.push('rol', 'id_cliente', 'id_entrenador', 'estado');
    }

    const datos = {};
    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) datos[campo] = req.body[campo];
    });

    if (datos.rol !== undefined && !ROLES_VALIDOS.includes(datos.rol)) {
      return res.status(400).json({ ok: false, mensaje: `Rol inválido. Los roles permitidos son: ${ROLES_VALIDOS.join(', ')}.` });
    }

    const actualizado = await UsuarioModel.actualizar(id, datos);
    res.json({ ok: true, mensaje: 'Usuario actualizado correctamente.', usuario: actualizado });
  } catch (error) {
    next(error);
  }
};

const eliminarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eliminado = await UsuarioModel.eliminar(id);
    if (!eliminado) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }
    res.json({ ok: true, mensaje: 'Usuario eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};

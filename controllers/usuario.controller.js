const UsuarioModel = require('../models/usuario.model');

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

    const actualizado = await UsuarioModel.actualizar(id, req.body);
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

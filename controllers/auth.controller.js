const UsuarioModel = require('../models/usuario.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'gallolete_secreto_super_seguro_2026';

const login = async (req, res, next) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Debe ingresar el usuario/correo y la contraseña.' });
    }

    const userObj = await UsuarioModel.obtenerPorCorreoONombre(usuario);
    if (!userObj) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado o inactivo.' });
    }

    if (userObj.estado !== 'activo') {
      return res.status(403).json({ ok: false, mensaje: 'Este usuario se encuentra inactivo. Contacte al administrador.' });
    }

    const passwordValida = await UsuarioModel.verificarPassword(password, userObj.password);
    if (!passwordValida) {
      return res.status(401).json({ ok: false, mensaje: 'Contraseña incorrecta.' });
    }

    const payload = {
      id_usuario: userObj.id_usuario,
      id_cliente: userObj.id_cliente,
      id_entrenador: userObj.id_entrenador,
      nombre_usuario: userObj.nombre_usuario,
      correo: userObj.correo,
      rol: userObj.rol
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso.',
      token,
      usuario: payload
    });
  } catch (error) {
    next(error);
  }
};

const perfil = async (req, res) => {
  res.json({
    ok: true,
    usuario: req.usuario
  });
};

module.exports = {
  login,
  perfil
};

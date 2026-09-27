const UsuarioModel = require('../models/usuario.model');
const ClienteModel = require('../models/cliente.model');
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

    if (userObj.estado !== 'activo' || (userObj.cliente_estado && userObj.cliente_estado !== 'activo') || (userObj.entrenador_estado && userObj.entrenador_estado !== 'activo')) {
      return res.status(403).json({ ok: false, mensaje: 'Esta cuenta o perfil se encuentra deshabilitado/inactivo. Contacte al administrador.' });
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

const registro = async (req, res, next) => {
  try {
    let { documento, nombre, apellido, nombre_completo, correo, nombre_usuario, password, telefono, fecha_nacimiento, genero, direccion } = req.body;

    if (nombre_completo && (!nombre || !apellido)) {
      const partes = nombre_completo.trim().split(/\s+/);
      nombre = (partes[0] || '').substring(0, 30);
      apellido = (partes.slice(1).join(' ') || partes[0] || '').substring(0, 30);
    }

    if (!documento || documento.trim() === '') {
      documento = 'DOC-' + Math.floor(10000000 + Math.random() * 90000000);
    }

    if (!nombre || !apellido || !correo || !nombre_usuario || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Campos obligatorios: nombre y apellido, correo, contraseña y nombre de usuario.'
      });
    }

    if (documento.trim().length > 20) {
      return res.status(400).json({ ok: false, mensaje: 'El documento no puede superar los 20 caracteres.' });
    }

    if (nombre.trim().length > 30) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre no puede superar los 30 caracteres.' });
    }

    if (apellido.trim().length > 30) {
      return res.status(400).json({ ok: false, mensaje: 'El apellido no puede superar los 30 caracteres.' });
    }

    if (correo.trim().length > 70) {
      return res.status(400).json({ ok: false, mensaje: 'El correo electrónico no puede superar los 70 caracteres.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
      return res.status(400).json({ ok: false, mensaje: 'El correo electrónico debe ser válido, incluyendo "@" y "." (ej: cliente@dominio.com).' });
    }

    if (nombre_usuario.trim().length > 30) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre de usuario no puede superar los 30 caracteres.' });
    }

    if (password.length < 8 || password.length > 12) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener entre 8 y 12 caracteres.' });
    }

    if (telefono && telefono.trim().length > 20) {
      return res.status(400).json({ ok: false, mensaje: 'El teléfono no puede superar los 20 caracteres.' });
    }

    const usuarioExistente = await UsuarioModel.obtenerPorCorreoONombre(nombre_usuario);
    if (usuarioExistente) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre de usuario ya se encuentra registrado.'
      });
    }

    const correoExistente = await UsuarioModel.obtenerPorCorreoONombre(correo);
    if (correoExistente) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El correo electrónico ya se encuentra registrado.'
      });
    }

    let cliente = await ClienteModel.obtenerPorDocumento(documento);
    if (!cliente) {
      cliente = await ClienteModel.crear({
        documento,
        nombre,
        apellido,
        correo,
        telefono: telefono || null,
        fecha_nacimiento: fecha_nacimiento || null,
        genero: genero || null,
        direccion: direccion || null,
        estado: 'activo'
      });
    }

    const nuevoUsuario = await UsuarioModel.crear({
      nombre_usuario,
      correo,
      password,
      rol: 'Cliente',
      id_cliente: cliente.id_cliente,
      estado: 'activo'
    });

    const payload = {
      id_usuario: nuevoUsuario.id_usuario,
      id_cliente: cliente.id_cliente,
      id_entrenador: null,
      nombre_usuario: nuevoUsuario.nombre_usuario,
      correo: nuevoUsuario.correo,
      rol: 'Cliente'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.status(201).json({
      ok: true,
      mensaje: '¡Registro exitoso! Bienvenido a GalloLeTe.',
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
  registro,
  perfil
};

const UsuarioModel = require('../models/usuario.model');
const ClienteModel = require('../models/cliente.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const login = async (req, res, next) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Debe ingresar el usuario/correo y la contraseña.' });
    }

    const userObj = await UsuarioModel.obtenerPorCorreoONombre(usuario);
    if (!userObj) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos.' });
    }

    const passwordValida = await UsuarioModel.verificarPassword(password, userObj.password);
    if (!passwordValida) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos.' });
    }

    if (userObj.estado !== 'activo' || (userObj.cliente_estado && userObj.cliente_estado !== 'activo') || (userObj.entrenador_estado && userObj.entrenador_estado !== 'activo')) {
      return res.status(403).json({ ok: false, mensaje: 'Esta cuenta o perfil se encuentra deshabilitado/inactivo. Contacte al administrador.' });
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

// Genera un nombre de usuario único a partir del nombre y apellido (ej: "Juan Pérez" -> "juanperez").
const generarNombreUsuario = async (nombreCompleto) => {
  const palabras = nombreCompleto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const base = ((palabras[0] || 'cliente') + (palabras.length > 1 ? palabras[palabras.length - 1] : '')).substring(0, 30) || 'cliente';

  let candidato = base;
  let contador = 1;
  while (await UsuarioModel.existeNombreUsuario(candidato)) {
    contador += 1;
    const sufijo = String(contador);
    candidato = base.substring(0, 30 - sufijo.length) + sufijo;
  }
  return candidato;
};

const registro = async (req, res, next) => {
  try {
    let { documento, nombre, apellido, nombre_completo, correo, password, telefono, fecha_nacimiento, genero, direccion } = req.body;

    if (nombre_completo && (!nombre || !apellido)) {
      const partes = nombre_completo.trim().split(/\s+/);
      nombre = (partes[0] || '').substring(0, 30);
      apellido = (partes.slice(1).join(' ') || partes[0] || '').substring(0, 30);
    }

    if (!documento || documento.trim() === '') {
      documento = 'DOC-' + Math.floor(10000000 + Math.random() * 90000000);
    }

    if (!nombre || !apellido || !correo || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Campos obligatorios: nombre y apellido, correo y contraseña.'
      });
    }

    const nombreCompletoRecibido = (nombre_completo || `${nombre} ${apellido}`).trim();
    if (nombreCompletoRecibido.split(/\s+/).filter(Boolean).length < 2) {
      return res.status(400).json({ ok: false, mensaje: 'Debe ingresar nombre y apellido (mínimo dos palabras).' });
    }

    const nombreRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
    if (!nombreRegex.test(nombreCompletoRecibido)) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre y apellido no puede contener números ni símbolos (solo letras y espacios).' });
    }

    if (nombreCompletoRecibido.length > 30) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre completo no puede superar los 30 caracteres.' });
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

    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    if (!emailRegex.test(correo.trim())) {
      return res.status(400).json({ ok: false, mensaje: 'El correo debe ser de Gmail obligatoriamente (ej: usuario@gmail.com).' });
    }

    if (password.length < 8) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener mínimo 8 caracteres.' });
    }

    if (password.length > 30) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña no puede superar los 30 caracteres.' });
    }

    if (telefono && telefono.trim().length > 20) {
      return res.status(400).json({ ok: false, mensaje: 'El teléfono no puede superar los 20 caracteres.' });
    }

    // El cliente no elige usuario: se genera automáticamente desde su nombre y apellido.
    const nombre_usuario = await generarNombreUsuario(nombreCompletoRecibido);

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

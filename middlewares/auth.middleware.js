const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'gallolete_secreto_super_seguro_2026';

// Middleware para verificar si el usuario tiene un Token válido
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      ok: false,
      mensaje: 'Acceso denegado. No se proporcionó un token de autenticación.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      ok: false,
      mensaje: 'Token inválido o expirado. Por favor inicie sesión nuevamente.'
    });
  }
};

// Middleware para permitir acceso solo a roles específicos
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no autenticado.' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: `Acceso no autorizado. Su rol (${req.usuario.rol}) no tiene permisos para realizar esta acción.`
      });
    }

    next();
  };
};

module.exports = {
  verificarToken,
  verificarRol
};

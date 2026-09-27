const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

// Middleware para permitir actualizar si es Administrador o el propio usuario dueño de la cuenta
const permitirAdminOMismoUsuario = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ ok: false, mensaje: 'Usuario no autenticado.' });
  }

  const esAdmin = req.usuario.rol === 'Administrador';
  const esMismoUsuario = parseInt(req.usuario.id_usuario) === parseInt(req.params.id);

  if (!esAdmin && !esMismoUsuario) {
    return res.status(403).json({
      ok: false,
      mensaje: 'Acceso no autorizado. Solo puede modificar sus propios datos o ser Administrador.'
    });
  }

  next();
};

router.get('/', verificarToken, verificarRol('Administrador'), usuarioController.obtenerUsuarios);
router.get('/:id', verificarToken, usuarioController.obtenerUsuarioPorId);
router.post('/', verificarToken, verificarRol('Administrador'), usuarioController.crearUsuario);
router.put('/:id', verificarToken, permitirAdminOMismoUsuario, usuarioController.actualizarUsuario);
router.delete('/:id', verificarToken, verificarRol('Administrador'), usuarioController.eliminarUsuario);

module.exports = router;

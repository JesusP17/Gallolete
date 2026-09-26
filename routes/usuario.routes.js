const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, verificarRol('Administrador'), usuarioController.obtenerUsuarios);
router.get('/:id', verificarToken, verificarRol('Administrador'), usuarioController.obtenerUsuarioPorId);
router.post('/', verificarToken, verificarRol('Administrador'), usuarioController.crearUsuario);
router.put('/:id', verificarToken, verificarRol('Administrador'), usuarioController.actualizarUsuario);
router.delete('/:id', verificarToken, verificarRol('Administrador'), usuarioController.eliminarUsuario);

module.exports = router;

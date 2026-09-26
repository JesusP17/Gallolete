const express = require('express');
const router = express.Router();
const membresiaController = require('../controllers/membresia.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', membresiaController.obtenerMembresias);
router.get('/:id', membresiaController.obtenerMembresiaPorId);
router.post('/', verificarToken, membresiaController.crearMembresia);
router.put('/:id', verificarToken, membresiaController.actualizarMembresia);
router.delete('/:id', verificarToken, verificarRol('Administrador'), membresiaController.eliminarMembresia);

module.exports = router;

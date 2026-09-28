const express = require('express');
const router = express.Router();
const membresiaController = require('../controllers/membresia.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, membresiaController.obtenerMembresias);
router.get('/:id', membresiaController.obtenerMembresiaPorId);
router.post('/', verificarToken, verificarRol('Administrador', 'Recepcionista'), membresiaController.crearMembresia);
router.put('/:id', verificarToken, verificarRol('Administrador', 'Recepcionista'), membresiaController.actualizarMembresia);
router.delete('/:id', verificarToken, verificarRol('Administrador'), membresiaController.eliminarMembresia);

module.exports = router;

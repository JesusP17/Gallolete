const express = require('express');
const router = express.Router();
const entrenadorController = require('../controllers/entrenador.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', entrenadorController.obtenerEntrenadores);
router.get('/:id', entrenadorController.obtenerEntrenadorPorId);
router.post('/', verificarToken, verificarRol('Administrador'), entrenadorController.crearEntrenador);
router.put('/:id', verificarToken, verificarRol('Administrador', 'Entrenador'), entrenadorController.actualizarEntrenador);
router.delete('/:id', verificarToken, verificarRol('Administrador'), entrenadorController.eliminarEntrenador);

module.exports = router;

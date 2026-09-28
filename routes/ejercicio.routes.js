const express = require('express');
const router = express.Router();
const ejercicioController = require('../controllers/ejercicio.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, ejercicioController.obtenerEjercicios);
router.get('/:id', ejercicioController.obtenerEjercicioPorId);
router.post('/', verificarToken, ejercicioController.crearEjercicio);
router.put('/:id', verificarToken, ejercicioController.actualizarEjercicio);
router.delete('/:id', verificarToken, verificarRol('Administrador'), ejercicioController.eliminarEjercicio);

module.exports = router;

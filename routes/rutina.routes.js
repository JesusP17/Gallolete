const express = require('express');
const router = express.Router();
const rutinaController = require('../controllers/rutina.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', rutinaController.obtenerRutinas);
router.get('/:id', rutinaController.obtenerRutinaPorId);
router.post('/', verificarToken, rutinaController.crearRutina);
router.put('/:id', verificarToken, rutinaController.actualizarRutina);
router.delete('/:id', verificarToken, verificarRol('Administrador', 'Entrenador'), rutinaController.eliminarRutina);

// Endpoints para gestión de ejercicios en rutinas
router.post('/:id/ejercicios', verificarToken, rutinaController.agregarEjercicioARutina);
router.delete('/ejercicios/:id_rutina_ejercicio', verificarToken, rutinaController.eliminarEjercicioDeRutina);

module.exports = router;

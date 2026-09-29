const express = require('express');
const router = express.Router();
const rutinaController = require('../controllers/rutina.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, rutinaController.obtenerRutinas);
router.get('/:id', verificarToken, rutinaController.obtenerRutinaPorId);
router.post('/', verificarToken, verificarRol('Administrador', 'Entrenador'), rutinaController.crearRutina);
router.put('/:id', verificarToken, verificarRol('Administrador', 'Entrenador'), rutinaController.actualizarRutina);
router.delete('/:id', verificarToken, verificarRol('Administrador', 'Entrenador'), rutinaController.eliminarRutina);

// Endpoints para gestión de ejercicios en rutinas
router.post('/:id/ejercicios', verificarToken, verificarRol('Administrador', 'Entrenador'), rutinaController.agregarEjercicioARutina);
router.delete('/ejercicios/:id_rutina_ejercicio', verificarToken, verificarRol('Administrador', 'Entrenador'), rutinaController.eliminarEjercicioDeRutina);

module.exports = router;

const express = require('express');
const router = express.Router();

const asistenciaController = require('../controllers/asistencia.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { verificarClientePropio } = require('../middlewares/ownership.middleware');

router.get('/', verificarToken, verificarRol('Administrador', 'Entrenador'), asistenciaController.obtenerAsistencias);
router.post('/', verificarToken, verificarRol('Administrador', 'Entrenador'), verificarClientePropio, asistenciaController.registrarAsistencia);
router.post('/:id/salida', verificarToken, verificarRol('Administrador', 'Entrenador'), asistenciaController.registrarSalida);
router.delete('/:id', verificarToken, verificarRol('Administrador', 'Entrenador'), asistenciaController.eliminarAsistencia);

module.exports = router;

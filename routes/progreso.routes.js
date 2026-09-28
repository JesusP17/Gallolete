const express = require('express');
const router = express.Router();

const progresoController = require('../controllers/progreso.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { verificarClientePropio } = require('../middlewares/ownership.middleware');

router.get('/', verificarToken, verificarRol('Administrador', 'Entrenador'), progresoController.obtenerRegistros);
router.get('/cliente/:id_cliente', verificarToken, verificarRol('Administrador', 'Entrenador'), verificarClientePropio, progresoController.obtenerEvolucion);
router.post('/', verificarToken, verificarRol('Administrador', 'Entrenador'), verificarClientePropio, progresoController.registrarProgreso);
router.delete('/:id', verificarToken, verificarRol('Administrador', 'Entrenador'), progresoController.eliminarRegistro);

module.exports = router;

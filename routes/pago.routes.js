const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pago.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', pagoController.obtenerPagos);
router.get('/:id', pagoController.obtenerPagoPorId);
router.post('/', verificarToken, pagoController.crearPago);
router.put('/:id', verificarToken, pagoController.actualizarPago);
router.delete('/:id', verificarToken, verificarRol('Administrador'), pagoController.eliminarPago);

module.exports = router;

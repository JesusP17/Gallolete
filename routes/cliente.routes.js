const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', clienteController.obtenerClientes);
router.get('/:id', clienteController.obtenerClientePorId);
router.post('/', verificarToken, clienteController.crearCliente);
router.put('/:id', verificarToken, clienteController.actualizarCliente);
router.delete('/:id', verificarToken, verificarRol('Administrador'), clienteController.eliminarCliente);

module.exports = router;

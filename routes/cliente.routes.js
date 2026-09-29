const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/cliente.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, verificarRol('Administrador', 'Recepcionista', 'Entrenador'), clienteController.obtenerClientes);
router.get('/:id', verificarToken, verificarRol('Administrador', 'Recepcionista', 'Entrenador'), clienteController.obtenerClientePorId);
router.post('/', verificarToken, verificarRol('Administrador', 'Recepcionista'), clienteController.crearCliente);
router.put('/:id', verificarToken, verificarRol('Administrador', 'Recepcionista'), clienteController.actualizarCliente);
router.delete('/:id', verificarToken, verificarRol('Administrador'), clienteController.eliminarCliente);

module.exports = router;

const express = require('express');
const router = express.Router();
const entrenadorController = require('../controllers/entrenador.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { verificarEntrenadorPropio, verificarClientePropio } = require('../middlewares/ownership.middleware');

// Estas rutas literales deben declararse antes que "/:id" o Express las
// interpretaria como un id de entrenador.
router.get('/mi-perfil', verificarToken, verificarRol('Entrenador'), entrenadorController.obtenerMiPerfil);
router.get('/mis-clientes', verificarToken, verificarRol('Entrenador', 'Administrador'), entrenadorController.obtenerMisClientes);
router.get('/mis-rutinas', verificarToken, verificarRol('Entrenador', 'Administrador'), entrenadorController.obtenerMisRutinas);
router.get('/estadisticas', verificarToken, verificarRol('Entrenador', 'Administrador'), entrenadorController.obtenerEstadisticas);
router.post('/mis-clientes', verificarToken, verificarRol('Entrenador', 'Administrador'), verificarClientePropio, entrenadorController.asignarCliente);

router.get('/', verificarToken, entrenadorController.obtenerEntrenadores);
router.get('/:id', verificarToken, entrenadorController.obtenerEntrenadorPorId);
router.post('/', verificarToken, verificarRol('Administrador'), entrenadorController.crearEntrenador);
router.put('/:id', verificarToken, verificarRol('Administrador', 'Entrenador'), verificarEntrenadorPropio, entrenadorController.actualizarEntrenador);
router.delete('/:id', verificarToken, verificarRol('Administrador'), entrenadorController.eliminarEntrenador);

module.exports = router;

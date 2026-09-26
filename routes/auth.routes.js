const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.post('/login', authController.login);
router.get('/me', verificarToken, authController.perfil);

module.exports = router;

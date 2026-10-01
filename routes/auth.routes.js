const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// Limita los intentos fallidos de inicio de sesión (los exitosos no cuentan)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, mensaje: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.' }
});

router.post('/login', loginLimiter, authController.login);
router.post('/registro', authController.registro);
router.post('/register', authController.registro);
router.post('/google', authController.googleAuth);
router.get('/me', verificarToken, authController.perfil);

module.exports = router;

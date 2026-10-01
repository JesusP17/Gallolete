const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// El servidor no debe arrancar sin un secreto JWT definido (evita firmar tokens con claves por defecto)
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: La variable JWT_SECRET no está definida en el archivo .env. El servidor no puede iniciar.');
  process.exit(1);
}

const errorHandler = require('./middlewares/error.middleware');

// Rutas de la API
const authRoutes = require('./routes/auth.routes');
const clienteRoutes = require('./routes/cliente.routes');
const membresiaRoutes = require('./routes/membresia.routes');
const entrenadorRoutes = require('./routes/entrenador.routes');
const rutinaRoutes = require('./routes/rutina.routes');
const ejercicioRoutes = require('./routes/ejercicio.routes');
const pagoRoutes = require('./routes/pago.routes');
const usuarioRoutes = require('./routes/usuario.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares Globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del Frontend
app.use(express.static(path.join(__dirname, 'public')));

// Mapeo de Endpoints de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/membresias', membresiaRoutes);
app.use('/api/entrenadores', entrenadorRoutes);
app.use('/api/rutinas', rutinaRoutes);
app.use('/api/ejercicios', ejercicioRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Ruta raíz para servir el index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ ok: false, mensaje: 'Endpoint no encontrado.' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware para manejo global de errores
app.use(errorHandler);

// Iniciar servidor Node.js
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Servidor GalloLeTe iniciado con éxito!`);
  console.log(`📡 URL local: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

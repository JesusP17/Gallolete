// Middleware global para captura y formateo de errores
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error capturado en el servidor:', err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    ok: false,
    mensaje: err.message || 'Ocurrió un error interno en el servidor.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;

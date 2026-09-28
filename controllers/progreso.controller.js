const ProgresoModel = require('../models/progreso.model');

const esAdmin = usuario => usuario && usuario.rol === 'Administrador';

const MEDIDAS = ['peso', 'pecho', 'cintura', 'cadera', 'brazo', 'pierna', 'grasa_porcentaje'];

const soloLectura = ['id_cliente', 'id_entrenador', 'id_rutina', 'fecha', 'desde', 'hasta'];

const obtenerRegistros = async (req, res, next) => {
  try {
    const filtros = {};

    for (const campo of soloLectura) {
      if (req.query[campo] !== undefined) filtros[campo] = req.query[campo];
    }

    // Un entrenador solo ve lo que el mismo registro.
    if (!esAdmin(req.usuario)) {
      filtros.id_entrenador = req.usuario.id_entrenador;
    }

    const registros = await ProgresoModel.obtenerTodos(filtros);
    res.json({ ok: true, registros });
  } catch (error) {
    next(error);
  }
};

const obtenerEvolucion = async (req, res, next) => {
  try {
    const { id_cliente } = req.params;
    const registros = await ProgresoModel.obtenerEvolucion(id_cliente);
    res.json({ ok: true, registros });
  } catch (error) {
    next(error);
  }
};

const registrarProgreso = async (req, res, next) => {
  try {
    const { id_cliente, id_rutina, comentarios } = req.body;

    if (!id_cliente) {
      return res.status(400).json({ ok: false, mensaje: 'El campo id_cliente es obligatorio.' });
    }

    const presentes = MEDIDAS.filter(m => req.body[m] !== undefined && req.body[m] !== null && req.body[m] !== '');
    if (presentes.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: `Debe enviar al menos una medida. Campos disponibles: ${MEDIDAS.join(', ')}.`
      });
    }

    for (const medida of presentes) {
      const valor = Number(req.body[medida]);
      if (Number.isNaN(valor) || valor < 0 || valor > 500) {
        return res.status(400).json({ ok: false, mensaje: `La medida "${medida}" no es valida.` });
      }
    }

    const fecha = req.body.fecha || new Date().toISOString().slice(0, 10);
    let idEntrenador = req.usuario.id_entrenador;
    if (esAdmin(req.usuario)) {
      if (!req.body.id_entrenador) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Indique id_entrenador: el registro queda a nombre de un entrenador.'
        });
      }
      idEntrenador = req.body.id_entrenador;
    }
    if (!idEntrenador) {
      return res.status(403).json({ ok: false, mensaje: 'Su usuario no esta vinculado a un entrenador.' });
    }

    const datos = { id_cliente, id_entrenador: idEntrenador, id_rutina: id_rutina || null, fecha, comentarios };
    for (const medida of MEDIDAS) datos[medida] = req.body[medida];

    const registro = await ProgresoModel.crear(datos);
    res.status(201).json({ ok: true, mensaje: 'Progreso registrado.', registro });
  } catch (error) {
    next(error);
  }
};

const eliminarRegistro = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existente = await ProgresoModel.obtenerPorId(id);
    if (!existente) {
      return res.status(404).json({ ok: false, mensaje: 'Registro de progreso no encontrado.' });
    }
    if (!esAdmin(req.usuario) && String(existente.id_entrenador) !== String(req.usuario.id_entrenador)) {
      return res.status(403).json({ ok: false, mensaje: 'Este registro no le pertenece.' });
    }

    await ProgresoModel.eliminar(id);
    res.json({ ok: true, mensaje: 'Registro eliminado.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerRegistros,
  obtenerEvolucion,
  registrarProgreso,
  eliminarRegistro
};


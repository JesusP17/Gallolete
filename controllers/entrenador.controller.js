const EntrenadorModel = require('../models/entrenador.model');

const obtenerEntrenadores = async (req, res, next) => {
  try {
    const entrenadores = await EntrenadorModel.obtenerTodos();
    res.json({ ok: true, entrenadores });
  } catch (error) {
    next(error);
  }
};

const obtenerEntrenadorPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entrenador = await EntrenadorModel.obtenerPorId(id);
    if (!entrenador) {
      return res.status(404).json({ ok: false, mensaje: 'Entrenador no encontrado.' });
    }
    res.json({ ok: true, entrenador });
  } catch (error) {
    next(error);
  }
};

const crearEntrenador = async (req, res, next) => {
  try {
    const { nombre, apellido, documento } = req.body;
    if (!nombre || !apellido || !documento) {
      return res.status(400).json({ ok: false, mensaje: 'Los campos nombre, apellido y documento son obligatorios.' });
    }

    const nuevoEntrenador = await EntrenadorModel.crear(req.body);
    res.status(201).json({ ok: true, mensaje: 'Entrenador registrado exitosamente.', entrenador: nuevoEntrenador });
  } catch (error) {
    next(error);
  }
};

const actualizarEntrenador = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existe = await EntrenadorModel.obtenerPorId(id);
    if (!existe) {
      return res.status(404).json({ ok: false, mensaje: 'Entrenador no encontrado.' });
    }

    const actualizado = await EntrenadorModel.actualizar(id, req.body);
    res.json({ ok: true, mensaje: 'Entrenador actualizado correctamente.', entrenador: actualizado });
  } catch (error) {
    next(error);
  }
};

const eliminarEntrenador = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eliminado = await EntrenadorModel.eliminar(id);
    if (!eliminado) {
      return res.status(404).json({ ok: false, mensaje: 'Entrenador no encontrado.' });
    }
    res.json({ ok: true, mensaje: 'Entrenador eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerEntrenadores,
  obtenerEntrenadorPorId,
  crearEntrenador,
  actualizarEntrenador,
  eliminarEntrenador
};

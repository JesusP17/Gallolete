const EjercicioModel = require('../models/ejercicio.model');

const obtenerEjercicios = async (req, res, next) => {
  try {
    const ejercicios = await EjercicioModel.obtenerTodos();
    res.json({ ok: true, ejercicios });
  } catch (error) {
    next(error);
  }
};

const obtenerEjercicioPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ejercicio = await EjercicioModel.obtenerPorId(id);
    if (!ejercicio) {
      return res.status(404).json({ ok: false, mensaje: 'Ejercicio no encontrado.' });
    }
    res.json({ ok: true, ejercicio });
  } catch (error) {
    next(error);
  }
};

const crearEjercicio = async (req, res, next) => {
  try {
    const { nombre, grupo_muscular } = req.body;
    if (!nombre || !grupo_muscular) {
      return res.status(400).json({ ok: false, mensaje: 'El nombre y el grupo muscular son obligatorios.' });
    }

    const nuevoEjercicio = await EjercicioModel.crear(req.body);
    res.status(201).json({ ok: true, mensaje: 'Ejercicio registrado correctamente.', ejercicio: nuevoEjercicio });
  } catch (error) {
    next(error);
  }
};

const actualizarEjercicio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existe = await EjercicioModel.obtenerPorId(id);
    if (!existe) {
      return res.status(404).json({ ok: false, mensaje: 'Ejercicio no encontrado.' });
    }

    const actualizado = await EjercicioModel.actualizar(id, req.body);
    res.json({ ok: true, mensaje: 'Ejercicio actualizado correctamente.', ejercicio: actualizado });
  } catch (error) {
    next(error);
  }
};

const eliminarEjercicio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eliminado = await EjercicioModel.eliminar(id);
    if (!eliminado) {
      return res.status(404).json({ ok: false, mensaje: 'Ejercicio no encontrado.' });
    }
    res.json({ ok: true, mensaje: 'Ejercicio eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerEjercicios,
  obtenerEjercicioPorId,
  crearEjercicio,
  actualizarEjercicio,
  eliminarEjercicio
};

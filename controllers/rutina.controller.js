const RutinaModel = require('../models/rutina.model');

const obtenerRutinas = async (req, res, next) => {
  try {
    const rutinas = await RutinaModel.obtenerTodas();
    res.json({ ok: true, rutinas });
  } catch (error) {
    next(error);
  }
};

const obtenerRutinaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rutina = await RutinaModel.obtenerPorId(id);
    if (!rutina) {
      return res.status(404).json({ ok: false, mensaje: 'Rutina no encontrada.' });
    }
    res.json({ ok: true, rutina });
  } catch (error) {
    next(error);
  }
};

const crearRutina = async (req, res, next) => {
  try {
    const { id_cliente, id_entrenador, nombre_rutina } = req.body;
    if (!id_cliente || !id_entrenador || !nombre_rutina) {
      return res.status(400).json({ ok: false, mensaje: 'El cliente, el entrenador y el nombre de la rutina son obligatorios.' });
    }

    const nuevaRutina = await RutinaModel.crear(req.body);
    res.status(201).json({ ok: true, mensaje: 'Rutina creada exitosamente.', rutina: nuevaRutina });
  } catch (error) {
    next(error);
  }
};

const actualizarRutina = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existe = await RutinaModel.obtenerPorId(id);
    if (!existe) {
      return res.status(404).json({ ok: false, mensaje: 'Rutina no encontrada.' });
    }

    const actualizada = await RutinaModel.actualizar(id, req.body);
    res.json({ ok: true, mensaje: 'Rutina actualizada correctamente.', rutina: actualizada });
  } catch (error) {
    next(error);
  }
};

const eliminarRutina = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eliminada = await RutinaModel.eliminar(id);
    if (!eliminada) {
      return res.status(404).json({ ok: false, mensaje: 'Rutina no encontrada.' });
    }
    res.json({ ok: true, mensaje: 'Rutina eliminada correctamente.' });
  } catch (error) {
    next(error);
  }
};

// Asignación de ejercicios a la rutina
const agregarEjercicioARutina = async (req, res, next) => {
  try {
    const { id } = req.params; // id de la rutina
    const { id_ejercicio, series, repeticiones, peso, descanso, observaciones } = req.body;

    if (!id_ejercicio) {
      return res.status(400).json({ ok: false, mensaje: 'El ID del ejercicio es requerido.' });
    }

    const resultado = await RutinaModel.agregarEjercicio({
      id_rutina: id,
      id_ejercicio,
      series,
      repeticiones,
      peso,
      descanso,
      observaciones
    });

    res.status(201).json({ ok: true, mensaje: 'Ejercicio asignado a la rutina correctamente.', datos: resultado });
  } catch (error) {
    next(error);
  }
};

const eliminarEjercicioDeRutina = async (req, res, next) => {
  try {
    const { id_rutina_ejercicio } = req.params;
    const eliminado = await RutinaModel.eliminarEjercicio(id_rutina_ejercicio);
    if (!eliminado) {
      return res.status(404).json({ ok: false, mensaje: 'Registro de ejercicio en rutina no encontrado.' });
    }
    res.json({ ok: true, mensaje: 'Ejercicio removido de la rutina correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerRutinas,
  obtenerRutinaPorId,
  crearRutina,
  actualizarRutina,
  eliminarRutina,
  agregarEjercicioARutina,
  eliminarEjercicioDeRutina
};

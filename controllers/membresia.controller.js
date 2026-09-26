const MembresiaModel = require('../models/membresia.model');

const obtenerMembresias = async (req, res, next) => {
  try {
    await MembresiaModel.actualizarEstados();
    const membresias = await MembresiaModel.obtenerTodas();
    res.json({ ok: true, membresias });
  } catch (error) {
    next(error);
  }
};

const obtenerMembresiaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const membresia = await MembresiaModel.obtenerPorId(id);
    if (!membresia) {
      return res.status(404).json({ ok: false, mensaje: 'Membresía no encontrada.' });
    }
    res.json({ ok: true, membresia });
  } catch (error) {
    next(error);
  }
};

const crearMembresia = async (req, res, next) => {
  try {
    const { id_cliente, tipo, fecha_inicio, fecha_fin, precio } = req.body;
    if (!id_cliente || !tipo || !fecha_inicio || !fecha_fin || !precio) {
      return res.status(400).json({ ok: false, mensaje: 'Los campos cliente, tipo, fechas y precio son obligatorios.' });
    }

    const nuevaMembresia = await MembresiaModel.crear(req.body);
    res.status(201).json({ ok: true, mensaje: 'Membresía creada exitosamente.', membresia: nuevaMembresia });
  } catch (error) {
    next(error);
  }
};

const actualizarMembresia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existe = await MembresiaModel.obtenerPorId(id);
    if (!existe) {
      return res.status(404).json({ ok: false, mensaje: 'Membresía no encontrada.' });
    }

    const actualizada = await MembresiaModel.actualizar(id, req.body);
    res.json({ ok: true, mensaje: 'Membresía actualizada correctamente.', membresia: actualizada });
  } catch (error) {
    next(error);
  }
};

const eliminarMembresia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eliminada = await MembresiaModel.eliminar(id);
    if (!eliminada) {
      return res.status(404).json({ ok: false, mensaje: 'Membresía no encontrada.' });
    }
    res.json({ ok: true, mensaje: 'Membresía eliminada correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerMembresias,
  obtenerMembresiaPorId,
  crearMembresia,
  actualizarMembresia,
  eliminarMembresia
};

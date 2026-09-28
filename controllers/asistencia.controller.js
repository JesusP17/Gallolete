const AsistenciaModel = require('../models/asistencia.model');

const esAdmin = usuario => usuario && usuario.rol === 'Administrador';

const soloLectura = ['id_cliente', 'id_entrenador', 'id_rutina', 'fecha', 'desde', 'hasta'];

const obtenerAsistencias = async (req, res, next) => {
  try {
    const filtros = {};

    for (const campo of soloLectura) {
      if (req.query[campo] !== undefined) filtros[campo] = req.query[campo];
    }

    // Un entrenador solo ve lo que el mismo registro.
    if (!esAdmin(req.usuario)) {
      filtros.id_entrenador = req.usuario.id_entrenador;
    }

    const asistencias = await AsistenciaModel.obtenerTodas(filtros);
    res.json({ ok: true, asistencias });
  } catch (error) {
    next(error);
  }
};

const registrarAsistencia = async (req, res, next) => {
  try {
    const { id_cliente, id_rutina, hora_entrada, hora_salida, observaciones } = req.body;

    if (!id_cliente) {
      return res.status(400).json({ ok: false, mensaje: 'El campo id_cliente es obligatorio.' });
    }

    if (hora_salida && !hora_entrada) {
      return res.status(400).json({ ok: false, mensaje: 'No se puede registrar la salida sin una entrada.' });
    }

    const fecha = req.body.fecha || new Date().toISOString().slice(0, 10);

    // El middleware de propiedad ya valida que el cliente sea suyo.
    // El Administrador no tiene id_entrenador propio, asi que debe indicar de quien es.
    let idEntrenador = req.usuario.id_entrenador;
    if (esAdmin(req.usuario)) {
      if (!req.body.id_entrenador) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Indique id_entrenador: la asistencia queda a nombre de un entrenador.'
        });
      }
      idEntrenador = req.body.id_entrenador;
    }
    if (!idEntrenador) {
      return res.status(403).json({ ok: false, mensaje: 'Su usuario no esta vinculado a un entrenador.' });
    }

    const repetida = await AsistenciaModel.yaRegistradoHoy(id_cliente, fecha);
    if (repetida) {
      return res.status(409).json({
        ok: false,
        mensaje: 'Este cliente ya tiene una asistencia registrada para esa fecha.'
      });
    }

    const asistencia = await AsistenciaModel.crear({
      id_cliente,
      id_entrenador: idEntrenador,
      id_rutina: id_rutina || null,
      fecha,
      hora_entrada: hora_entrada || new Date().toTimeString().slice(0, 8),
      hora_salida: hora_salida || null,
      observaciones
    });

    res.status(201).json({ ok: true, mensaje: 'Asistencia registrada.', asistencia });
  } catch (error) {
    next(error);
  }
};

const registrarSalida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existente = await AsistenciaModel.obtenerPorId(id);
    if (!existente) {
      return res.status(404).json({ ok: false, mensaje: 'Asistencia no encontrada.' });
    }
    if (!esAdmin(req.usuario) && String(existente.id_entrenador) !== String(req.usuario.id_entrenador)) {
      return res.status(403).json({ ok: false, mensaje: 'Esta asistencia no le pertenece.' });
    }
    if (existente.hora_salida) {
      return res.status(409).json({ ok: false, mensaje: 'Esta asistencia ya tiene una salida registrada.' });
    }

    await AsistenciaModel.registrarSalida(id, req.body.hora_salida || new Date().toTimeString().slice(0, 8));
    const asistencia = await AsistenciaModel.obtenerPorId(id);
    res.json({ ok: true, mensaje: 'Salida registrada.', asistencia });
  } catch (error) {
    next(error);
  }
};

const eliminarAsistencia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existente = await AsistenciaModel.obtenerPorId(id);
    if (!existente) {
      return res.status(404).json({ ok: false, mensaje: 'Asistencia no encontrada.' });
    }
    if (!esAdmin(req.usuario) && String(existente.id_entrenador) !== String(req.usuario.id_entrenador)) {
      return res.status(403).json({ ok: false, mensaje: 'Esta asistencia no le pertenece.' });
    }

    await AsistenciaModel.eliminar(id);
    res.json({ ok: true, mensaje: 'Asistencia eliminada.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerAsistencias,
  registrarAsistencia,
  registrarSalida,
  eliminarAsistencia
};


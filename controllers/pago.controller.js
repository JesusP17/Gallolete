const PagoModel = require('../models/pago.model');

const obtenerPagos = async (req, res, next) => {
  try {
    const filtroCliente = req.usuario.rol === 'Cliente' ? req.usuario.id_cliente : null;
    const pagos = await PagoModel.obtenerTodos(filtroCliente);
    res.json({ ok: true, pagos });
  } catch (error) {
    next(error);
  }
};

const obtenerPagoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pago = await PagoModel.obtenerPorId(id);
    if (!pago) {
      return res.status(404).json({ ok: false, mensaje: 'Pago no encontrado.' });
    }

    if (req.usuario.rol === 'Cliente' && parseInt(pago.id_cliente) !== parseInt(req.usuario.id_cliente)) {
      return res.status(403).json({ ok: false, mensaje: 'Acceso no autorizado a este pago.' });
    }

    res.json({ ok: true, pago });
  } catch (error) {
    next(error);
  }
};

const crearPago = async (req, res, next) => {
  try {
    const { id_cliente, valor, metodo_pago } = req.body;
    if (!id_cliente || !valor) {
      return res.status(400).json({ ok: false, mensaje: 'El cliente y el valor del pago son obligatorios.' });
    }

    const esStaff = ['Administrador', 'Recepcionista'].includes(req.usuario.rol);
    const esPropia = req.usuario.rol === 'Cliente' && parseInt(req.body.id_cliente) === parseInt(req.usuario.id_cliente);
    if (!esStaff && !esPropia) {
      return res.status(403).json({ ok: false, mensaje: 'Acceso no autorizado. Solo puede registrar pagos para su propio perfil.' });
    }

    const nuevoPago = await PagoModel.crear(req.body);
    res.status(201).json({ ok: true, mensaje: 'Pago registrado exitosamente.', pago: nuevoPago });
  } catch (error) {
    next(error);
  }
};

const actualizarPago = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existe = await PagoModel.obtenerPorId(id);
    if (!existe) {
      return res.status(404).json({ ok: false, mensaje: 'Pago no encontrado.' });
    }

    const actualizado = await PagoModel.actualizar(id, req.body);
    res.json({ ok: true, mensaje: 'Pago actualizado correctamente.', pago: actualizado });
  } catch (error) {
    next(error);
  }
};

const eliminarPago = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eliminado = await PagoModel.eliminar(id);
    if (!eliminado) {
      return res.status(404).json({ ok: false, mensaje: 'Pago no encontrado.' });
    }
    res.json({ ok: true, mensaje: 'Pago eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerPagos,
  obtenerPagoPorId,
  crearPago,
  actualizarPago,
  eliminarPago
};

const ClienteModel = require('../models/cliente.model');

const obtenerClientes = async (req, res, next) => {
  try {
    const clientes = await ClienteModel.obtenerTodos();
    res.json({ ok: true, clientes });
  } catch (error) {
    next(error);
  }
};

const obtenerClientePorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cliente = await ClienteModel.obtenerPorId(id);
    if (!cliente) {
      return res.status(404).json({ ok: false, mensaje: 'Cliente no encontrado.' });
    }
    res.json({ ok: true, cliente });
  } catch (error) {
    next(error);
  }
};

const crearCliente = async (req, res, next) => {
  try {
    const { documento, nombre, apellido } = req.body;
    if (!documento || !nombre || !apellido) {
      return res.status(400).json({ ok: false, mensaje: 'Los campos documento, nombre y apellido son obligatorios.' });
    }

    const existe = await ClienteModel.obtenerPorDocumento(documento);
    if (existe) {
      return res.status(400).json({ ok: false, mensaje: 'Ya existe un cliente registrado con ese número de documento.' });
    }

    const nuevoCliente = await ClienteModel.crear(req.body);
    res.status(201).json({ ok: true, mensaje: 'Cliente creado correctamente.', cliente: nuevoCliente });
  } catch (error) {
    next(error);
  }
};

const actualizarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existe = await ClienteModel.obtenerPorId(id);
    if (!existe) {
      return res.status(404).json({ ok: false, mensaje: 'Cliente no encontrado.' });
    }

    const clienteActualizado = await ClienteModel.actualizar(id, req.body);
    res.json({ ok: true, mensaje: 'Cliente actualizado correctamente.', cliente: clienteActualizado });
  } catch (error) {
    next(error);
  }
};

const eliminarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eliminado = await ClienteModel.eliminar(id);
    if (!eliminado) {
      return res.status(404).json({ ok: false, mensaje: 'Cliente no encontrado.' });
    }
    res.json({ ok: true, mensaje: 'Cliente eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente
};

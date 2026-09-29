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
    const { nombre, apellido } = req.body;
    if (!nombre || !apellido) {
      return res.status(400).json({ ok: false, mensaje: 'Los campos nombre y apellido son obligatorios.' });
    }

    if (!req.body.documento) {
      req.body.documento = 'DOC-' + Date.now();
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

// Perfil propio del usuario autenticado (cualquier rol vinculado a un cliente).
// El cliente no tiene acceso a GET /clientes ni a GET /clientes/:id, así que este
// endpoint es la única vía para que el portal del atleta muestre sus datos reales.
const obtenerMiPerfil = async (req, res, next) => {
  try {
    if (!req.usuario.id_cliente) {
      return res.status(403).json({ ok: false, mensaje: 'Tu usuario no está vinculado a un perfil de cliente.' });
    }
    const cliente = await ClienteModel.obtenerPorId(req.usuario.id_cliente);
    if (!cliente) {
      return res.status(404).json({ ok: false, mensaje: 'Perfil de cliente no encontrado.' });
    }
    res.json({ ok: true, cliente });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerClientes,
  obtenerClientePorId,
  obtenerMiPerfil,
  crearCliente,
  actualizarCliente,
  eliminarCliente
};

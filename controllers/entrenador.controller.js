const EntrenadorModel = require('../models/entrenador.model');
const ClienteModel = require('../models/cliente.model');

const ESTADOS_VALIDOS = ['activo', 'inactivo'];

const CAMPOS_EDITABLES = [
  'nombre',
  'apellido',
  'documento',
  'telefono',
  'correo',
  'especialidad',
  'horario'
];

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

const obtenerMiPerfil = async (req, res, next) => {
  try {
    const idEntrenador = req.usuario?.id_entrenador;
    if (!idEntrenador) {
      return res.status(403).json({
        ok: false,
        mensaje: 'Su usuario no está vinculado a un registro de entrenador.'
      });
    }

    const entrenador = await EntrenadorModel.obtenerPorId(idEntrenador);
    if (!entrenador) {
      return res.status(404).json({ ok: false, mensaje: 'Entrenador no encontrado.' });
    }
    res.json({ ok: true, entrenador });
  } catch (error) {
    next(error);
  }
};

// El entrenador siempre ve lo suyo. El Administrador no tiene id_entrenador
// propio, asi que para consultar el panel de otro usa ?entrenador=<id>.
const resolverIdEntrenador = req => {
  if (req.usuario?.rol === 'Administrador' && req.query.entrenador) {
    return req.query.entrenador;
  }
  return req.usuario?.id_entrenador;
};

const sinEntrenador = res => res.status(403).json({
  ok: false,
  mensaje: 'Su usuario no está vinculado a un entrenador. Si es administrador, indique ¿entrenador=<id>.'
});

// F1 - El entrenador ve sus clientes, con el estado de su membresia (solo lectura).
const obtenerMisClientes = async (req, res, next) => {
  try {
    const idEntrenador = resolverIdEntrenador(req);
    if (!idEntrenador) return sinEntrenador(res);

    const clientes = await EntrenadorModel.obtenerMisClientes(idEntrenador);
    res.json({ ok: true, total: clientes.length, clientes });
  } catch (error) {
    next(error);
  }
};

// F2 - El entrenador ve solo sus rutinas.
const obtenerMisRutinas = async (req, res, next) => {
  try {
    const idEntrenador = resolverIdEntrenador(req);
    if (!idEntrenador) return sinEntrenador(res);

    const rutinas = await EntrenadorModel.obtenerMisRutinas(idEntrenador);
    res.json({ ok: true, total: rutinas.length, rutinas });
  } catch (error) {
    next(error);
  }
};

// F4 - Resumen para el panel del entrenador.
const obtenerEstadisticas = async (req, res, next) => {
  try {
    const idEntrenador = resolverIdEntrenador(req);
    if (!idEntrenador) return sinEntrenador(res);

    const estadisticas = await EntrenadorModel.obtenerEstadisticas(idEntrenador);
    res.json({ ok: true, estadisticas });
  } catch (error) {
    next(error);
  }
};

// Asigna un cliente a un entrenador. Solo el Administrador puede elegir a quien.
const asignarCliente = async (req, res, next) => {
  try {
    const { id_cliente } = req.body;
    if (!id_cliente) {
      return res.status(400).json({ ok: false, mensaje: 'El campo id_cliente es obligatorio.' });
    }

    const idEntrenador = req.usuario?.rol === 'Administrador' && req.body.id_entrenador
      ? req.body.id_entrenador
      : req.usuario?.id_entrenador;

    if (!idEntrenador) {
      return res.status(403).json({ ok: false, mensaje: 'Su usuario no está vinculado a un entrenador.' });
    }

    const entrenador = await EntrenadorModel.obtenerPorId(idEntrenador);
    if (!entrenador) {
      return res.status(404).json({ ok: false, mensaje: 'Entrenador no encontrado.' });
    }

    const asignado = await EntrenadorModel.asignarCliente(idEntrenador, id_cliente);
    if (!asignado) {
      return res.status(404).json({ ok: false, mensaje: 'Cliente no encontrado.' });
    }

    const cliente = await ClienteModel.obtenerPorId(id_cliente);
    res.json({ ok: true, mensaje: 'Cliente asignado correctamente.', cliente });
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

    if (req.body.estado !== undefined && !ESTADOS_VALIDOS.includes(req.body.estado)) {
      return res.status(400).json({ ok: false, mensaje: 'El estado debe ser "activo" o "inactivo".' });
    }

    const documentoExistente = await EntrenadorModel.obtenerPorDocumento(documento);
    if (documentoExistente) {
      return res.status(409).json({
        ok: false,
        mensaje: 'Ya existe un entrenador registrado con ese documento.'
      });
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

    const esAdmin = req.usuario?.rol === 'Administrador';

    // Se parte del registro actual para que un PUT parcial no borre campos ausentes.
    const datos = CAMPOS_EDITABLES.reduce((acc, campo) => {
      acc[campo] = existe[campo];
      if (req.body[campo] !== undefined) acc[campo] = req.body[campo];
      return acc;
    }, {});

    for (const campo of Object.keys(req.body)) {
      if (campo !== 'estado' && !CAMPOS_EDITABLES.includes(campo)) {
        return res.status(400).json({
          ok: false,
          mensaje: `El campo "${campo}" no se puede modificar por este endpoint.`
        });
      }
    }

    if (req.body.documento && req.body.documento !== existe.documento) {
      const documentoExistente = await EntrenadorModel.obtenerPorDocumento(req.body.documento);
      if (documentoExistente) {
        return res.status(409).json({
          ok: false,
          mensaje: 'Ya existe un entrenador registrado con ese documento.'
        });
      }
    }

    if (req.body.estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(req.body.estado)) {
        return res.status(400).json({ ok: false, mensaje: 'El estado debe ser "activo" o "inactivo".' });
      }
      if (!esAdmin) {
        return res.status(403).json({
          ok: false,
          mensaje: 'Solo un administrador puede activar o desactivar un entrenador.'
        });
      }
    }

    datos.estado = esAdmin && req.body.estado !== undefined ? req.body.estado : existe.estado;

    const actualizado = await EntrenadorModel.actualizar(id, datos);
    res.json({ ok: true, mensaje: 'Entrenador actualizado correctamente.', entrenador: actualizado });
  } catch (error) {
    next(error);
  }
};

const eliminarEntrenador = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existe = await EntrenadorModel.obtenerPorId(id);
    if (!existe) {
      return res.status(404).json({ ok: false, mensaje: 'Entrenador no encontrado.' });
    }

    const totalRutinas = await EntrenadorModel.contarRutinas(id);
    if (totalRutinas > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: `No se puede eliminar: el entrenador tiene ${totalRutinas} rutina(s) asignada(s). Reasignelas o elimínelas primero, porque al borrar al entrenador sus rutinas se borrarían en cascada.`
      });
    }

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
  obtenerMiPerfil,
  obtenerMisClientes,
  obtenerMisRutinas,
  obtenerEstadisticas,
  asignarCliente,
  crearEntrenador,
  actualizarEntrenador,
  eliminarEntrenador
};

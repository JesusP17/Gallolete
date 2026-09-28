const db = require('../config/database');

const esAdmin = usuario => usuario && usuario.rol === 'Administrador';

const mismo = (a, b) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);

// Solo el Administrador o el propio entrenador pueden modificar un registro de entrenador
const verificarEntrenadorPropio = (req, res, next) => {
  if (esAdmin(req.usuario)) return next();

  if (!mismo(req.usuario.id_entrenador, req.params.id)) {
    return res.status(403).json({
      ok: false,
      mensaje: 'Acceso denegado. Solo puede modificar su propio perfil de entrenador.'
    });
  }

  next();
};

// La rutina debe pertenecer al entrenador autenticado. El Administrador puede operar sobre cualquiera.
// Resuelve la rutina desde :id (rutina directa) o desde :id_rutina_ejercicio (subrecurso de ejercicios).
const verificarPropiedadRutina = async (req, res, next) => {
  try {
    if (esAdmin(req.usuario)) return next();

    const idRutinaEjercicio = req.params.id_rutina_ejercicio;
    let idRutina = req.params.id;

    if (!idRutina && idRutinaEjercicio) {
      const [filasEjercicio] = await db.query(
        'SELECT id_rutina FROM rutina_ejercicios WHERE id_rutina_ejercicio = ?',
        [idRutinaEjercicio]
      );
      if (!filasEjercicio[0]) {
        return res.status(404).json({ ok: false, mensaje: 'El ejercicio de la rutina no existe.' });
      }
      idRutina = filasEjercicio[0].id_rutina;
    }

    if (!idRutina) {
      return res.status(400).json({ ok: false, mensaje: 'No se pudo identificar la rutina de la operacion.' });
    }

    const [filas] = await db.query('SELECT id_entrenador FROM rutinas WHERE id_rutina = ?', [idRutina]);
    if (!filas[0]) {
      return res.status(404).json({ ok: false, mensaje: 'Rutina no encontrada.' });
    }

    if (!mismo(filas[0].id_entrenador, req.usuario.id_entrenador)) {
      return res.status(403).json({
        ok: false,
        mensaje: 'Acceso denegado. Esta rutina pertenece a otro entrenador.'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// El cliente debe estar asignado a este entrenador (vinculo directo o por rutina).
// El Administrador puede operar sobre cualquiera.
// El id del cliente puede venir en la ruta o en el cuerpo.
const verificarClientePropio = async (req, res, next) => {
  try {
    if (esAdmin(req.usuario)) return next();

    const idEntrenador = req.usuario.id_entrenador;
    if (!idEntrenador) {
      return res.status(403).json({ ok: false, mensaje: 'Su usuario no esta vinculado a un entrenador.' });
    }

    const idCliente = req.params.id_cliente || req.body?.id_cliente;
    if (!idCliente) {
      return res.status(400).json({ ok: false, mensaje: 'No se especifico el cliente.' });
    }

    const [filas] = await db.query(
      `SELECT 1 AS ok FROM clientes c
        WHERE c.id_cliente = ?
          AND ( c.id_entrenador = ?
                OR EXISTS (SELECT 1 FROM rutinas r
                            WHERE r.id_cliente = c.id_cliente AND r.id_entrenador = ?) )
        LIMIT 1`,
      [idCliente, idEntrenador, idEntrenador]
    );

    if (!filas[0]) {
      return res.status(403).json({
        ok: false,
        mensaje: 'Acceso denegado. Este cliente no esta asignado a usted.'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verificarEntrenadorPropio, verificarPropiedadRutina, verificarClientePropio };

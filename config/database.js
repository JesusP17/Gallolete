const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let useInMemoryFallback = false;
let checkDone = false;
const fallbackHabilitado = process.env.ENABLE_MEMORY_FALLBACK === 'true';

// Hashes reales para coincidir con CREDENCIALES_STAFF del frontend
const adminHash = bcrypt.hashSync('admin2026', 10);
const entrenadorHash = bcrypt.hashSync('entrenador2026', 10);
const recepcionHash = bcrypt.hashSync('recepcion2026', 10);
const clienteHash = bcrypt.hashSync('admin123', 10);

// Base de datos en memoria completa para modo fallback o demostración
const memoryData = {
  clientes: [
    { id_cliente: 1, documento: '1098765432', nombre: 'Jesus', apellido: 'Perez', fecha_nacimiento: '2000-01-01', genero: 'Masculino', telefono: '3000000000', correo: 'jesusp171@gmail.com', direccion: 'Cra 50 #79-155', estado: 'activo' }
  ],
  entrenadores: [
    { id_entrenador: 1, nombre: 'Carlos', apellido: 'Mendoza', documento: '91234567', telefono: '3157778899', correo: 'carlos@gallolete.com', especialidad: 'Musculación', horario: 'Mañana', estado: 'activo' }
  ],
  usuarios: [
    { id_usuario: 1, nombre_usuario: 'admin', correo: 'admin@gallolete.com', password: adminHash, rol: 'Administrador', id_cliente: null, id_entrenador: null, estado: 'activo' },
    { id_usuario: 2, nombre_usuario: 'carlos_entrenador', correo: 'carlos@gallolete.com', password: entrenadorHash, rol: 'Entrenador', id_cliente: null, id_entrenador: 1, estado: 'activo' },
    { id_usuario: 3, nombre_usuario: 'maria_recep', correo: 'maria@gallolete.com', password: recepcionHash, rol: 'Recepcionista', id_cliente: null, id_entrenador: null, estado: 'activo' },
    { id_usuario: 4, nombre_usuario: 'JesusP171', correo: 'jesusp171@gmail.com', password: clienteHash, rol: 'Cliente', id_cliente: 1, id_entrenador: null, estado: 'activo' }
  ],
  membresias: [
    { id_membresia: 1, id_cliente: 1, cliente_nombre: 'Jesus Perez', tipo: 'Mensual VIP', precio: 120000, fecha_inicio: '2026-09-01', fecha_fin: '2026-10-30', estado: 'activa' }
  ],
  pagos: [],
  rutinas: [
    { id_rutina: 1, id_cliente: 1, cliente_nombre: 'Jesus Perez', id_entrenador: 1, entrenador_nombre: 'Carlos Mendoza', nombre_rutina: 'Rutina Hipertrofia A', nivel: 'Intermedio', estado: 'activa' }
  ],
  ejercicios: [
    { id_ejercicio: 1, nombre: 'Press de Banca Plano', descripcion: 'Pectoral con barra', grupo_muscular: 'Pecho', nivel: 'Intermedio' },
    { id_ejercicio: 2, nombre: 'Sentadilla Libre con Barra', descripcion: 'Cuádriceps y glúteos', grupo_muscular: 'Pierna', nivel: 'Intermedio' }
  ]
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gallolete_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a MySQL:', process.env.DB_NAME || 'gallolete_db');
    connection.release();
  } catch (error) {
    if (fallbackHabilitado) {
      console.warn('⚡ MySQL no detectado. Modo base de datos en memoria activado (ENABLE_MEMORY_FALLBACK=true).');
      useInMemoryFallback = true;
    } else {
      console.error('❌ No se pudo conectar a MySQL. Verifique la base de datos o active ENABLE_MEMORY_FALLBACK=true en el .env.', error.message);
      process.exit(1);
    }
  } finally {
    checkDone = true;
  }
};

const connectionPromise = checkConnection();

// Adaptador dbWrapper para MySQL e In-Memory Fallback sin condiciones de carrera
const dbWrapper = {
  query: async (sql, params = []) => {
    if (!checkDone) {
      await connectionPromise;
    }

    if (!useInMemoryFallback) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        if (fallbackHabilitado && (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ENOTFOUND')) {
          console.warn('⚡ Fallo dinámico de conexión MySQL. Cambiando a modo base de datos en memoria.');
          useInMemoryFallback = true;
        } else {
          throw err;
        }
      }
    }

    const sqlUpper = sql.toUpperCase();

    // 1. USUARIOS
    if (sqlUpper.includes('INSERT INTO USUARIOS')) {
      const newId = memoryData.usuarios.length + 1;
      const newUsr = {
        id_usuario: newId,
        nombre_usuario: params[0],
        correo: params[1],
        password: params[2],
        rol: params[3] || 'Cliente',
        id_cliente: params[4] || null,
        id_entrenador: params[5] || null,
        estado: params[6] || 'activo'
      };
      memoryData.usuarios.push(newUsr);
      return [{ insertId: newId }];
    }

    if (sqlUpper.includes('FROM USUARIOS')) {
      if (sqlUpper.includes('WHERE U.CORREO =') || sqlUpper.includes('WHERE CORREO =') || sqlUpper.includes('NOMBRE_USUARIO =')) {
        const queryVal = (params[0] || '').toLowerCase();
        const found = memoryData.usuarios.find(u => 
          (u.correo && u.correo.toLowerCase() === queryVal) || 
          (u.nombre_usuario && u.nombre_usuario.toLowerCase() === queryVal)
        );
        return [found ? [found] : []];
      }

      if (sqlUpper.includes('WHERE U.ID_USUARIO =') || sqlUpper.includes('WHERE ID_USUARIO =')) {
        const found = memoryData.usuarios.find(u => u.id_usuario == params[0]);
        return [found ? [found] : []];
      }

      return [memoryData.usuarios];
    }

    // 2. CLIENTES
    if (sqlUpper.includes('INSERT INTO CLIENTES')) {
      const newId = memoryData.clientes.length + 1;
      const newCli = {
        id_cliente: newId,
        documento: params[0],
        nombre: params[1],
        apellido: params[2],
        fecha_nacimiento: params[3] || null,
        genero: params[4] || null,
        telefono: params[5] || null,
        correo: params[6] || null,
        direccion: params[7] || null,
        estado: params[8] || 'activo'
      };
      memoryData.clientes.push(newCli);
      return [{ insertId: newId }];
    }

    if (sqlUpper.includes('FROM CLIENTES')) {
      if (sqlUpper.includes('WHERE ID_CLIENTE =') || sqlUpper.includes('WHERE C.ID_CLIENTE =')) {
        const found = memoryData.clientes.find(c => c.id_cliente == params[0]);
        return [found ? [found] : []];
      }
      if (sqlUpper.includes('WHERE DOCUMENTO =')) {
        const found = memoryData.clientes.find(c => c.documento == params[0]);
        return [found ? [found] : []];
      }
      return [memoryData.clientes];
    }

    // 3. OTRAS TABLAS
    if (sqlUpper.includes('FROM MEMBRESIAS')) return [memoryData.membresias];
    if (sqlUpper.includes('FROM PAGOS')) return [memoryData.pagos];
    if (sqlUpper.includes('FROM RUTINAS')) return [memoryData.rutinas];
    if (sqlUpper.includes('FROM EJERCICIOS')) return [memoryData.ejercicios];
    if (sqlUpper.includes('FROM ENTRENADORES')) return [memoryData.entrenadores];

    if (sqlUpper.includes('INSERT INTO PAGOS')) {
      const newPag = { id_pago: memoryData.pagos.length + 1, valor: params[2], metodo_pago: params[3], referencia: params[4] };
      memoryData.pagos.push(newPag);
      return [{ insertId: newPag.id_pago }];
    }

    return [[]];
  }
};

module.exports = dbWrapper;

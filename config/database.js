const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let useInMemoryFallback = false;
const fallbackHabilitado = process.env.ENABLE_MEMORY_FALLBACK === 'true';

// Hash bcrypt real de 'admin123' para los usuarios de demostración del modo en memoria
const memoryDemoHash = bcrypt.hashSync('admin123', 10);

// Base de datos en memoria para cuando el servicio MySQL local esté apagado
const memoryData = {
  clientes: [
    { id_cliente: 1, documento: '1098765432', nombre: 'Jesus', apellido: 'Perez', nombre_usuario: 'JesusP171', fecha_nacimiento: '2000-01-01', genero: 'Masculino', telefono: '3000000000', correo: 'jesusp171@gmail.com', direccion: 'Cra 50 #79-155', estado: 'activo' }
  ],
  entrenadores: [
    { id_entrenador: 1, nombre: 'Carlos', apellido: 'Mendoza', documento: '91234567', telefono: '3157778899', correo: 'carlos@gallolete.com', especialidad: 'Musculación', horario: 'Mañana', estado: 'activo' }
  ],
  usuarios: [
    { id_usuario: 1, nombre_usuario: 'admin', correo: 'admin@gallolete.com', password: memoryDemoHash, rol: 'Administrador', id_cliente: null, id_entrenador: null, estado: 'activo' },
    { id_usuario: 2, nombre_usuario: 'carlos_entrenador', correo: 'carlos@gallolete.com', password: memoryDemoHash, rol: 'Entrenador', id_cliente: null, id_entrenador: 1, estado: 'activo' },
    { id_usuario: 3, nombre_usuario: 'maria_recep', correo: 'maria@gallolete.com', password: memoryDemoHash, rol: 'Recepcionista', id_cliente: null, id_entrenador: null, estado: 'activo' },
    { id_usuario: 4, nombre_usuario: 'JesusP171', correo: 'jesusp171@gmail.com', password: memoryDemoHash, rol: 'Cliente', id_cliente: 1, id_entrenador: null, estado: 'activo' }
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
  }
};

checkConnection();

// Wrapper de consultas: el modo en memoria solo se activa al arrancar y si está habilitado por variable de entorno
const dbWrapper = {
  query: async (sql, params = []) => {
    if (!useInMemoryFallback) {
      return await pool.query(sql, params);
    }

    // Adaptador In-Memory
    const sqlUpper = sql.toUpperCase();

    if (sqlUpper.includes('FROM USUARIOS')) {
      if (sqlUpper.includes('WHERE U.CORREO =') || sqlUpper.includes('NOMBRE_USUARIO =')) {
        const queryVal = (params[0] || '').toLowerCase();
        const found = memoryData.usuarios.find(u => u.correo.toLowerCase() === queryVal || u.nombre_usuario.toLowerCase() === queryVal);
        return [[found || null]];
      }
      return [memoryData.usuarios];
    }

    if (sqlUpper.includes('FROM CLIENTES')) {
      if (sqlUpper.includes('WHERE ID_CLIENTE =')) {
        const found = memoryData.clientes.find(c => c.id_cliente == params[0]);
        return [[found || null]];
      }
      return [memoryData.clientes];
    }

    if (sqlUpper.includes('FROM MEMBRESIAS')) {
      return [memoryData.membresias];
    }

    if (sqlUpper.includes('FROM PAGOS')) {
      return [memoryData.pagos];
    }

    if (sqlUpper.includes('FROM RUTINAS')) {
      return [memoryData.rutinas];
    }

    if (sqlUpper.includes('FROM EJERCICIOS')) {
      return [memoryData.ejercicios];
    }

    if (sqlUpper.includes('FROM ENTRENADORES')) {
      return [memoryData.entrenadores];
    }

    if (sqlUpper.includes('INSERT INTO CLIENTES')) {
      const newCli = { id_cliente: memoryData.clientes.length + 1, nombre: params[1], apellido: params[2], estado: 'activo' };
      memoryData.clientes.push(newCli);
      return [{ insertId: newCli.id_cliente }];
    }

    if (sqlUpper.includes('INSERT INTO PAGOS')) {
      const newPag = { id_pago: memoryData.pagos.length + 1, valor: params[2], metodo_pago: params[3], referencia: params[4] };
      memoryData.pagos.push(newPag);
      return [{ insertId: newPag.id_pago }];
    }

    return [[]];
  }
};

module.exports = dbWrapper;

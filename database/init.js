const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function inicializarBaseDeDatos() {
  console.log('🔄 Iniciando creación e inicialización de la Base de Datos...');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306'),
    multipleStatements: true
  };

  try {
    // 1. Conectar a MySQL sin especificar base de datos
    const connection = await mysql.createConnection(dbConfig);
    console.log('📡 Conectado al servidor MySQL.');

    // 2. Leer y ejecutar schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🛠️ Creando base de datos `gallolete_db` y tablas...');
    await connection.query(schemaSql);
    console.log('✅ Base de datos y tablas creadas exitosamente.');

    // 3. Leer y ejecutar seed.sql para insertar datos iniciales
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Insertando datos de prueba (Seed)...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('✅ Datos de prueba insertados con éxito.');
    }

    await connection.end();
    console.log('🎉 ¡Base de datos completamente lista para el Registro de Clientes!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    console.error('💡 Verifica que el servicio MySQL (XAMPP, WAMP, MySQL Server) esté en ejecución y los datos en .env sean correctos.');
    process.exit(1);
  }
}

inicializarBaseDeDatos();

const mysql = require('mysql2/promise');
require('dotenv').config();

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

const fs = require('fs');
const path = require('path');

// Función para verificar la conexión inicial y auto-crear la BD si no existe
const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a la base de datos MySQL:', process.env.DB_NAME || 'gallolete_db');
    connection.release();
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR' || error.errno === 1049) {
      console.log('⚠️ La base de datos no existe. Intentando crearla automáticamente...');
      try {
        const rootConnection = await mysql.createConnection({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          port: parseInt(process.env.DB_PORT || '3306'),
          multipleStatements: true
        });

        const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
        await rootConnection.query(schemaSql);

        const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
        if (fs.existsSync(seedPath)) {
          const seedSql = fs.readFileSync(seedPath, 'utf8');
          await rootConnection.query(seedSql);
        }

        await rootConnection.end();
        console.log('🎉 Base de datos `gallolete_db` creada e inicializada con éxito.');
      } catch (initErr) {
        console.error('❌ Error al crear la base de datos automáticamente:', initErr.message);
      }
    } else {
      console.error('❌ Error al conectar con MySQL:', error.message);
      console.error('💡 Asegúrate de haber iniciado el servicio MySQL (XAMPP / MySQL Server).');
    }
  }
};

checkConnection();

module.exports = pool;

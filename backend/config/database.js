const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
  charset: 'utf8mb4',
});

(async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log(`✅ MySQL connecté — Base : ${process.env.DB_NAME}`);
  } catch (error) {
    console.error('❌ Échec connexion MySQL :', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
})();

module.exports = pool;
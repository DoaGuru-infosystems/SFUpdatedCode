const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'sf',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Letters DB Pool Connected. DB Name:', connection.config.database);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Letters DB Pool Connection Error:', err);
  });

module.exports = pool;

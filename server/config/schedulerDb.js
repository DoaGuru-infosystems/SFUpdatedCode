// Scheduler Plugin - DB Pool (mysql2/promise) for SF backend
// Uses same DB credentials as main SF backend (dilkeris_sf_new)
const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

const schedulerPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'dilkeris_sf_new',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00'
});

const schedulerQuery = async (sql, params = []) => {
  try {
    const [rows] = await schedulerPool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('[Scheduler DB] Query error:', error.message);
    throw error;
  }
};

module.exports = { schedulerPool, schedulerQuery };

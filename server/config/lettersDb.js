const mysql = require('mysql');
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

// Wrap pool.query to return a Promise that resolves to [results, fields] for compatibility with async/await destructuring
const originalQuery = pool.query.bind(pool);
pool.query = (sql, values) => {
  return new Promise((resolve, reject) => {
    const callback = (err, results, fields) => {
      if (err) return reject(err);
      resolve([results, fields]);
    };
    if (values === undefined) {
      originalQuery(sql, callback);
    } else {
      originalQuery(sql, values, callback);
    }
  });
};

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Letters DB Pool Connection Error:', err);
  } else {
    console.log('✅ Letters DB Pool Connected. DB Name:', connection.config?.database || 'sf');
    connection.release();
  }
});

module.exports = pool;

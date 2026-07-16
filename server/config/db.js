const mysql = require("mysql");
const dotenv = require("dotenv");
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
  database: process.env.DB_NAME || "dilkeris_sf_new",
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

// Connect to the databases
db.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to db1 (Pool):", err);
  } else {
    console.log("Connected to db1 (Pool)! DB Name:", connection.config?.database || (db.config && db.config.connectionConfig && db.config.connectionConfig.database));
    connection.release();
  }
});

module.exports = { db };

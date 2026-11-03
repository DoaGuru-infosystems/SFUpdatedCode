/**
 * run_003_migration.js
 * Executes 003_task_owners_assignment.sql against the configured MySQL DB.
 * Usage:  node server/sql/migrations/run_003_migration.js
 */

const path   = require("path");
const fs     = require("fs");
const mysql  = require("mysql");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const db = mysql.createConnection({
  host     : process.env.DB_HOST     || "localhost",
  user     : process.env.DB_USER     || "root",
  password : process.env.DB_PASSWORD || "",
  database : process.env.DB_NAME     || "dilkeris_sf",
  multipleStatements: true,
});

const sqlFile = path.join(__dirname, "003_task_owners_assignment.sql");
const sql     = fs.readFileSync(sqlFile, "utf8");

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to", process.env.DB_NAME || "dilkeris_sf");

  db.query(sql, (err) => {
    if (err) {
      console.error("❌ Migration failed:", err.message);
      db.end();
      process.exit(1);
    }
    console.log("✅ Migration 003 applied successfully.");
    console.log("   task_owners columns verified/updated: employee_id, assigned_by, deadline, status");
    db.end(() => process.exit(0));
  });
});


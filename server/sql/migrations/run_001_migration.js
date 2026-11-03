/**
 * run_001_migration.js
 * Executes 001_re_integration_tables.sql against the configured MySQL DB.
 * Usage:  node server/sql/migrations/run_001_migration.js
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
  multipleStatements: true,        // needed to run the full SQL file at once
});

const sqlFile = path.join(__dirname, "001_re_integration_tables.sql");
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
    console.log("✅ Migration 001 applied successfully.");
    console.log("   Tables created (if not already present):");
    console.log("     - re_synced_projects");
    console.log("     - project_owners");
    console.log("     - task_owners");
    db.end(() => process.exit(0));
  });
});


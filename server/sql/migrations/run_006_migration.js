/**
 * run_006_migration.js
 * Adds re_proforma_number column to re_synced_projects if it does not already exist.
 * Usage: node server/sql/migrations/run_006_migration.js
 */

const path = require("path");
const fs = require("fs");
const mysql = require("mysql");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dilkeris_sf",
  multipleStatements: true,
});

const sqlFile = path.join(__dirname, "006_add_re_proforma_number.sql");
const sql = fs.readFileSync(sqlFile, "utf8");

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to", process.env.DB_NAME || "dilkeris_sf");

  db.query(sql, (qErr) => {
    if (qErr) {
      console.error("❌ Migration failed:", qErr.message);
      db.end();
      process.exit(1);
    }

    db.query("DESCRIBE re_synced_projects", (dErr, rows) => {
      if (dErr) {
        console.error("❌ Failed to verify columns:", dErr.message);
      } else {
        const hasCol = rows.some((r) => r.Field === "re_proforma_number");
        console.log("✅ Migration 006 applied successfully.");
        console.log(`   re_synced_projects.re_proforma_number present: ${hasCol}`);
      }
      db.end(() => process.exit(0));
    });
  });
});


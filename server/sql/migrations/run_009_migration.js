/**
 * Runs migration 009 against the configured MySQL database.
 * Usage: node server/sql/migrations/run_009_migration.js
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

const sqlFile = path.join(__dirname, "009_project_updated_service_items.sql");
const statements = fs.readFileSync(sqlFile, "utf8")
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);
const columnsStatement = statements.find((statement) => statement.includes("ADD COLUMN IF NOT EXISTS"));
const indexStatement = statements.find((statement) => statement.includes("ADD UNIQUE KEY"));

db.connect((connectErr) => {
  if (connectErr) {
    console.error("Migration 009 connection failed:", connectErr.message);
    process.exit(1);
  }

  if (!columnsStatement || !indexStatement) {
    console.error("Migration 009 SQL is missing a required statement.");
    return db.end(() => process.exit(1));
  }

  db.query(columnsStatement, (columnsErr) => {
    if (columnsErr) {
      console.error("Migration 009 column update failed:", columnsErr.message);
      return db.end(() => process.exit(1));
    }

    db.query(
      "SHOW INDEX FROM task_owners WHERE Key_name = 'uq_task_owners_project_re_item'",
      (indexErr, indexes) => {
        if (indexErr) {
          console.error("Migration 009 index check failed:", indexErr.message);
          return db.end(() => process.exit(1));
        }

        if (indexes.length > 0) {
          const columns = indexes
            .slice()
            .sort((left, right) => left.Seq_in_index - right.Seq_in_index)
            .map((index) => index.Column_name);
          const isExpectedIndex = indexes.every((index) => Number(index.Non_unique) === 0) &&
            columns.join(",") === "project_id,re_item_id";
          if (!isExpectedIndex) {
            console.error("Migration 009 found an incompatible index with the expected name.");
            return db.end(() => process.exit(1));
          }
          console.log("Migration 009 schema is already present.");
          return db.end(() => process.exit(0));
        }

        db.query(indexStatement, (indexCreateErr) => {
          if (indexCreateErr) {
            console.error("Migration 009 index creation failed:", indexCreateErr.message);
            return db.end(() => process.exit(1));
          }
          console.log("Migration 009 applied successfully.");
          db.end(() => process.exit(0));
        });
      }
    );
  });
});

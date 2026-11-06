const { db } = require("../../config/db");

async function runMigration() {
  console.log("Running Migration 008: Add entry_status to tasks table...");

  const checkColumnSql = "SHOW COLUMNS FROM tasks LIKE 'entry_status'";
  db.query(checkColumnSql, (chkErr, rows) => {
    if (chkErr) {
      console.error("❌ Error checking entry_status column:", chkErr.message);
      process.exit(1);
    }

    if (rows && rows.length > 0) {
      console.log("ℹ️  Column entry_status already exists in tasks table.");
      process.exit(0);
    }

    const alterSql = "ALTER TABLE tasks ADD COLUMN entry_status VARCHAR(50) DEFAULT NULL AFTER task_owners_id";
    db.query(alterSql, (alterErr) => {
      if (alterErr) {
        console.error("❌ Error adding entry_status column:", alterErr.message);
        process.exit(1);
      }
      console.log("✅ Column entry_status added to tasks table successfully.");
      process.exit(0);
    });
  });
}

runMigration().catch((e) => {
  console.error("Migration fatal error:", e);
  process.exit(1);
});


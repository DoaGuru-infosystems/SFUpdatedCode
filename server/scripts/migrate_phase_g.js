const { db } = require("../config/db");

async function migrate() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS re_project_departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      department_id INT NOT NULL,
      assigned_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_proj_dept (project_id, department_id),
      KEY idx_rpd_project (project_id),
      KEY idx_rpd_dept (department_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await new Promise((res, rej) => db.query(createTableSql, (err) => err ? rej(err) : res()));
  console.log("✅ re_project_departments table ready.");

  // Check columns in task_owners
  const cols = await new Promise((res, rej) => db.query("SHOW COLUMNS FROM task_owners LIKE 'assigned_by_gm'", (err, r) => err ? rej(err) : res(r)));
  if (!cols || cols.length === 0) {
    await new Promise((res, rej) => db.query("ALTER TABLE task_owners ADD COLUMN assigned_by_gm TINYINT(1) DEFAULT 0", (err) => err ? rej(err) : res()));
    console.log("✅ task_owners.assigned_by_gm column added.");
  } else {
    console.log("ℹ️ task_owners.assigned_by_gm column exists.");
  }

  // Check columns in project_owners
  const pCols = await new Promise((res, rej) => db.query("SHOW COLUMNS FROM project_owners LIKE 'assigned_by_gm'", (err, r) => err ? rej(err) : res(r)));
  if (!pCols || pCols.length === 0) {
    await new Promise((res, rej) => db.query("ALTER TABLE project_owners ADD COLUMN assigned_by_gm TINYINT(1) DEFAULT 0", (err) => err ? rej(err) : res()));
    console.log("✅ project_owners.assigned_by_gm column added.");
  } else {
    console.log("ℹ️ project_owners.assigned_by_gm column exists.");
  }

  process.exit(0);
}

migrate().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});


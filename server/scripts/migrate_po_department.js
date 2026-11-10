const mysql = require('../node_modules/mysql2/promise');
require('../node_modules/dotenv').config({ path: './server/.env' });

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dilkeris_sf',
    port: process.env.DB_PORT || 3306
  });

  console.log('--- Starting PO Department Scoping Migration ---');

  // 1. Check existing columns of project_owners
  const [cols] = await pool.query("SHOW COLUMNS FROM project_owners LIKE 'department_id'");
  if (cols.length === 0) {
    console.log("1. Adding column 'department_id' (NULL initially)...");
    await pool.query("ALTER TABLE project_owners ADD COLUMN department_id INT NULL AFTER employee_id");
  } else {
    console.log("1. Column 'department_id' already exists.");
  }

  // 2. Populate department_id for existing rows
  console.log("2. Populating department_id based on employee's department...");
  const [updateRes] = await pool.query(`
    UPDATE project_owners po
    JOIN task_users u ON po.employee_id = u.id
    JOIN departments d ON LOWER(TRIM(u.department)) = LOWER(TRIM(d.name))
    SET po.department_id = d.id
    WHERE po.department_id IS NULL
  `);
  console.log(`Updated ${updateRes.affectedRows} row(s).`);

  // 3. Verify no rows with NULL department_id remain
  const [nullRows] = await pool.query("SELECT * FROM project_owners WHERE department_id IS NULL");
  if (nullRows.length > 0) {
    console.warn("⚠️ Warning: Some rows still have NULL department_id:", nullRows);
    await pool.query(`
      UPDATE project_owners po
      JOIN re_project_departments rpd ON po.project_id = rpd.project_id
      SET po.department_id = rpd.department_id
      WHERE po.department_id IS NULL
    `);
  }

  const [verifyNull] = await pool.query("SELECT count(*) as count FROM project_owners WHERE department_id IS NULL");
  console.log("Rows with NULL department_id:", verifyNull[0].count);

  // 4. Modify department_id to NOT NULL
  console.log("3. Modifying department_id to INT NOT NULL...");
  await pool.query("ALTER TABLE project_owners MODIFY COLUMN department_id INT NOT NULL");

  // 5. Update UNIQUE constraint: drop fk_po_project if needed, drop uq_proj_emp, add uq_proj_dept, re-add fk_po_project
  const [indexes] = await pool.query("SHOW INDEXES FROM project_owners");
  const indexNames = new Set(indexes.map(i => i.Key_name));

  if (indexNames.has('uq_proj_emp')) {
    console.log("4. Dropping fk_po_project to allow dropping uq_proj_emp...");
    try {
      await pool.query("ALTER TABLE project_owners DROP FOREIGN KEY fk_po_project");
    } catch (e) {
      console.log("Note on drop fk_po_project:", e.message);
    }

    console.log("5. Dropping old UNIQUE KEY uq_proj_emp...");
    await pool.query("ALTER TABLE project_owners DROP INDEX uq_proj_emp");

    console.log("6. Adding new UNIQUE KEY uq_proj_dept (project_id, department_id)...");
    await pool.query("ALTER TABLE project_owners ADD UNIQUE KEY uq_proj_dept (project_id, department_id)");

    console.log("7. Re-adding fk_po_project -> projects(id)...");
    await pool.query("ALTER TABLE project_owners ADD CONSTRAINT fk_po_project FOREIGN KEY (project_id) REFERENCES projects (id)");
  } else if (!indexNames.has('uq_proj_dept')) {
    console.log("Adding new UNIQUE KEY uq_proj_dept (project_id, department_id)...");
    await pool.query("ALTER TABLE project_owners ADD UNIQUE KEY uq_proj_dept (project_id, department_id)");
  }

  // 8. Add Foreign Key for department_id -> departments(id)
  const [fks] = await pool.query(`
    SELECT CONSTRAINT_NAME
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'project_owners'
      AND CONSTRAINT_NAME = 'fk_po_department'
  `);

  if (fks.length === 0) {
    console.log("8. Adding foreign key fk_po_department -> departments(id)...");
    await pool.query("ALTER TABLE project_owners ADD CONSTRAINT fk_po_department FOREIGN KEY (department_id) REFERENCES departments(id)");
  }

  // Final check
  const [finalCols] = await pool.query("DESCRIBE project_owners");
  const [finalIndexes] = await pool.query("SHOW INDEXES FROM project_owners");
  const [finalRows] = await pool.query(`
    SELECT po.*, d.name as dept_name, u.full_name as emp_name
    FROM project_owners po
    JOIN departments d ON po.department_id = d.id
    JOIN task_users u ON po.employee_id = u.id
  `);

  console.log("\n=== Final project_owners Table Definition ===");
  console.table(finalCols);
  console.log("\n=== Final Indexes ===");
  console.table(finalIndexes);
  console.log("\n=== Current Rows in project_owners ===");
  console.table(finalRows);

  console.log("\n✅ Migration completed successfully!");
  await pool.end();
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

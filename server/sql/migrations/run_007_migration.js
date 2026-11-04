/**
 * run_007_migration.js
 * Creates `departments` table, seeds normalized distinct departments from task_users,
 * and auto-links single-TL matches while flagging conflicts as unassigned.
 *
 * Usage: node server/sql/migrations/run_007_migration.js
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

const sqlFile = path.join(__dirname, "007_create_departments_table.sql");
const sql = fs.readFileSync(sqlFile, "utf8");

function query(sqlStr, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sqlStr, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function normalizeDepartmentName(dept) {
  if (!dept) return "";
  const trimmed = dept.trim();
  if (trimmed.toLowerCase() === "seo") return "SEO";
  if (trimmed.toLowerCase() === "hr") return "HR";
  if (trimmed.toLowerCase() === "dm") return "Digital Marketing";
  if (trimmed === trimmed.toLowerCase()) {
    return trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return trimmed;
}

async function run() {
  try {
    console.log("==================================================");
    console.log("🚀 Starting Migration 007: Formal Departments Table");
    console.log("==================================================");

    // 1. Run Table Creation DDL
    console.log("\n[Step 1] Creating departments table...");
    await query(sql);
    console.log("✅ departments table created (or already exists).");

    // 2. Fetch distinct departments from task_users
    console.log("\n[Step 2] Fetching distinct departments from task_users...");
    const rawDepts = await query(
      "SELECT DISTINCT department FROM task_users WHERE department IS NOT NULL AND TRIM(department) != ''"
    );
    console.log("Raw departments found in task_users:", rawDepts.map((r) => r.department));

    // Normalize and deduplicate
    const normalizedMap = new Map(); // normalizedName -> rawNames[]
    for (const row of rawDepts) {
      const norm = normalizeDepartmentName(row.department);
      if (norm) {
        if (!normalizedMap.has(norm)) {
          normalizedMap.set(norm, []);
        }
        normalizedMap.get(norm).push(row.department);
      }
    }

    const uniqueNormalizedDepts = Array.from(normalizedMap.keys());
    console.log("Normalized distinct departments to seed:", uniqueNormalizedDepts);

    // 3. Seed into departments table (strict_deadline_tracking = 1)
    for (const name of uniqueNormalizedDepts) {
      const existing = await query("SELECT id FROM departments WHERE name = ?", [name]);
      if (existing.length === 0) {
        await query(
          "INSERT INTO departments (name, strict_deadline_tracking) VALUES (?, 1)",
          [name]
        );
        console.log(`  ➕ Inserted department: "${name}" (strict_deadline_tracking=1)`);
      } else {
        console.log(`  ℹ️ Department already exists in table: "${name}" (id: ${existing[0].id})`);
      }
    }

    // 4. Fetch all team leads from task_users
    console.log("\n[Step 3] Evaluating Team Leads for auto-linking...");
    const tls = await query(
      "SELECT id, full_name, email_id, role, department FROM task_users WHERE role = 'team_lead'"
    );
    console.log(`Found ${tls.length} team lead(s) in task_users:`);
    tls.forEach((tl) => {
      console.log(`  • ID: ${tl.id} | Name: "${tl.full_name.trim()}" | Dept: "${tl.department}"`);
    });

    // 5. Match TLs to departments
    const allDepartments = await query("SELECT id, name, tl_employee_id, strict_deadline_tracking FROM departments");
    const linkResults = [];

    for (const dept of allDepartments) {
      // Find all TLs whose department matches this department name case-insensitively
      const matchingTls = tls.filter((tl) => {
        if (!tl.department) return false;
        const normTlDept = normalizeDepartmentName(tl.department);
        return (
          normTlDept.toLowerCase() === dept.name.toLowerCase() ||
          tl.department.trim().toLowerCase() === dept.name.toLowerCase()
        );
      });

      if (matchingTls.length === 1) {
        const singleTl = matchingTls[0];
        await query("UPDATE departments SET tl_employee_id = ? WHERE id = ?", [singleTl.id, dept.id]);
        linkResults.push({
          department: dept.name,
          status: "ASSIGNED",
          tl_id: singleTl.id,
          tl_name: singleTl.full_name.trim(),
          notes: "Single clear TL match found.",
        });
        console.log(`  ✅ Assigned TL for "${dept.name}": ${singleTl.full_name.trim()} (ID: ${singleTl.id})`);
      } else if (matchingTls.length > 1) {
        // CONFLICT: multiple TLs found
        // Per rules: Leave tl_employee_id as NULL ("TL: unassigned") and report conflict
        await query("UPDATE departments SET tl_employee_id = NULL WHERE id = ?", [dept.id]);
        const conflictingNames = matchingTls.map((t) => `${t.full_name.trim()} (ID: ${t.id})`).join(", ");
        linkResults.push({
          department: dept.name,
          status: "CONFLICT_UNASSIGNED",
          tl_id: null,
          tl_name: null,
          notes: `Multiple TLs found: ${conflictingNames}. Left unassigned for manual resolution.`,
        });
        console.warn(`  ⚠️ CONFLICT for "${dept.name}": Found ${matchingTls.length} TLs (${conflictingNames}). Left unassigned.`);
      } else {
        // 0 matching TLs
        linkResults.push({
          department: dept.name,
          status: "NO_TL_UNASSIGNED",
          tl_id: null,
          tl_name: null,
          notes: "No team lead currently registered in this department.",
        });
        console.log(`  ℹ️ No TL found for "${dept.name}". Left unassigned.`);
      }
    }

    // 6. Final verification output
    console.log("\n[Step 4] Final departments table content:");
    const finalRows = await query(`
      SELECT 
        d.id,
        d.name,
        d.tl_employee_id,
        u.full_name AS tl_name,
        d.strict_deadline_tracking,
        d.created_at
      FROM departments d
      LEFT JOIN task_users u ON d.tl_employee_id = u.id
      ORDER BY d.id ASC
    `);
    console.table(finalRows.map(r => ({
      ID: r.id,
      Department: r.name,
      TL_ID: r.tl_employee_id || "NULL",
      TL_Name: r.tl_name ? r.tl_name.trim() : "(Unassigned)",
      Strict_Deadline_Tracking: Boolean(r.strict_deadline_tracking)
    })));

    console.log("\n==================================================");
    console.log("🎉 Migration 007 and Seeding Completed Successfully");
    console.log("==================================================");

    db.end(() => process.exit(0));
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    db.end(() => process.exit(1));
  }
}

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
  run();
});


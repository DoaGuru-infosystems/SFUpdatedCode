/**
 * clean_all_re_projects.js
 * Permanently removes all Revenue Engine projects, assignments, tasks, and history
 * from the Smart Factory database (dilkeris_sf) and optionally resets sync records
 * in Revenue Engine (revenue_engine).
 */

const { db } = require("../config/db");
const mysql = require("mysql");

function query(conn, sql, params = []) {
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function cleanSmartFactoryDB() {
  console.log("==================================================");
  console.log("🧹 [Smart Factory] Starting RE Projects Cleanup...");
  console.log("==================================================");

  // 1. Identify all RE projects
  const reProjects = await query(db, "SELECT id, project_id, re_proforma_id, re_proforma_number, client_name FROM re_synced_projects");
  console.log(`Found ${reProjects.length} RE project(s) in re_synced_projects:`);
  reProjects.forEach(p => console.log(`  - Project ID: ${p.project_id} (Proforma: ${p.re_proforma_number || '#' + p.re_proforma_id}, Client: "${p.client_name}")`));

  const projectIds = reProjects.map(p => p.project_id).filter(Boolean);

  if (projectIds.length === 0) {
    console.log("ℹ️ No RE projects found in Smart Factory database.");
    return { projectIds: [], deleted: {} };
  }

  // 2. Identify all task_owners for these projects
  const taskOwnerRows = await query(db, "SELECT id FROM task_owners WHERE project_id IN (?)", [projectIds]);
  const taskOwnerIds = taskOwnerRows.map(t => t.id);
  console.log(`Found ${taskOwnerIds.length} task(s) linked in task_owners.`);

  // 3. Perform atomic deletion in transaction
  return new Promise((resolve, reject) => {
    db.getConnection(async (connErr, connection) => {
      if (connErr) return reject(connErr);

      connection.beginTransaction(async (txErr) => {
        if (txErr) {
          connection.release();
          return reject(txErr);
        }

        try {
          const stats = {};

          // A. Delete from task_escalation_logs
          if (taskOwnerIds.length > 0) {
            const escRes = await query(connection, "DELETE FROM task_escalation_logs WHERE task_owners_id IN (?)", [taskOwnerIds]);
            stats.task_escalation_logs = escRes.affectedRows;
            console.log(`  ✓ Deleted ${escRes.affectedRows} row(s) from task_escalation_logs`);

            // B. Delete from tasks (daily employee progress logs)
            const tasksRes = await query(connection, "DELETE FROM tasks WHERE task_owners_id IN (?)", [taskOwnerIds]);
            stats.tasks = tasksRes.affectedRows;
            console.log(`  ✓ Deleted ${tasksRes.affectedRows} row(s) from tasks (daily progress logs)`);
          } else {
            stats.task_escalation_logs = 0;
            stats.tasks = 0;
          }

          // C. Delete from assignment_history
          const histRes = await query(connection, "DELETE FROM assignment_history WHERE project_id IN (?)", [projectIds]);
          stats.assignment_history = histRes.affectedRows;
          console.log(`  ✓ Deleted ${histRes.affectedRows} row(s) from assignment_history`);

          // D. Delete from task_owners
          const toRes = await query(connection, "DELETE FROM task_owners WHERE project_id IN (?)", [projectIds]);
          stats.task_owners = toRes.affectedRows;
          console.log(`  ✓ Deleted ${toRes.affectedRows} row(s) from task_owners`);

          // E. Delete from project_owners (PO assignments)
          const poRes = await query(connection, "DELETE FROM project_owners WHERE project_id IN (?)", [projectIds]);
          stats.project_owners = poRes.affectedRows;
          console.log(`  ✓ Deleted ${poRes.affectedRows} row(s) from project_owners`);

          // F. Delete from re_project_departments
          const deptRes = await query(connection, "DELETE FROM re_project_departments WHERE project_id IN (?)", [projectIds]);
          stats.re_project_departments = deptRes.affectedRows;
          console.log(`  ✓ Deleted ${deptRes.affectedRows} row(s) from re_project_departments`);

          // G. Delete from re_synced_projects
          const reSyncRes = await query(connection, "DELETE FROM re_synced_projects WHERE project_id IN (?)", [projectIds]);
          stats.re_synced_projects = reSyncRes.affectedRows;
          console.log(`  ✓ Deleted ${reSyncRes.affectedRows} row(s) from re_synced_projects`);

          // H. Delete from projects
          const projRes = await query(connection, "DELETE FROM projects WHERE id IN (?)", [projectIds]);
          stats.projects = projRes.affectedRows;
          console.log(`  ✓ Deleted ${projRes.affectedRows} row(s) from projects`);

          connection.commit((commitErr) => {
            if (commitErr) {
              return connection.rollback(() => {
                connection.release();
                reject(commitErr);
              });
            }
            connection.release();
            console.log("✅ [Smart Factory] All RE projects successfully purged from database!");
            resolve({ projectIds, stats });
          });
        } catch (err) {
          connection.rollback(() => {
            connection.release();
            reject(err);
          });
        }
      });
    });
  });
}

async function cleanRevenueEngineDB() {
  console.log("\n==================================================");
  console.log("🧹 [Revenue Engine] Checking revenue_engine database...");
  console.log("==================================================");

  return new Promise((resolve) => {
    const reConn = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "revenue_engine",
    });

    reConn.connect(async (connErr) => {
      if (connErr) {
        console.log(`ℹ️ [Revenue Engine] Database not accessible (${connErr.message}). Skipping RE sync tables.`);
        return resolve(null);
      }

      try {
        const syncTasksRes = await query(reConn, "DELETE FROM re_project_sync_tasks");
        console.log(`  ✓ Deleted ${syncTasksRes.affectedRows} row(s) from re_project_sync_tasks`);

        const syncRes = await query(reConn, "DELETE FROM re_project_sync");
        console.log(`  ✓ Deleted ${syncRes.affectedRows} row(s) from re_project_sync`);

        console.log("✅ [Revenue Engine] Sync records cleared. Proformas are now unassigned in RE.");
        reConn.end();
        resolve({
          re_project_sync_tasks: syncTasksRes.affectedRows,
          re_project_sync: syncRes.affectedRows,
        });
      } catch (err) {
        console.error("⚠️ [Revenue Engine] Error clearing sync tables:", err.message);
        reConn.end();
        resolve(null);
      }
    });
  });
}

async function run() {
  try {
    const sfResult = await cleanSmartFactoryDB();
    const reResult = await cleanRevenueEngineDB();

    console.log("\n==================================================");
    console.log("🎉 CLEANUP COMPLETE SUMMARY");
    console.log("==================================================");
    console.log("Smart Factory DB (dilkeris_sf):", sfResult.stats);
    if (reResult) {
      console.log("Revenue Engine DB (revenue_engine):", reResult);
    }
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal Cleanup Error:", err);
    process.exit(1);
  }
}

run();


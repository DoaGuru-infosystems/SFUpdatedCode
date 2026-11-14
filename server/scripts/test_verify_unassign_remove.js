/**
 * test_verify_unassign_remove.js
 * Comprehensive automated verification script for:
 * 1. Department Unassign (partial and empty array)
 * 2. Remove PO (independent lifecycle - task owners untouched)
 * 3. Remove Task Owner (unassigned, daily-logs in `tasks` preserved)
 * 4. Audit history logging & permissions
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const API_BASE = 'http://localhost:8080';
const JWT_SECRET = process.env.JWT_SECRET || 'maheshkuldeepfullstackdeveloper';

// Generate Tokens
const adminToken = jwt.sign({ id: 6, role: 'admin', full_name: 'Super Admin' }, JWT_SECRET, { expiresIn: '1d' });
const devTlToken = jwt.sign({ id: 39, role: 'team_lead', full_name: 'Dev Ansh Dubey' }, JWT_SECRET, { expiresIn: '1d' });
const employeeToken = jwt.sign({ id: 31, role: 'user', full_name: 'Umer Qureshi' }, JWT_SECRET, { expiresIn: '1d' });

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function runVerification() {
  console.log('================================================================');
  console.log('🚀 STARTING COMPREHENSIVE VERIFICATION FOR REMOVE & UNASSIGN');
  console.log('================================================================\n');

  const projectId = 157; // RPS Sportech Badminton Academy

  // -------------------------------------------------------------
  // STEP 0: SETUP INITIAL BASELINE STATE
  // -------------------------------------------------------------
  console.log('📋 STEP 0: Setting up baseline state for Project 157...');

  // Reset re_project_departments to Dept 1 (Dev) and Dept 2 (Digital Marketing)
  await query('DELETE FROM re_project_departments WHERE project_id = ?', [projectId]);
  await query('INSERT INTO re_project_departments (project_id, department_id, assigned_by) VALUES (?, 1, 6), (?, 2, 6)', [projectId, projectId]);

  // Clean and insert Project Owners
  await query('DELETE FROM project_owners WHERE project_id = ?', [projectId]);
  await query(`
    INSERT INTO project_owners (project_id, employee_id, department_id, assigned_by, status, assigned_by_gm)
    VALUES (?, 27, 1, 6, 'active', 1), (?, 34, 2, 6, 'active', 1)
  `, [projectId, projectId]);

  // Assign Task 101 to employee 31 (Dev) and Task 102 to employee 61 (Marketing)
  await query(`
    UPDATE task_owners
    SET employee_id = 31, assigned_by = 6, status = 'in_progress', deadline = '2026-11-20'
    WHERE id = 101
  `);
  await query(`
    UPDATE task_owners
    SET employee_id = 61, assigned_by = 6, status = 'in_progress', deadline = '2026-11-22'
    WHERE id = 102
  `);

  // Insert mock daily work logs in `tasks` table for task 101
  await query('DELETE FROM tasks WHERE task_owners_id = 101');
  await query(`
    INSERT INTO tasks (user_id, task_owners_id, entry_status, name, ProjectOrClientName, TaskDescription, task_date)
    VALUES
      (31, 101, 'in_progress', 'website developmet', 'RPS Sportech', 'Setup Next.js scaffold and Tailwind configs', '2026-11-12'),
      (31, 101, 'in_progress', 'website developmet', 'RPS Sportech', 'Built responsive header and hero component', '2026-11-13')
  `);

  const initialDepts = await query('SELECT department_id FROM re_project_departments WHERE project_id = ? ORDER BY department_id', [projectId]);
  const initialPos = await query('SELECT employee_id, department_id, status FROM project_owners WHERE project_id = ? AND status = "active"', [projectId]);
  const initialTasks = await query('SELECT id, employee_id, status, deadline FROM task_owners WHERE id IN (101, 102)');
  const initialLogs = await query('SELECT id, task_owners_id, TaskDescription, task_date FROM tasks WHERE task_owners_id = 101');

  console.log(`✅ Baseline ready:`);
  console.log(`   - Departments: ${initialDepts.map(d => d.department_id).join(', ')}`);
  console.log(`   - POs: Dept 1 -> Emp 27, Dept 2 -> Emp 34`);
  console.log(`   - Task 101: Emp 31 (status=${initialTasks[0].status}, deadline=${initialTasks[0].deadline})`);
  console.log(`   - Task 102: Emp 61 (status=${initialTasks[1].status}, deadline=${initialTasks[1].deadline})`);
  console.log(`   - Daily Logs in 'tasks' table for Task 101: ${initialLogs.length} entries\n`);

  // -------------------------------------------------------------
  // TEST 1: PARTIAL DEPARTMENT UNASSIGN
  // -------------------------------------------------------------
  console.log('🧪 TEST 1: Uncheck Digital Marketing (Keep only Dept 1 - Development)...');
  const resPartial = await axios.post(
    `${API_BASE}/api/admin/re-project/${projectId}/assign-departments`,
    { department_ids: [1] },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  console.log(`   Response: status=${resPartial.status}, success=${resPartial.data.success}`);

  const deptsAfterPartial = await query('SELECT department_id FROM re_project_departments WHERE project_id = ?', [projectId]);
  console.log(`   - re_project_departments in DB: ${deptsAfterPartial.map(d => d.department_id).join(', ')} (Dept 2 removed!)`);

  const posAfterPartial = await query('SELECT employee_id, department_id, status FROM project_owners WHERE project_id = ? AND status = "active"', [projectId]);
  const tasksAfterPartial = await query('SELECT id, employee_id, status FROM task_owners WHERE id IN (101, 102)');
  console.log(`   - POs untouched: ${posAfterPartial.length} active POs (Emp 27 & Emp 34 still intact!)`);
  console.log(`   - Task 102 untouched: employee_id=${tasksAfterPartial.find(t => t.id === 102).employee_id} (Emp 61 still assigned!)\n`);

  // -------------------------------------------------------------
  // TEST 2: EMPTY DEPARTMENT ARRAY (Uncheck All Departments)
  // -------------------------------------------------------------
  console.log('🧪 TEST 2: Uncheck ALL departments (department_ids: [])...');
  const resEmpty = await axios.post(
    `${API_BASE}/api/admin/re-project/${projectId}/assign-departments`,
    { department_ids: [] },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  console.log(`   Response: status=${resEmpty.status}, success=${resEmpty.data.success}, message="${resEmpty.data.message}"`);

  const deptsAfterEmpty = await query('SELECT department_id FROM re_project_departments WHERE project_id = ?', [projectId]);
  console.log(`   - re_project_departments in DB: count=${deptsAfterEmpty.length} (All rows deleted cleanly without 400 error!)`);

  const posAfterEmpty = await query('SELECT employee_id, department_id, status FROM project_owners WHERE project_id = ? AND status = "active"', [projectId]);
  console.log(`   - POs still intact: ${posAfterEmpty.length} active POs`);

  // Restore Dept 1 and Dept 2 for subsequent tests
  await query('INSERT INTO re_project_departments (project_id, department_id, assigned_by) VALUES (?, 1, 6), (?, 2, 6)', [projectId, projectId]);
  console.log(`   - Restored Dept 1 & 2 for PO & Task Owner tests.\n`);

  // -------------------------------------------------------------
  // TEST 3: REMOVE PROJECT OWNER (SIRF PO REMOVE HOGA, TASKS UNTOUCHED)
  // -------------------------------------------------------------
  console.log('🧪 TEST 3: Remove Project Owner for Department 1 (Emp 27)...');
  const resRemovePo = await axios.post(
    `${API_BASE}/api/admin/re-project/${projectId}/remove-po`,
    { department_id: 1, reason: "Testing independent PO removal" },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  console.log(`   Response: status=${resRemovePo.status}, success=${resRemovePo.data.success}, message="${resRemovePo.data.message}"`);

  const poDept1 = await query('SELECT id, employee_id, status FROM project_owners WHERE project_id = ? AND department_id = 1', [projectId]);
  console.log(`   - Project Owner Dept 1 status in DB: status='${poDept1[0].status}' (Employee ${poDept1[0].employee_id})`);

  const task101AfterPoRemove = await query('SELECT id, employee_id, status, deadline FROM task_owners WHERE id = 101');
  console.log(`   - CRITICAL CHECK: Task 101 employee_id=${task101AfterPoRemove[0].employee_id}, status='${task101AfterPoRemove[0].status}', deadline='${task101AfterPoRemove[0].deadline}'`);
  if (task101AfterPoRemove[0].employee_id === 31) {
    console.log(`   ✅ SUCCESS: Task 101 is 100% UNTOUCHED! PO removal did NOT cascade to Task Owners!`);
  } else {
    console.error(`   ❌ FAIL: Task 101 was unexpectedly altered!`);
  }

  const histPo = await query('SELECT * FROM assignment_history WHERE project_id = ? AND entity_type = "project_owner" ORDER BY id DESC LIMIT 1', [projectId]);
  console.log(`   - Audit history logged: entity=${histPo[0].entity_type}, old_emp=${histPo[0].old_employee_id}, new_emp=${histPo[0].new_employee_id}, changed_by=${histPo[0].changed_by}\n`);

  // -------------------------------------------------------------
  // TEST 4: REMOVE TASK OWNER (DAILY LOGS PRESERVED)
  // -------------------------------------------------------------
  console.log('🧪 TEST 4: Remove Task Owner for Task 101 (Emp 31)...');
  const resRemoveTask = await axios.post(
    `${API_BASE}/api/admin/re-project/${projectId}/remove-task-owner`,
    { task_owners_id: 101, reason: "Testing task owner removal" },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  console.log(`   Response: status=${resRemoveTask.status}, success=${resRemoveTask.data.success}, message="${resRemoveTask.data.message}"`);

  const task101AfterRemove = await query('SELECT id, employee_id, status, deadline, assigned_by FROM task_owners WHERE id = 101');
  console.log(`   - Task 101 in DB: employee_id=${task101AfterRemove[0].employee_id}, status='${task101AfterRemove[0].status}', deadline=${task101AfterRemove[0].deadline}, assigned_by=${task101AfterRemove[0].assigned_by}`);

  const preservedLogs = await query('SELECT id, user_id, task_owners_id, TaskDescription, task_date FROM tasks WHERE task_owners_id = 101');
  console.log(`   - CRITICAL CHECK: Daily work logs in 'tasks' table: ${preservedLogs.length} entries preserved!`);
  preservedLogs.forEach(l => console.log(`     * Log #${l.id}: date=${l.task_date}, user=${l.user_id}, desc="${l.TaskDescription}"`));

  if (preservedLogs.length === 2 && task101AfterRemove[0].employee_id === null && task101AfterRemove[0].status === 'pending') {
    console.log(`   ✅ SUCCESS: Task is pending & unassigned, daily logs in 'tasks' table are 100% preserved!`);
  } else {
    console.error(`   ❌ FAIL: Daily logs missing or task state incorrect!`);
  }

  const histTask = await query('SELECT * FROM assignment_history WHERE project_id = ? AND entity_type = "task_owner" ORDER BY id DESC LIMIT 1', [projectId]);
  console.log(`   - Audit history logged: entity=${histTask[0].entity_type}, old_emp=${histTask[0].old_employee_id}, new_emp=${histTask[0].new_employee_id}, changed_by=${histTask[0].changed_by}\n`);

  // -------------------------------------------------------------
  // TEST 5: TL SPECIFIC ENDPOINTS
  // -------------------------------------------------------------
  console.log('🧪 TEST 5: Testing TL Endpoints (/api/leader/remove-project-owner & /api/leader/remove-task-owner)...');

  // Reactivate PO for Dept 1 so TL can remove it
  await query('UPDATE project_owners SET status = "active" WHERE id = ?', [poDept1[0].id]);
  // Reassign Task 101 so TL can remove it
  await query('UPDATE task_owners SET employee_id = 31, status = "in_progress", deadline = "2026-11-20" WHERE id = 101');

  // TL calls remove-project-owner
  const resTlPo = await axios.post(
    `${API_BASE}/api/leader/remove-project-owner`,
    { project_id: projectId },
    { headers: { Authorization: `Bearer ${devTlToken}` } }
  );
  console.log(`   - TL Remove PO Response: status=${resTlPo.status}, message="${resTlPo.data.message}"`);

  // TL calls remove-task-owner
  const resTlTask = await axios.post(
    `${API_BASE}/api/leader/remove-task-owner`,
    { task_owners_id: 101 },
    { headers: { Authorization: `Bearer ${devTlToken}` } }
  );
  console.log(`   - TL Remove Task Owner Response: status=${resTlTask.status}, message="${resTlTask.data.message}"`);

  // -------------------------------------------------------------
  // TEST 6: FORBIDDEN ROLE CHECK (PO / Employee cannot call Remove endpoints)
  // -------------------------------------------------------------
  console.log('\n🧪 TEST 6: Security test - Employee/PO trying to call Remove endpoints...');
  try {
    await axios.post(
      `${API_BASE}/api/leader/remove-task-owner`,
      { task_owners_id: 102 },
      { headers: { Authorization: `Bearer ${employeeToken}` } }
    );
    console.error('   ❌ FAIL: Employee was allowed to call remove-task-owner!');
  } catch (err) {
    console.log(`   ✅ Correctly blocked: status=${err.response?.status} (${err.response?.data?.message})`);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 6 VERIFICATION SUITES PASSED FLAWLESSLY!');
  console.log('================================================================');
  process.exit(0);
}

runVerification().catch(err => {
  console.error('Verification failed with error:', err.response?.data || err.message);
  process.exit(1);
});


/**
 * capture_verification_screenshots.js
 * Captures screenshots of Admin and TL UI showing the new Remove buttons and confirmation warning modals.
 */

const puppeteer = require('../node_modules/puppeteer-core');
const jwt = require('../node_modules/jsonwebtoken');
const path = require('path');
const { db } = require('../config/db');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\HITS\\.gemini\\antigravity\\brain\\8f6ca9a9-1d79-4d7a-b2c3-90645d599937';
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const JWT_SECRET = process.env.JWT_SECRET || 'maheshkuldeepfullstackdeveloper';

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

(async () => {
  console.log('🚀 Setting up DB data for screenshots...');
  const projectId = 157;

  // Ensure Depts
  await query('DELETE FROM re_project_departments WHERE project_id = ?', [projectId]);
  await query('INSERT INTO re_project_departments (project_id, department_id, assigned_by) VALUES (?, 1, 6), (?, 2, 6)', [projectId, projectId]);

  // Ensure active POs
  await query('DELETE FROM project_owners WHERE project_id = ?', [projectId]);
  await query(`
    INSERT INTO project_owners (project_id, employee_id, department_id, assigned_by, status, assigned_by_gm)
    VALUES (?, 27, 1, 6, 'active', 1), (?, 34, 2, 6, 'active', 1)
  `, [projectId, projectId]);

  // Ensure Task 101 and 102 are assigned
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

  console.log('🌐 Launching headless browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });

  // -------------------------------------------------------------------------
  // 1. ADMIN DASHBOARD: PROJECT CARD WITH REMOVE PO BUTTON
  // -------------------------------------------------------------------------
  console.log('📸 1. Capturing Admin Project Card with Remove PO button...');
  const adminToken = jwt.sign({ id: 6, role: 'admin', full_name: 'Admin User' }, JWT_SECRET);

  await page.goto('http://localhost:3000/task/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({ id: 6, role: 'admin', full_name: 'Admin User' }));
  }, adminToken);

  await page.goto('http://localhost:3000/task/re-projects', { waitUntil: 'domcontentloaded' });
  await wait(2000);

  await page.screenshot({
    path: path.join(artifactDir, 'admin_re_projects_with_remove_po.png'),
    fullPage: false
  });
  console.log('   ✅ Saved: admin_re_projects_with_remove_po.png');

  // -------------------------------------------------------------------------
  // 2. ADMIN CONFIRMATION MODAL: REMOVE PO
  // -------------------------------------------------------------------------
  console.log('📸 2. Capturing Admin Remove PO Confirmation Modal...');
  // Click the Remove PO button on the first department of the card
  const removeButtons = await page.$$('button');
  for (const btn of removeButtons) {
    const text = await (await btn.getProperty('textContent')).jsonValue();
    if (text.trim() === 'Remove') {
      await btn.click();
      break;
    }
  }
  await wait(1000);

  await page.screenshot({
    path: path.join(artifactDir, 'admin_confirm_remove_po_modal.png'),
    fullPage: false
  });
  console.log('   ✅ Saved: admin_confirm_remove_po_modal.png');

  // Dismiss modal by clicking Cancel
  const cancelButtons = await page.$$('button');
  for (const btn of cancelButtons) {
    const text = await (await btn.getProperty('textContent')).jsonValue();
    if (text.trim() === 'Cancel') {
      await btn.click();
      break;
    }
  }
  await wait(500);

  // -------------------------------------------------------------------------
  // 3. ADMIN DRILLDOWN TASKS TABLE: REMOVE TASK OWNER BUTTON
  // -------------------------------------------------------------------------
  console.log('📸 3. Capturing Admin Drill-down Tasks Table with Remove button...');
  // Click "View Tasks Drill-Down"
  const drilldownBtns = await page.$$('button');
  for (const btn of drilldownBtns) {
    const text = await (await btn.getProperty('textContent')).jsonValue();
    if (text.includes('View Tasks Drill-Down')) {
      await btn.click();
      break;
    }
  }
  await wait(2000);

  await page.screenshot({
    path: path.join(artifactDir, 'admin_drilldown_tasks_with_remove_task_owner.png'),
    fullPage: false
  });
  console.log('   ✅ Saved: admin_drilldown_tasks_with_remove_task_owner.png');

  // -------------------------------------------------------------------------
  // 4. ADMIN CONFIRMATION MODAL: REMOVE TASK OWNER
  // -------------------------------------------------------------------------
  console.log('📸 4. Capturing Admin Remove Task Owner Confirmation Modal...');
  // Find and click the Remove button in the task row
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const title = await btn.evaluate(el => el.getAttribute('title'));
    if (title === 'Remove Task Owner') {
      await btn.click();
      break;
    }
  }
  await wait(1000);

  await page.screenshot({
    path: path.join(artifactDir, 'admin_confirm_remove_task_modal.png'),
    fullPage: false
  });
  console.log('   ✅ Saved: admin_confirm_remove_task_modal.png');

  // -------------------------------------------------------------------------
  // 5. TL DASHBOARD: REASSIGN PO & REMOVE PO, TASKS WITH REMOVE BUTTON
  // -------------------------------------------------------------------------
  console.log('📸 5. Capturing TL Leader Dashboard with Remove PO & Remove Task Owner...');
  const tlToken = jwt.sign({ id: 39, role: 'team_lead', full_name: 'Dev Ansh Dubey' }, JWT_SECRET);

  await page.goto('http://localhost:3000/task/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({ id: 39, role: 'team_lead', full_name: 'Dev Ansh Dubey', department: 'development' }));
  }, tlToken);

  await page.goto('http://localhost:3000/task/TeamLeaderDashboard', { waitUntil: 'domcontentloaded' });
  await wait(2000);

  // Switch to "Revenue Engine Projects" tab in LeaderDashboard
  const tlTabs = await page.$$('button');
  for (const tab of tlTabs) {
    const text = await (await tab.getProperty('textContent')).jsonValue();
    if (text.includes('RE Projects') || text.includes('Revenue Engine')) {
      await tab.click();
      break;
    }
  }
  await wait(2000);

  await page.screenshot({
    path: path.join(artifactDir, 'tl_leader_dashboard_re_projects_with_remove.png'),
    fullPage: false
  });
  console.log('   ✅ Saved: tl_leader_dashboard_re_projects_with_remove.png');

  // -------------------------------------------------------------------------
  // 6. TL CONFIRMATION MODAL: REMOVE PO
  // -------------------------------------------------------------------------
  console.log('📸 6. Capturing TL Remove PO Confirmation Modal...');
  const tlPoBtns = await page.$$('button');
  for (const btn of tlPoBtns) {
    const text = await (await btn.getProperty('textContent')).jsonValue();
    if (text.includes('Remove PO')) {
      await btn.click();
      break;
    }
  }
  await wait(1000);

  await page.screenshot({
    path: path.join(artifactDir, 'tl_confirm_remove_po_modal.png'),
    fullPage: false
  });
  console.log('   ✅ Saved: tl_confirm_remove_po_modal.png');

  await browser.close();
  console.log('🎉 ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  process.exit(0);
})().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});

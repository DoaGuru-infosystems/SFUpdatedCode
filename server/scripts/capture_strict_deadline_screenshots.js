const puppeteer = require('../node_modules/puppeteer-core');
const jwt = require('../node_modules/jsonwebtoken');
const path = require('path');
const { db } = require('../config/db');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\HITS\\.gemini\\antigravity\\brain\\8f6ca9a9-1d79-4d7a-b2c3-90645d599937';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
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
  console.log('🚀 Preparing DB state for Project 157...');
  const projectId = 157;

  // Make sure Task 101 is unassigned so Assign button shows
  await query('UPDATE task_owners SET employee_id = NULL, deadline = NULL, status = "pending" WHERE id = 101');

  console.log('🌐 Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });

  // -------------------------------------------------------------------------
  // 1. ADMIN DRILLDOWN MODAL: ASSIGN TASK WITH STRICT DEADLINE
  // -------------------------------------------------------------------------
  console.log('📸 1. Opening Admin RE Projects & Drilldown...');
  const adminToken = jwt.sign({ id: 6, role: 'admin', full_name: 'Admin User' }, JWT_SECRET);

  await page.goto('http://localhost:3000/task/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({ id: 6, role: 'admin', full_name: 'Admin User' }));
  }, adminToken);

  await page.goto('http://localhost:3000/task/re-projects', { waitUntil: 'networkidle2' });
  await wait(2000);

  // Click View Tasks Drill-Down on project 157 card
  const drillDownBtns = await page.$$('button');
  for (const btn of drillDownBtns) {
    const text = await (await btn.getProperty('textContent')).jsonValue();
    if (text.includes('View Tasks Drill-Down')) {
      await btn.click();
      break;
    }
  }
  await wait(1500);

  // In Drill-Down modal, click Assign on website developmet
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const text = await (await btn.getProperty('textContent')).jsonValue();
    if (text.trim() === 'Assign') {
      await btn.click();
      break;
    }
  }
  await wait(1000);

  // Check the date input min/max attributes in DOM
  const inputAttrs = await page.evaluate(() => {
    const dateInput = document.querySelector('input[type="date"]');
    if (!dateInput) return null;
    return {
      value: dateInput.value,
      min: dateInput.getAttribute('min'),
      max: dateInput.getAttribute('max'),
    };
  });
  console.log('   Admin Date Picker Attributes:', inputAttrs);

  await page.screenshot({
    path: path.join(artifactDir, 'admin_strict_task_assign_modal.png'),
    fullPage: false,
  });
  console.log('   ✅ Saved: admin_strict_task_assign_modal.png');

  // -------------------------------------------------------------------------
  // 2. TL LEADER DASHBOARD: ASSIGN TASK WITH STRICT DEADLINE
  // -------------------------------------------------------------------------
  console.log('\n📸 2. Opening TL Leader Dashboard...');
  // Find a team lead for Development department (e.g. Dev Ansh Dubey)
  const tlRows = await query("SELECT id, full_name, role, department FROM task_users WHERE full_name LIKE '%Dev%' LIMIT 1");
  const tlUser = tlRows.length > 0 ? { ...tlRows[0], role: 'team_lead', department: 'Development' } : { id: 39, role: 'team_lead', department: 'Development', full_name: 'Dev Ansh Dubey' };
  const tlToken = jwt.sign({ id: tlUser.id, role: 'team_lead', department: tlUser.department, full_name: tlUser.full_name }, JWT_SECRET);

  await page.evaluate((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, tlToken, tlUser);

  await page.goto('http://localhost:3000/task/TeamLeaderDashboard?tab=re_projects', { waitUntil: 'networkidle2' });
  await wait(2500);

  // Look for Assign button under RE Projects tab
  const tlBtns = await page.$$('button');
  for (const btn of tlBtns) {
    const text = await (await btn.getProperty('textContent')).jsonValue();
    if (text.trim() === 'Assign') {
      await btn.click();
      break;
    }
  }
  await wait(1000);

  const tlInputAttrs = await page.evaluate(() => {
    const dateInput = document.querySelector('.fixed form input[type="date"]');
    if (!dateInput) return null;
    return {
      value: dateInput.value,
      min: dateInput.getAttribute('min'),
      max: dateInput.getAttribute('max'),
    };
  });
  console.log('   TL Modal Date Picker Attributes:', tlInputAttrs);

  await page.screenshot({
    path: path.join(artifactDir, 'tl_strict_task_assign_modal.png'),
    fullPage: false,
  });
  console.log('   ✅ Saved: tl_strict_task_assign_modal.png');

  await browser.close();
  console.log('\n🎉 Screenshots captured successfully!');
  process.exit(0);
})().catch((err) => {
  console.error('Screenshot error:', err);
  process.exit(1);
});

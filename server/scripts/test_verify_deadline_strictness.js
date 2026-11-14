const { db } = require('../config/db');
const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'Priyanshuisafullstackdeveloper';

// Helper to generate auth token
function makeToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

// Helper to do local HTTP requests
function request(app, method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const data = body ? JSON.stringify(body) : null;
      const reqHeaders = {
        'Content-Type': 'application/json',
        ...(headers || {}),
      };
      if (data) {
        reqHeaders['Content-Length'] = Buffer.byteLength(data);
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let resData = '';
          res.on('data', (chunk) => (resData += chunk));
          res.on('end', () => {
            server.close();
            try {
              resolve({ status: res.statusCode, body: JSON.parse(resData) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: resData });
            }
          });
        }
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (data) req.write(data);
      req.end();
    });
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TEST SUITE: STRICT vs FLEXIBLE DEADLINE VALIDATION');
  console.log('====================================================\n');

  const express = require('express');
  const app = express();
  app.use(express.json());

  // Mount routes
  const projectAssignmentRoutes = require('../router/projectAssignmentRoute');
  app.use(projectAssignmentRoutes);

  // Users for testing from DB
  const [empRow] = await new Promise((resolve) =>
    db.query("SELECT id, full_name, department, role FROM task_users WHERE employment_status = 'active' LIMIT 1", (e, r) => resolve(r || []))
  );

  console.log(`Using Active Employee: ${empRow ? empRow.full_name + ' (id: ' + empRow.id + ')' : 'None'}\n`);

  const adminUser = { id: 1, role: 'admin', full_name: 'Admin Test' };
  const adminToken = makeToken(adminUser);
  const targetEmpId = empRow ? empRow.id : 39;

  let passed = 0;
  let total = 0;

  function assert(desc, condition, extra) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      if (extra) console.error('     Response was:', JSON.stringify(extra));
    }
  }

  try {
    // 1. Direct Assign Task Owner (Admin) - Strict task with deadline beyond project end date
    console.log('TEST 1: Admin Direct Assign - Strict task (website developmet) deadline > project end date (2026-11-14)');
    const res1 = await request(
      app,
      'POST',
      '/api/admin/re-project/157/direct-assign-task-owner',
      { Authorization: `Bearer ${adminToken}` },
      {
        task_id: 101,
        employee_id: targetEmpId,
        deadline: '2026-11-20',
      }
    );
    assert(
      'Should return 400 Bad Request with strict deadline error message',
      res1.status === 400 && res1.body && res1.body.message && res1.body.message.includes('cannot exceed project end date (2026-11-14)'),
      res1
    );

    // 2. Direct Assign Task Owner (Admin) - Strict task with deadline equal to project end date (2026-11-14)
    console.log('\nTEST 2: Admin Direct Assign - Strict task with deadline equal to project end date (2026-11-14)');
    const res2 = await request(
      app,
      'POST',
      '/api/admin/re-project/157/direct-assign-task-owner',
      { Authorization: `Bearer ${adminToken}` },
      {
        task_id: 101,
        employee_id: targetEmpId,
        deadline: '2026-11-14',
      }
    );
    assert(
      'Should return 200 OK for deadline <= project end date',
      res2.status === 200 && res2.body && res2.body.success === true,
      res2
    );

    // 3. Assign Task Owner (TL / PO endpoint) - Strict task deadline beyond project end date
    console.log('\nTEST 3: TL/PO Assign Task Owner - Strict task with deadline 2026-11-25 > 2026-11-14');
    await new Promise((resolve) => db.query("UPDATE task_owners SET employee_id = NULL, deadline = NULL, status = 'pending' WHERE id = 101", resolve));

    const res3 = await request(
      app,
      'POST',
      '/api/employee/assign-task-owner',
      { Authorization: `Bearer ${adminToken}` },
      {
        task_owners_id: 101,
        employee_id: targetEmpId,
        deadline: '2026-11-25',
      }
    );
    assert(
      'Should reject with 400 Bad Request and strict deadline message',
      res3.status === 400 && res3.body && res3.body.message && res3.body.message.includes('cannot exceed project end date'),
      res3
    );

    // 4. Reassign Task Owner - Strict task with deadline beyond project end date
    console.log('\nTEST 4: Reassign Task Owner - Strict task with deadline 2026-11-28 > 2026-11-14');
    await new Promise((resolve) =>
      db.query("UPDATE task_owners SET employee_id = ?, deadline = '2026-11-14', status = 'pending' WHERE id = 101", [targetEmpId], resolve)
    );

    const res4 = await request(
      app,
      'POST',
      '/api/employee/reassign-task',
      { Authorization: `Bearer ${adminToken}` },
      {
        task_owners_id: 101,
        new_employee_id: targetEmpId,
        deadline: '2026-11-28',
      }
    );
    assert(
      'Should reject with 400 Bad Request and strict deadline message',
      res4.status === 400 && res4.body && res4.body.message && res4.body.message.includes('cannot exceed project end date'),
      res4
    );

    // 5. Flexible Category (e.g., SEO) - Should ALLOW deadlines beyond project end date!
    console.log('\nTEST 5: Flexible Category (SEO) - Assigning task beyond project end date (2026-11-30)');
    // Temporarily update task 104 category to 'seo' for testing flexible assignment
    await new Promise((resolve) => db.query("UPDATE task_owners SET category = 'seo' WHERE id = 104", resolve));

    const res5 = await request(
      app,
      'POST',
      '/api/admin/re-project/157/direct-assign-task-owner',
      { Authorization: `Bearer ${adminToken}` },
      {
        task_id: 104,
        employee_id: targetEmpId,
        deadline: '2026-11-30',
      }
    );
    assert(
      'Should return 200 OK because SEO department is flexible (strict_deadline_tracking = 0)',
      res5.status === 200 && res5.body && res5.body.success === true,
      res5
    );

    // Clean up
    await new Promise((resolve) => db.query("UPDATE task_owners SET category = 'smo', employee_id = NULL, deadline = NULL, status = 'pending' WHERE id = 104", resolve));
    await new Promise((resolve) => db.query("UPDATE task_owners SET employee_id = NULL, deadline = NULL, status = 'pending' WHERE id = 101", resolve));

    console.log('\n====================================================');
    console.log(`RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
    console.log('====================================================\n');

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();

const axios = require('axios');

const LOCAL_BASE = 'http://localhost:8080';

const endpoints = [
  // Letters endpoints
  { method: 'GET', url: '/api/offer-letters' },
  { method: 'GET', url: '/api/experience-letters' },
  { method: 'GET', url: '/api/intern-experience-letters' },
  { method: 'GET', url: '/api/intern-ppo-letters' },
  { method: 'GET', url: '/api/relieving-letters' },
  { method: 'GET', url: '/api/termination-letters' },
  { method: 'GET', url: '/api/salary-slips' },
  { method: 'GET', url: '/api/internship-offers' },
  
  // Scheduler endpoints
  { method: 'GET', url: '/api/scheduler/employees' },
  { method: 'GET', url: '/api/scheduler/reminders' },
  { method: 'GET', url: '/api/scheduler/notifications' },
  
  // Development Tasks & Assigned Projects endpoints
  { method: 'GET', url: '/api/get-all-assigned-development-tasks' },
  { method: 'GET', url: '/api/getAllAssignments' },
  { method: 'GET', url: '/test' }
];

async function runTests() {
  console.log('--- Testing Local APIs on', LOCAL_BASE, '---\n');
  
  for (const ep of endpoints) {
    try {
      let res;
      if (ep.method === 'GET') {
        res = await axios.get(`${LOCAL_BASE}${ep.url}`);
      }
      
      console.log(`✅ [${res.status}] ${ep.method} ${ep.url}`);
    } catch (err) {
      if (err.response) {
        console.log(`❌ [${err.response.status}] ${ep.method} ${ep.url}`);
      } else {
        console.log(`❌ [ERR] ${ep.method} ${ep.url} - ${err.message}`);
      }
    }
  }
}

runTests();

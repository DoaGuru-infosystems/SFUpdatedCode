const { db } = require('../config/db');

const sql = `ALTER TABLE task_owners MODIFY COLUMN status ENUM(
  'pending',
  'in_progress',
  'review',
  'waiting_for_approval',
  'scheduled_for_posting',
  'completed'
) DEFAULT 'pending'`;

db.query(sql, (err, result) => {
  if (err) {
    console.error('❌ ALTER TABLE failed:', err.message);
    process.exit(1);
  }
  console.log('✅ ALTER TABLE succeeded:', result);

  db.query('DESCRIBE task_owners', (err2, cols) => {
    if (err2) {
      console.error('❌ DESCRIBE failed:', err2.message);
      process.exit(1);
    }
    const statusCol = cols.find((c) => c.Field === 'status');
    console.log('📋 Updated status column definition:');
    console.log(statusCol);
    process.exit(0);
  });
});


const fs = require('fs');
const path = require('path');
const { db } = require('../../config/db');

const sql = fs.readFileSync(path.join(__dirname, '005_create_assignment_history.sql'), 'utf8');

console.log('Running 005_create_assignment_history migration...');

db.query(sql, (err, result) => {
  if (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Migration 005 completed successfully: assignment_history table created.');

  db.query('DESCRIBE assignment_history', (descErr, rows) => {
    if (descErr) {
      console.error('Failed to describe assignment_history:', descErr.message);
      process.exit(1);
    }
    console.log('assignment_history schema:');
    console.table(rows.map(r => ({ Field: r.Field, Type: r.Type, Null: r.Null, Key: r.Key, Default: r.Default })));
    process.exit(0);
  });
});


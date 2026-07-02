const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the server/.env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'sf',
  port: parseInt(process.env.DB_PORT) || 3306,
  multipleStatements: true // Allows running all SQL commands in one query call
};

async function run() {
  console.log('Connecting to MySQL database:', dbConfig.database, 'on', dbConfig.host);
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server.');

    // Path to the SQL file
    const sqlFilePath = path.join(__dirname, '../../letter-doaguru/mydoaguru_letters.sql');
    console.log('Reading SQL file from:', sqlFilePath);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found at path: ${sqlFilePath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL statements...');
    
    // Execute the entire SQL script
    await connection.query(sqlContent);
    
    console.log('✅ Database tables and data imported successfully!');
  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed.');
    }
  }
}

run();

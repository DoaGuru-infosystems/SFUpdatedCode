const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'sf',
  port: parseInt(process.env.DB_PORT) || 3306
};

async function check() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Successfully connected to database:', dbConfig.database);
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:');
    console.log(tables.map(t => Object.values(t)[0]));

    const [offerLetters] = await connection.query('SELECT COUNT(*) as count FROM offer_letters');
    console.log('Number of rows in offer_letters:', offerLetters[0].count);

    const [experienceLetters] = await connection.query('SELECT COUNT(*) as count FROM experincel');
    console.log('Number of rows in experincel:', experienceLetters[0].count);

  } catch (error) {
    console.error('Test query failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

check();

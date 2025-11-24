const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection().then(connection => {
  console.log('Connected to MySQL database (loan)!');
  connection.release();
}).catch(err => {
  console.error('Database connection failed: ', err);
});

module.exports = pool;
// // config/db.js
// const mysql = require('mysql2/promise');
// require('dotenv').config({ path: '.env' });

// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     port: process.env.DB_PORT,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
// });

// module.exports = pool;


const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});

// บน Render ใช้ใบรับรองจาก Environment Variable
// ในเครื่องใช้ไฟล์ server/ca.pem ตามเดิม
let caCertificate;

if (process.env.DB_CA_CERT_BASE64) {
  caCertificate = Buffer.from(
    process.env.DB_CA_CERT_BASE64,
    'base64'
  ).toString('utf8');
} else {
  const caPath = process.env.CA_CERT_PATH
    ? path.resolve(process.env.CA_CERT_PATH)
    : path.join(__dirname, '..', 'ca.pem');

  caCertificate = fs.readFileSync(caPath, 'utf8');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    ca: caCertificate,
    rejectUnauthorized: true
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

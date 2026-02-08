const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'odoo_headless',
  user: process.env.DB_USER || 'odoo',
  password: process.env.DB_PASSWORD || 'odoo',
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error', err);
});

module.exports = pool;

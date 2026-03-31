const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: 5432, // Default PostgreSQL port
});

// Configure schema on connection
pool.on('connect', (client) => {
    client.query(`SET search_path TO ${process.env.DB_SCHEMA || 'public'}`);
});

console.log(`Database pool initialized for host: ${process.env.DB_HOST}, schema: ${process.env.DB_SCHEMA}`);

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};

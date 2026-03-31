const db = require('./src/config/db');

async function addAssignedAt() {
    try {
        console.log('Intentando agregar columna "assigned_at" a "log_routes"...');
        await db.query(`
            ALTER TABLE log_routes ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITHOUT TIME ZONE;
        `);
        console.log('Columna "assigned_at" agregada (o ya existía).');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

addAssignedAt();

const db = require('./src/config/db');

async function inspectLogRoutes() {
    try {
        console.log('Inspeccionando estructura de la tabla "log_routes"...');
        const columns = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'log_routes'
            ORDER BY ordinal_position
        `);

        columns.rows.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

inspectLogRoutes();

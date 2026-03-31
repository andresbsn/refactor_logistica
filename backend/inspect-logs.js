const db = require('./src/config/db');

async function inspectLogTables() {
    try {
        console.log('Inspeccionando tablas con prefijo "log_"...');
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'sistema147' AND table_name LIKE 'log_%'
            ORDER BY table_name
        `);

        for (const table of tables.rows) {
            console.log(`\n--- Estructura de: ${table.table_name} ---`);
            const columns = await db.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'sistema147' AND table_name = $1
                ORDER BY ordinal_position
            `, [table.table_name]);

            columns.rows.forEach(col => {
                console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

inspectLogTables();

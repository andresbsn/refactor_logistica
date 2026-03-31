const db = require('./src/config/db');

async function inspectVehicleTable() {
    try {
        const columns = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'log_route_vehicle'
            ORDER BY ordinal_position
        `);

        console.log('=== log_route_vehicle columns ===');
        columns.rows.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        const samples = await db.query('SELECT * FROM log_route_vehicle LIMIT 3');
        console.log('\n=== Sample data ===');
        console.log(JSON.stringify(samples.rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

inspectVehicleTable();
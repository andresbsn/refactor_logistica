const db = require('./src/config/db');

async function inspectTickets() {
    try {
        console.log('Inspeccionando estructura de la tabla "tickets"...');
        const columns = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'sistema147' AND table_name = 'tickets'
            ORDER BY ordinal_position
        `);

        columns.rows.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        console.log('\nObteniendo los últimos 3 tickets...');
        const samples = await db.query('SELECT * FROM tickets ORDER BY creado DESC LIMIT 3');
        console.table(samples.rows);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

inspectTickets();

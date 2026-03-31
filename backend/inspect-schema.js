const db = require('./src/config/db');

async function inspectTables() {
    const tables = ['agentes_gruposagentes', 'tipos_grupos', 'tickets'];
    for (const table of tables) {
        console.log(`\n--- Table: ${table} ---`);
        try {
            const { rows } = await db.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table]);
            rows.forEach(row => {
                console.log(`${row.column_name}: ${row.data_type}`);
            });
        } catch (err) {
            console.error(`Error inspecting table ${table}:`, err.message);
        }
    }
    process.exit(0);
}

inspectTables();

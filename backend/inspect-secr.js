const db = require('./src/config/db');

async function inspectSecr() {
    try {
        console.log('Inspeccionando estructura de la tabla "secr"...');
        const columns = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'sistema147' AND table_name = 'secr'
            ORDER BY ordinal_position
        `);

        columns.rows.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        console.log('\nObteniendo algunos usuarios (ocultando claves completas por seguridad)...');
        // Usar claves parciales para ver si parecen hashes
        const samples = await db.query('SELECT unica, usuario, left(clave, 10) as hash_start, nivel_app FROM secr WHERE borrado = 0 LIMIT 5');
        console.table(samples.rows);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

inspectSecr();

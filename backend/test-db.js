const db = require('./src/config/db');

async function testConnection() {
    try {
        console.log('Probando conexión a la base de datos...');
        const res = await db.query('SELECT current_schema(), now()');
        console.log('¡Conexión exitosa!');
        console.log('Schema actual:', res.rows[0].current_schema);
        console.log('Hora servidor:', res.rows[0].now);

        console.log('\nListando tablas en el schema sistema147:');
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'sistema147'
            ORDER BY table_name
        `);

        if (tables.rows.length === 0) {
            console.log('No se encontraron tablas en el schema sistema147.');
        } else {
            tables.rows.forEach(row => console.log(`- ${row.table_name}`));
        }

        process.exit(0);
    } catch (err) {
        console.error('Error conectando a la base de datos:', err.message);
        process.exit(1);
    }
}

testConnection();

const db = require('./src/config/db');

async function inspectSecr() {
    try {
        const samples = await db.query('SELECT unica, usuario, left(clave, 15) as hash_start, nivel_app FROM secr WHERE borrado = 0 LIMIT 5');
        samples.rows.forEach(row => {
            console.log(`User: ${row.usuario}, Start: ${row.hash_start}, Role: ${row.nivel_app}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

inspectSecr();

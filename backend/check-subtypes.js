const db = require('./src/config/db');

async function checkSubtypes() {
    try {
        const subtipos = await db.query('SELECT id, texto FROM subtipos WHERE id_tipo = 3 ORDER BY id');
        console.log(JSON.stringify(subtipos.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkSubtypes();

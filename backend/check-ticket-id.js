const db = require('./src/config/db');

async function checkTicket(id) {
    try {
        const res = await db.query('SELECT id, tipo, subtipo, prioridad, asunto FROM tickets WHERE id = $1', [id]);
        console.log(JSON.stringify(res.rows[0], null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTicket(173410);

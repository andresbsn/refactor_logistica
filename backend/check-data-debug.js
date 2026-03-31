const db = require('./src/config/db');

async function checkSubtypes() {
    try {
        console.log('--- Subtipos para Tipo 3 (Alumbrado) ---');
        const subtipos = await db.query('SELECT id, texto FROM subtipos WHERE id_tipo = 3');
        subtipos.rows.forEach(row => console.log(`ID: ${row.id}, Texto: ${row.texto}`));

        console.log('\n--- Muestra de Tickets ---');
        const tickets = await db.query('SELECT nro_ticket, tipo, subtipo, prioridad, asunto FROM tickets WHERE tipo = 3 LIMIT 10');
        tickets.rows.forEach(row => {
            console.log(`Ticket: ${row.nro_ticket}, Tipo: ${row.tipo}, Subtipo: ${row.subtipo}, Prioridad: ${row.prioridad}, Asunto: ${row.asunto}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkSubtypes();

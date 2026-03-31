const db = require('./src/config/db');

async function checkTickets() {
    try {
        const res = await db.query(`
            SELECT t.id, t.nro_ticket, t.subtipo, s.texto, t.prioridad 
            FROM tickets t 
            JOIN subtipos s ON t.subtipo = s.id
            WHERE t.tipo = 3 AND t.estado ILIKE 'open'
            ORDER BY t.subtipo
        `);
        console.log(`Open tickets count: ${res.rows.length}`);
        const counts = {};
        res.rows.forEach(r => {
            counts[r.texto] = (counts[r.texto] || 0) + 1;
        });
        console.log('Counts per subtype:');
        console.log(JSON.stringify(counts, null, 2));

        console.log('\nSample tickets for 6 and 7:');
        console.log(JSON.stringify(res.rows.filter(r => r.subtipo == 6 || r.subtipo == 7).slice(0, 5), null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkTickets();

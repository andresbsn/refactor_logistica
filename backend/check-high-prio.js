const db = require('./src/config/db');

async function checkHighPrio() {
    try {
        const res = await db.query(`
            SELECT t.id, t.subtipo, s.texto, t.prioridad 
            FROM tickets t 
            JOIN subtipos s ON t.subtipo = s.id
            WHERE t.tipo = 3 AND t.estado ILIKE 'open' 
              AND (t.prioridad ILIKE 'high' OR t.prioridad ILIKE 'alta' OR t.prioridad ILIKE 'critica')
        `);
        console.log(`High priority tickets (manual): ${res.rows.length}`);
        res.rows.forEach(r => console.log(`ID: ${r.id}, Sub: ${r.texto}, Prio: ${r.prioridad}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkHighPrio();

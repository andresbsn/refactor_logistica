const db = require('./src/config/db');

async function listColumns() {
    try {
        const res2 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tickets' AND table_schema = 'sistema147' AND column_name LIKE '%grupo%'");
        console.log('Group columns:', res2.rows);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

listColumns();
